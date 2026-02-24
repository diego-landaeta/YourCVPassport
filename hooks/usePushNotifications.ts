import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

/**
 * VAPID public key — set VITE_VAPID_PUBLIC_KEY in your .env.local
 * Generate a key pair with: npx web-push generate-vapid-keys
 * Store the private key in a Supabase secret for the edge function.
 */
const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Convert VAPID base64url key to Uint8Array for pushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermission = 'default' | 'granted' | 'denied';

export const usePushNotifications = () => {
  const { session } = useAuth();

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;

  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ── Sync current permission state ──────────────────────── */
  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission as PushPermission);
  }, [isSupported]);

  /* ── Check if SW already has a push subscription ─────────── */
  useEffect(() => {
    if (!isSupported || !session?.user.id || !('PushManager' in window)) return;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {});
  }, [isSupported, session?.user.id]);

  /* ── Request browser notification permission ────────────── */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      return result === 'granted';
    } catch {
      return false;
    }
  }, [isSupported]);

  /* ── Subscribe to Web Push and store in Supabase ─────────── */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!session?.user.id || !isSupported) return false;
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[PushNotifications] VITE_VAPID_PUBLIC_KEY not set — push not available');
      return false;
    }

    try {
      setIsLoading(true);
      const reg = await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const p256dhBuffer = sub.getKey('p256dh');
      const authBuffer   = sub.getKey('auth');
      if (!p256dhBuffer || !authBuffer) throw new Error('Missing push encryption keys');

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhBuffer)));
      const auth   = btoa(String.fromCharCode(...new Uint8Array(authBuffer)));

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id:    session.user.id,
            endpoint:   sub.endpoint,
            p256dh,
            auth,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) throw error;

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[PushNotifications] Subscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user.id, isSupported]);

  /* ── Unsubscribe ─────────────────────────────────────────── */
  const unsubscribe = useCallback(async () => {
    if (!session?.user.id || !isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', session.user.id)
          .eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('[PushNotifications] Unsubscribe error:', err);
    }
  }, [session?.user.id, isSupported]);

  /* ── Request permission then subscribe ───────────────────── */
  const requestPermissionAndSubscribe = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermission();
    if (granted) return subscribe();
    return false;
  }, [requestPermission, subscribe]);

  /**
   * Show a local notification via the service worker
   * (works even when the tab is not focused, but browser must be open)
   */
  const showLocalNotification = useCallback(
    (title: string, options?: NotificationOptions & { url?: string }) => {
      if (!isSupported || Notification.permission !== 'granted') return;

      const { url, ...notifOptions } = options ?? {};
      const finalOptions: NotificationOptions = {
        icon:  '/favicon-192x192.png',
        badge: '/favicon-32x32.png',
        ...notifOptions,
        data: { url: url || '/', ...(notifOptions.data ?? {}) },
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, finalOptions))
          .catch(() => new Notification(title, finalOptions));
      } else {
        new Notification(title, finalOptions);
      }
    },
    [isSupported]
  );

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    hasVapidKey: !!VAPID_PUBLIC_KEY,
    requestPermission,
    subscribe,
    unsubscribe,
    requestPermissionAndSubscribe,
    showLocalNotification,
  };
};
