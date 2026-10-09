import React from 'react';
import { PublicHeader } from '@/components/navigation/PublicHeader';
import { RadialPortalMenu } from '@/components/navigation/RadialPortalMenu';
import { ScriptInjector } from '@/components/analytics/ScriptInjector';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-obsidian-900 text-mushroomWhite selection:bg-crimson-800 selection:text-amberGold-200">
      <PublicHeader />
      <main>{children}</main>
      <RadialPortalMenu />
      <ScriptInjector />
    </div>
  );
}
