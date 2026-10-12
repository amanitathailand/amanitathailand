import React from 'react';
import { PublicHeader } from '@/components/navigation/PublicHeader';
import { RadialPortalMenu } from '@/components/navigation/RadialPortalMenu';
import { ScriptInjector } from '@/components/analytics/ScriptInjector';
import { getPublicSettings } from '@/lib/data/getPublicSettings';
import { getActivePixels } from '@/lib/data/getActivePixels';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [publicSettings, pixels] = await Promise.all([
    getPublicSettings().catch((error) => {
      console.error('Public layout settings query failed:', error);
      return null;
    }),
    getActivePixels().catch((error) => {
      console.error('Public pixel config query failed:', error);
      return [];
    }),
  ]);

  return (
    <>
      {pixels.filter((pixel) => pixel.provider === 'meta' && pixel.is_active && pixel.pixel_id).map((pixel) => {
        const pixelId = String(pixel.pixel_id).replace(/[^0-9]/g, '');
        if (!pixelId) return null;
        return (
          <head key={`meta-head-${pixelId}`}>
            <script dangerouslySetInnerHTML={{ __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
              (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${pixelId}');fbq('track','PageView');
            ` }} />
          </head>
        );
      })}
      <div className="relative min-h-screen bg-obsidian-900 text-foreground selection:bg-crimson-700 selection:text-white">
      <PublicHeader initialSiteContent={publicSettings?.site} />
      <main>{children}</main>
      <RadialPortalMenu initialItems={publicSettings?.portalMenuItems} />
      <ScriptInjector configs={pixels} />
      {pixels.filter((pixel) => pixel.provider === 'meta' && pixel.is_active && pixel.pixel_id).map((pixel) => {
        const pixelId = String(pixel.pixel_id).replace(/[^0-9]/g, '');
        return pixelId ? <noscript key={`meta-noscript-${pixelId}`}><img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} alt="" /></noscript> : null;
      })}
      </div>
    </>
  );
}
