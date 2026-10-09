'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMuseumStore } from '@/store/useMuseumStore';
import { Volume2, VolumeX, Sparkles, User, Layers, BookOpen, Package, PhoneCall, Home } from 'lucide-react';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import type { SiteContentSettings } from '@/types';

const navItems = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/museum', label: 'ห้องนิทรรศการ', icon: Layers },
  { href: '/products', label: 'ตัวอย่างพฤกษศาสตร์', icon: Package },
  { href: '/articles', label: 'คลังบทความ', icon: BookOpen },
  { href: '/contact', label: 'ติดต่อ', icon: PhoneCall },
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="เมนูหลัก"
      className={mobile
        ? 'flex md:hidden w-full items-center gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        : 'hidden md:flex items-center gap-1 rounded-full border border-[#8d99ae]/45 bg-white/95 px-2 py-1.5 shadow-lg shadow-[#2b2d42]/10 backdrop-blur-md'}
    >
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium text-[#2b2d42] transition hover:bg-[#d90429] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef233c]"
        >
          <Icon className="h-3.5 w-3.5 text-[#d90429]" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function PublicHeader() {
  const { isPortalOpen, openPortal, isAudioMuted, toggleAudio } = useMuseumStore();
  const [siteContent, setSiteContent] = useState<SiteContentSettings>(INITIAL_SITE_CONTENT);

  useEffect(() => {
    let active = true;
    fetch('/api/settings', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'อ่านชื่อเว็บไซต์ไม่สำเร็จ');
        if (active && result.site) setSiteContent({ ...INITIAL_SITE_CONTENT, ...result.site });
      })
      .catch((error) => console.warn('Public header settings notice:', error));
    return () => { active = false; };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#8d99ae]/35 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-xl sm:px-5 sm:py-3">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 max-w-[48vw] items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef233c] md:max-w-[25vw]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ef233c]/60 bg-white shadow-sm">
            <Sparkles className="h-4 w-4 text-[#d90429]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-serif text-sm font-bold uppercase tracking-[0.14em] text-[#2b2d42] sm:text-base">
              {siteContent.site_title}
            </span>
            <span className="hidden truncate text-[10px] tracking-wider text-[#596078] sm:block">
              {siteContent.site_subtitle}
            </span>
          </div>
        </Link>

        <NavigationLinks />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!isPortalOpen && (
            <button
              onClick={openPortal}
              className="hidden items-center gap-1.5 rounded-full border border-[#ef233c]/55 bg-white px-3 py-2 text-[11px] font-medium text-[#2b2d42] transition hover:bg-[#d90429] hover:text-white sm:flex"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#d90429]" aria-hidden="true" />
              <span>ประตูมิติ</span>
            </button>
          )}
          <button
            onClick={toggleAudio}
            className="rounded-full border border-[#8d99ae]/50 bg-white p-2 text-[#2b2d42] transition hover:border-[#d90429] hover:bg-[#d90429] hover:text-white"
            title={isAudioMuted ? 'เปิดเสียงบรรยากาศป่า' : 'ปิดเสียงบรรยากาศ'}
            aria-label={isAudioMuted ? 'เปิดเสียงบรรยากาศป่า' : 'ปิดเสียงบรรยากาศ'}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-[#d90429]" />}
          </button>
          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 rounded-xl border border-[#8d99ae]/50 bg-white px-2.5 py-2 text-[11px] text-[#2b2d42] transition hover:border-[#d90429] hover:bg-[#d90429] hover:text-white sm:px-3"
            title="เข้าสู่ระบบผู้ดูแล (Admin)"
          >
            <User className="h-3.5 w-3.5 text-[#d90429]" aria-hidden="true" />
            <span className="hidden sm:inline">Admin CMS</span>
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-2 w-full max-w-7xl md:hidden">
        <NavigationLinks mobile />
      </div>
    </header>
  );
}
