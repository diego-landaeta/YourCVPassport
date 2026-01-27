import { useEffect } from 'react';
import { supabase } from '../supabase/client';

// Generar o recuperar un visitor_id único
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

// Verificar si el usuario autenticado es el dueño del perfil
async function isOwnProfile(profileId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Obtener el perfil para verificar si pertenece al usuario actual
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    return profile?.user_id === user.id;
  } catch {
    return false;
  }
}

// Verificar si ya se registró una visita reciente de este visitor_id
function hasRecentView(profileId: string, visitorId: string): boolean {
  const storageKey = `view_${profileId}_${visitorId}`;
  const lastView = localStorage.getItem(storageKey);

  if (lastView) {
    const lastViewTime = parseInt(lastView, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Si la última visita fue hace menos de 24 horas, no registrar
    if (now - lastViewTime < twentyFourHours) {
      return true;
    }
  }

  return false;
}

// Marcar que se registró una visita
function markViewRecorded(profileId: string, visitorId: string): void {
  const storageKey = `view_${profileId}_${visitorId}`;
  localStorage.setItem(storageKey, Date.now().toString());
}

// Trackear visita a un perfil (solo si no es el propio usuario y no hay visita reciente)
export async function trackView(profileId: string) {
  if (!profileId) return;

  try {
    // No registrar si es el propio usuario viendo su perfil
    const isOwner = await isOwnProfile(profileId);
    if (isOwner) return;

    const visitorId = getVisitorId();

    // No registrar si ya hay una visita reciente de este visitante
    if (hasRecentView(profileId, visitorId)) return;

    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';

    const { error } = await supabase.from('analytics_views').insert({
      profile_id: profileId,
      visitor_id: visitorId,
      user_agent: userAgent,
      referrer: referrer,
    });

    // Solo marcar como registrado si se insertó correctamente
    if (!error) {
      markViewRecorded(profileId, visitorId);
    }
  } catch (error) {

  }
}

// Trackear clic en un CTA (botón de contacto, LinkedIn, etc.)
export async function trackClick(profileId: string, ctaType: string, ctaLabel?: string) {
  if (!profileId) return;

  try {
    const visitorId = getVisitorId();

    await supabase.from('analytics_clicks').insert({
      profile_id: profileId,
      visitor_id: visitorId,
      cta_type: ctaType,
      cta_label: ctaLabel,
    });
  } catch (error) {
    
  }
}

// Trackear lead/contacto
export async function trackLead(
  profileId: string,
  data: {
    name?: string;
    email?: string;
    company?: string;
    message?: string;
    source?: string;
  }
) {
  if (!profileId) return;

  try {
    await supabase.from('analytics_leads').insert({
      profile_id: profileId,
      ...data,
      status: 'new',
    });
  } catch (error) {
    
  }
}

// Hook para trackear automáticamente la vista de un perfil
export function useAnalytics(profileId: string | null) {
  useEffect(() => {
    if (profileId) {
      trackView(profileId);
    }
  }, [profileId]);
}

// Obtener estadísticas del dashboard
export async function getAnalyticsStats(profileId: string) {
  if (!profileId) return null;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Visitas totales en los últimos 30 días
    const { count: totalViews } = await supabase
      .from('analytics_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('viewed_at', thirtyDaysAgo.toISOString());

    // Clics totales en los últimos 30 días
    const { count: totalClicks } = await supabase
      .from('analytics_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('clicked_at', thirtyDaysAgo.toISOString());

    // Visitas por día (últimos 30 días)
    const { data: viewsData } = await supabase
      .from('analytics_views')
      .select('viewed_at')
      .eq('profile_id', profileId)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .order('viewed_at', { ascending: true });

    // Leads recientes
    const { data: leads } = await supabase
      .from('analytics_leads')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fuentes de tráfico (referrers)
    const { data: referrers } = await supabase
      .from('analytics_views')
      .select('referrer')
      .eq('profile_id', profileId)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .not('referrer', 'is', null)
      .not('referrer', 'eq', '');

    // Top países
    const { data: countries } = await supabase
      .from('analytics_views')
      .select('country')
      .eq('profile_id', profileId)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .not('country', 'is', null);

    // Procesar datos de visitas por día
    const viewsByDay = processViewsByDay(viewsData || []);

    // Procesar fuentes de tráfico
    const trafficSources = processTrafficSources(referrers || []);

    // Procesar países
    const topCountries = processTopCountries(countries || []);

    return {
      totalViews: totalViews || 0,
      totalClicks: totalClicks || 0,
      viewsByDay,
      leads: leads || [],
      trafficSources,
      topCountries,
    };
  } catch (error) {
    
    return null;
  }
}

// Procesar visitas por día
function processViewsByDay(views: any[]) {
  const viewsMap: { [key: string]: number } = {};

  views.forEach((view) => {
    const date = new Date(view.viewed_at).toISOString().split('T')[0];
    viewsMap[date] = (viewsMap[date] || 0) + 1;
  });

  return Object.entries(viewsMap).map(([date, count]) => ({
    date,
    views: count,
  }));
}

// Procesar fuentes de tráfico
function processTrafficSources(referrers: any[]) {
  const sourcesMap: { [key: string]: number } = {};

  referrers.forEach((item) => {
    const source = getSourceFromReferrer(item.referrer);
    sourcesMap[source] = (sourcesMap[source] || 0) + 1;
  });

  const total = referrers.length || 1;
  return Object.entries(sourcesMap).map(([source, count]) => ({
    source,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

// Extraer fuente del referrer
function getSourceFromReferrer(referrer: string): string {
  if (!referrer) return 'Directo';

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes('linkedin')) return 'LinkedIn';
    if (hostname.includes('google')) return 'Google';
    if (hostname.includes('facebook')) return 'Facebook';
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter';
    if (hostname.includes('instagram')) return 'Instagram';

    return hostname;
  } catch {
    return 'Otros';
  }
}

// Procesar top países
function processTopCountries(countries: any[]) {
  const countriesMap: { [key: string]: number } = {};

  countries.forEach((item) => {
    if (item.country) {
      countriesMap[item.country] = (countriesMap[item.country] || 0) + 1;
    }
  });

  return Object.entries(countriesMap)
    .map(([country, count]) => ({
      country,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
