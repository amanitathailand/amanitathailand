'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMuseumStore } from '@/store/useMuseumStore';
import { Volume2, VolumeX, Sparkles, User, Layers, BookOpen, Package, PhoneCall } from 'lucide-react';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import type { SiteContentSettings } from '@/types';

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
    <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 pointer-events-none">
      <Link href="/" className="pointer-events-auto flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full border border-crimson-700/60 bg-white/80 flex items-center justify-center shadow-lg shadow-crimson-700/10 group-hover:border-amberGold-400 transition shrink-0">
          <Sparkles className="w-4 h-4 text-amberGold-400" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-serif tracking-widest text-amberGold-600 uppercase block font-bold leading-none">
            {siteContent.site_title}
          </span>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 tracking-widest hidden sm:block font-sans">
            {siteContent.site_subtitle}
          </span>
        </div>
      </Link>

      {/* Main Desktop Navbar Links */}
      <nav className="pointer-events-auto hidden md:flex items-center gap-1 px-4 py-1.5 rounded-full border border-crimson-700/30 bg-white/75 backdrop-blur-md shadow-xl shadow-crimson-900/10 text-xs font-serif">
        <Link 
          href="/museum" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <Layers className="w-3.5 h-3.5 text-amberGold-400" />
          <span>ห้องนิทรรศการ</span>
        </Link>
        <Link 
          href="/products" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span>ตัวอย่างพฤกษศาสตร์</span>
        </Link>
        <Link 
          href="/articles" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>คลังบทความ</span>
        </Link>
        <Link 
          href="/contact" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <PhoneCall className="w-3.5 h-3.5 text-amberGold-400" />
          <span>ติดต่อ</span>
        </Link>
      </nav>

      {/* Controls & Admin Link */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        {!isPortalOpen && (
          <button
            onClick={openPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full border border-crimson-700/50 bg-white/75 text-[11px] sm:text-xs text-amberGold-600 hover:border-amberGold-500/70 hover:bg-crimson-950 transition shadow-lg shadow-crimson-900/10 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amberGold-400" />
            <span>ประตูมิติ</span>
          </button>
        )}

        <button
          onClick={toggleAudio}
          className="p-2 sm:p-2.5 rounded-full border border-crimson-700/30 bg-white/75 text-neutral-300 hover:text-amberGold-600 hover:border-amberGold-500/50 transition backdrop-blur-sm shadow-md shadow-crimson-900/10"
          title={isAudioMuted ? 'เปิดเสียงบรรยากาศป่า' : 'ปิดเสียงบรรยากาศ'}
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amberGold-400" />}
        </button>

        <Link
          href="/admin/login"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-crimson-700/30 bg-white/75 text-xs text-neutral-300 hover:text-amberGold-600 hover:border-crimson-600 transition flex items-center gap-1.5 backdrop-blur-sm shadow-sm"
          title="เข้าสู่ระบบผู้ดูแล (Admin)"
        >
          <User className="w-3.5 h-3.5 text-amberGold-400" />
          <span className="hidden sm:inline">Admin CMS</span>
        </Link>
      </div>
    </header>
  );
}
