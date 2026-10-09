import React from 'react';
import { PublicHeader } from '@/components/navigation/PublicHeader';
import { RadialPortalMenu } from '@/components/navigation/RadialPortalMenu';
import { ScriptInjector } from '@/components/analytics/ScriptInjector';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-obsidian-900 text-foreground selection:bg-crimson-700 selection:text-white">
      <PublicHeader />
      <main>{children}</main>
      <RadialPortalMenu />
      <ScriptInjector />
    </div>
  );
}
