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
    <div className="relative min-h-screen bg-obsidian-900 text-foreground selection:bg-crimson-700 selection:text-white">
      <PublicHeader initialSiteContent={publicSettings?.site} />
      <main>{children}</main>
      <RadialPortalMenu initialItems={publicSettings?.portalMenuItems} />
      <ScriptInjector configs={pixels} />
    </div>
  );
}
