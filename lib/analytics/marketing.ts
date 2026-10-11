import { trackEvent, type EventType } from '@/lib/analytics/tracker';

type MarketingEventName = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead';
type MarketingParams = {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  [key: string]: unknown;
};

type MarketingWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track?: (event: string, params?: MarketingParams) => void };
  gtag?: (...args: unknown[]) => void;
};

const eventMap: Partial<Record<MarketingEventName, EventType>> = {
  ViewContent: 'view_content',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'initiate_checkout',
  Purchase: 'purchase',
  Lead: 'lead',
};

export function trackMarketingEvent(
  eventName: MarketingEventName,
  params: MarketingParams = {},
  resourceId?: string,
) {
  if (typeof window !== 'undefined') {
    const marketingWindow = window as MarketingWindow;
    marketingWindow.fbq?.('track', eventName, params);
    marketingWindow.ttq?.track?.(eventName, params);
    marketingWindow.gtag?.('event', eventName, params);
  }

  const internalEvent = eventMap[eventName];
  if (internalEvent) {
    void trackEvent(internalEvent, resourceId, { marketing_event: eventName, ...params });
  }
}
