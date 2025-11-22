/**
 * Analytics Tracker - Client-side tracking utility
 *
 * Features:
 * - Automatic page view tracking
 * - CTA click tracking
 * - Session management
 * - GDPR compliant (no PII stored)
 * - Lightweight and performant
 */

interface TrackEventOptions {
  profileId: string;
  eventType: 'VIEW' | 'CLICK_CTA' | 'DOWNLOAD_CV' | 'SHARE';
  ctaType?: string;
  ctaLabel?: string;
  metadata?: Record<string, any>;
}

class AnalyticsTracker {
  private sessionId: string;
  private trackingEndpoint: string;
  private optedOut: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.trackingEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-analytics`;
    this.checkOptOut();
  }

  /**
   * Check if user has opted out of tracking
   */
  private checkOptOut(): void {
    this.optedOut = localStorage.getItem('analytics_opt_out') === 'true';
  }

  /**
   * Allow user to opt out of tracking (GDPR compliance)
   */
  public optOut(): void {
    localStorage.setItem('analytics_opt_out', 'true');
    this.optedOut = true;
    console.log('Analytics tracking disabled');
  }

  /**
   * Allow user to opt back in
   */
  public optIn(): void {
    localStorage.removeItem('analytics_opt_out');
    this.optedOut = false;
    console.log('Analytics tracking enabled');
  }

  /**
   * Get or create a session ID
   * Session expires after 30 minutes of inactivity
   */
  private getOrCreateSessionId(): string {
    const storageKey = 'analytics_session';
    const expirationKey = 'analytics_session_expiration';
    const sessionDuration = 30 * 60 * 1000; // 30 minutes

    const now = Date.now();
    const expiration = localStorage.getItem(expirationKey);

    // Check if session is still valid
    if (expiration && parseInt(expiration) > now) {
      const sessionId = localStorage.getItem(storageKey);
      if (sessionId) {
        // Extend session
        localStorage.setItem(expirationKey, (now + sessionDuration).toString());
        return sessionId;
      }
    }

    // Create new session
    const newSessionId = this.generateSessionId();
    localStorage.setItem(storageKey, newSessionId);
    localStorage.setItem(expirationKey, (now + sessionDuration).toString());

    return newSessionId;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
    const ua = navigator.userAgent.toLowerCase();

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }

    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent)) {
      return 'mobile';
    }

    return 'desktop';
  }

  /**
   * Parse UTM parameters from URL
   */
  private getUTMParameters(): {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  } {
    const params = new URLSearchParams(window.location.search);

    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    };
  }

  /**
   * Track an analytics event
   */
  public async trackEvent(options: TrackEventOptions): Promise<boolean> {
    // Don't track if user opted out
    if (this.optedOut) {
      return false;
    }

    try {
      const utm = this.getUTMParameters();

      const payload = {
        profileId: options.profileId,
        eventType: options.eventType,
        sessionId: this.sessionId,
        referrer: document.referrer || undefined,
        deviceType: this.detectDeviceType(),
        ctaType: options.ctaType,
        ctaLabel: options.ctaLabel,
        metadata: options.metadata,
        ...utm,
      };

      const response = await fetch(this.trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Analytics tracking failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error tracking analytics:', error);
      return false;
    }
  }

  /**
   * Track a page view
   */
  public async trackPageView(profileId: string): Promise<boolean> {
    return this.trackEvent({
      profileId,
      eventType: 'VIEW',
    });
  }

  /**
   * Track a CTA click
   */
  public async trackCTAClick(
    profileId: string,
    ctaType: string,
    ctaLabel: string
  ): Promise<boolean> {
    return this.trackEvent({
      profileId,
      eventType: 'CLICK_CTA',
      ctaType,
      ctaLabel,
    });
  }

  /**
   * Track a CV download
   */
  public async trackDownload(profileId: string): Promise<boolean> {
    return this.trackEvent({
      profileId,
      eventType: 'DOWNLOAD_CV',
    });
  }

  /**
   * Track a profile share
   */
  public async trackShare(profileId: string, platform?: string): Promise<boolean> {
    return this.trackEvent({
      profileId,
      eventType: 'SHARE',
      metadata: { platform },
    });
  }
}

// Export singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Export hook for React components
export function useAnalyticsTracker() {
  return analyticsTracker;
}
