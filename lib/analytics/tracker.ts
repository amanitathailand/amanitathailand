import { createClient } from '@/lib/supabase/client';

export type EventType = 
  | 'page_view'
  | 'museum_entry'
  | 'hall_open'
  | 'exhibit_open'
  | 'article_view'
  | 'product_view'
  | 'line_click'
  | 'facebook_click'
  | 'contact_submit';

export async function trackEvent(
  eventType: EventType,
  resourceId?: string,
  payload: Record<string, any> = {}
) {
  try {
    const supabase = createClient();
    let sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('amanita_session_id') : null;
    if (!sessionId && typeof window !== 'undefined') {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('amanita_session_id', sessionId);
    }

    await supabase.from('analytics_events').insert({
      event_type: eventType,
      resource_id: resourceId || null,
      session_id: sessionId || 'unknown',
      payload,
    });
  } catch (err) {
    console.debug('Analytics tracker event failed silently:', err);
  }
}
