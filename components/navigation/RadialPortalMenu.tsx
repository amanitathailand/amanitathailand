'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useMuseumStore } from '@/store/useMuseumStore';
import { Sparkles, Compass, BookOpen, Layers, PhoneCall, Feather, Package, X, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PortalMenuIcon, PortalMenuItem } from '@/types';
import { INITIAL_PORTAL_MENU_ITEMS } from '@/lib/data/portalMenu';
import { trackEvent } from '@/lib/analytics/tracker';

const PORTAL_ICONS: Partial<Record<Exclude<PortalMenuIcon, 'none'>, LucideIcon>> = {
  sparkles: Sparkles,
  compass: Compass,
  book: BookOpen,
  layers: Layers,
  phone: PhoneCall,
  feather: Feather,
  package: Package,
};

function isSafeInternalHref(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
}

function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

function isPortalMenuItem(value: unknown): value is PortalMenuItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PortalMenuItem>;
  return typeof item.id === 'string'
    && typeof item.label === 'string'
    && typeof item.sub === 'string'
    && isSafeInternalHref(item.href)
    && (item.status === 'published' || item.status === 'draft')
    && (item.icon_key === undefined || item.icon_key === 'none' || item.icon_key in PORTAL_ICONS)
    && (item.image_url === undefined || item.image_url === '' || isSafeImageUrl(item.image_url));
}

export function RadialPortalMenu() {
  const { isPortalOpen, closePortal } = useMuseumStore();
  const [isMobile, setIsMobile] = useState(false);
  const [menuItems, setMenuItems] = useState<PortalMenuItem[]>(INITIAL_PORTAL_MENU_ITEMS);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isPortalOpen) return;

    let cancelled = false;
    fetch('/api/settings', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.site?.portal_menu_items)) return;
        const savedItems = result.site.portal_menu_items.filter(isPortalMenuItem).sort(
          (a: PortalMenuItem, b: PortalMenuItem) => a.sort_order - b.sort_order
        );
        if (!cancelled) setMenuItems(savedItems);
      })
      .catch((error) => console.warn('Load radial portal menu notice:', error));
    return () => { cancelled = true; };
  }, [isPortalOpen]);

  const activeItems = menuItems
    .filter((item) => item.status === 'published')
    .sort((a, b) => a.sort_order - b.sort_order);
  const radius = Math.min(285, 230 + Math.max(0, activeItems.length - 7) * 8);

  return (
    <AnimatePresence>
      {isPortalOpen && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 p-4">
          {/* Ambient Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-md pointer-events-auto"
            onClick={closePortal}
          />

          {isMobile ? (
            /* --- MOBILE VIEW: Elegant Mystical Portal Sheet --- */
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-3xl border border-crimson-800/80 bg-obsidian-900/95 p-5 shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col"
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-crimson-900/80 border border-amberGold-500/50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amberGold-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-amberGold-200 uppercase tracking-widest">
                      มิติพิพิธภัณฑ์
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">เลือกเส้นทางสำรวจ</span>
                  </div>
                </div>
                <button
                  onClick={closePortal}
                  className="p-1.5 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Destination Cards */}
              <div className="space-y-2 overflow-y-auto pr-1">
                {activeItems.map((item, idx) => {
                  const Icon = item.icon_key === 'none' ? null : PORTAL_ICONS[item.icon_key] || Sparkles;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          closePortal();
                          trackEvent('hall_open', item.href);
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl border border-crimson-950/80 bg-obsidian-950/70 hover:border-amberGold-500/60 hover:bg-crimson-950/40 transition-all shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg bg-crimson-950/90 border border-crimson-800/60 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                            {Icon && <Icon className="w-5 h-5 text-amberGold-400" />}
                            {isSafeImageUrl(item.image_url) && (
                              <img src={item.image_url} alt="" aria-hidden="true" onError={(event) => event.currentTarget.remove()} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-serif font-semibold text-mushroomWhite group-hover:text-amberGold-300 block">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {item.sub}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amberGold-400 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* --- DESKTOP VIEW: 360-degree Orbital Radial Wheel --- */
            <div className="relative pointer-events-auto">
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={closePortal}
                className="absolute z-10 p-3 rounded-full bg-crimson-900 border border-amberGold-500/50 text-amberGold-400 hover:bg-crimson-800 transition pointer-events-auto shadow-2xl -translate-x-1/2 -translate-y-1/2"
                title="ปิดเมนูวงโคจร"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {activeItems.map((item, idx) => {
                const angle = (360 / Math.max(activeItems.length, 1)) * idx;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const Icon = item.icon_key === 'none' ? null : PORTAL_ICONS[item.icon_key] || Sparkles;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{ scale: 1, x, y, opacity: 1 }}
                    exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: idx * 0.04 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        closePortal();
                        trackEvent('hall_open', item.href);
                      }}
                      className={`group flex flex-col items-center justify-center p-3 rounded-2xl border border-crimson-700/60 bg-obsidian-900/95 text-mushroomWhite hover:border-amberGold-400 hover:bg-crimson-950/80 transition-all shadow-xl backdrop-blur-lg ${activeItems.length > 9 ? 'w-36' : 'w-44'} text-center`}
                    >
                      <div className="relative w-16 h-16 mb-2 rounded-xl bg-crimson-950/90 border border-amberGold-500/30 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                        {Icon && <Icon className="w-6 h-6 text-amberGold-400" />}
                        {isSafeImageUrl(item.image_url) && (
                          <img src={item.image_url} alt="" aria-hidden="true" onError={(event) => event.currentTarget.remove()} className="absolute inset-0 w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-xs font-semibold tracking-wide text-mushroomWhite group-hover:text-amberGold-300">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 tracking-wider font-mono">
                        {item.sub}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
