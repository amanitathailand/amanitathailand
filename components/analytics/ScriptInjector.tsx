'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { PixelConfig } from '@/types';

export function ScriptInjector({ configs: initialConfigs = [] }: { configs?: PixelConfig[] }) {
  const [configs, setConfigs] = useState<PixelConfig[]>(initialConfigs);

  useEffect(() => {
    if (configs && configs.length > 0) return;
    
    // Fetch pixel configs from internal server API (/api/pixels) to prevent CORS issues
    const loadPixels = async () => {
      try {
        const res = await fetch('/api/pixels');
        if (res.ok) {
          const json = await res.json();
          if (json.pixels && Array.isArray(json.pixels)) {
            setConfigs(json.pixels);
          }
        }
      } catch {
        // Silently ignore tracking errors
      }
    };

    loadPixels();
  }, [configs]);

  if (!configs || configs.length === 0) return null;

  return (
    <>
      {configs.map((c) => {
        if (!c.is_active || !c.pixel_id) return null;

        const uniqueKey = c.id || c.provider;

        if (c.provider === 'ga4') {
          return (
            <React.Fragment key={uniqueKey}>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${c.pixel_id}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${c.pixel_id}', { page_path: window.location.pathname });
                `}
              </Script>
            </React.Fragment>
          );
        }

        if (c.provider === 'gtm') {
          return (
            <Script id="gtm-init" strategy="afterInteractive" key={uniqueKey}>
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${c.pixel_id}');
              `}
            </Script>
          );
        }

        if (c.provider === 'meta') {
          return (
            <Script id="meta-pixel" strategy="afterInteractive" key={uniqueKey}>
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${c.pixel_id}');
                fbq('track', 'PageView');
              `}
            </Script>
          );
        }

        if (c.provider === 'tiktok') {
          return (
            <Script id="tiktok-pixel" strategy="afterInteractive" key={uniqueKey}>
              {`
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;var tt=w[t]=w[t]||[];tt.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],tt.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<tt.methods.length;i++)tt.setAndDefer(tt,tt.methods[i]);tt.instance=function(t){for(var e=tt._i[t]||[],n=0;n<tt.methods.length;n++)tt.setAndDefer(e,tt.methods[n]);return e},tt.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";tt._i=tt._i||{},tt._i[e]=[],tt._i[e]._u=i,tt._t=tt._t||{},tt._t[e]=+new Date,tt._o=tt._o||{},tt._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=i+"?sdkid="+e+"&lib="+t;var o=d.getElementsByTagName("script")[0];o.parentNode.insertBefore(a,o)};
                  tt.load('${c.pixel_id}');
                  tt.page();
                }(window, document, 'ttq');
              `}
            </Script>
          );
        }

        if (c.provider === 'clarity') {
          return (
            <Script id="clarity-init" strategy="afterInteractive" key={uniqueKey}>
              {`
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${c.pixel_id}");
              `}
            </Script>
          );
        }

        return null;
      })}
    </>
  );
}
