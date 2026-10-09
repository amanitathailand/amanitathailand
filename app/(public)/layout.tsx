import React from 'react';
import { PublicHeader } from '@/components/navigation/PublicHeader';
import { RadialPortalMenu } from '@/components/navigation/RadialPortalMenu';
import { ScriptInjector } from '@/components/analytics/ScriptInjector';
import { getPublicSettings } from '@/lib/data/getPublicSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let publicSettings: Awaited<ReturnType<typeof getPublicSettings>> | null = null;
  try {
    publicSettings = await getPublicSettings();
  } catch (error) {
    console.error('Public layout settings query failed:', error);
  }

  return (
    <div className="relative min-h-screen bg-obsidian-900 text-foreground selection:bg-crimson-700 selection:text-white">
      <PublicHeader initialSiteContent={publicSettings?.site} />
      <main>{children}</main>
      <RadialPortalMenu initialItems={publicSettings?.portalMenuItems} />
      <ScriptInjector />
    </div>
  );
}
