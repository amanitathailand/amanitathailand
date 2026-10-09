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
        if (!response.ok || !result.success) throw new Error(result.error || 'เธญเนเธฒเธเธเธทเนเธญเน€เธงเนเธเนเธเธ•เนเนเธกเนเธชเธณเน€เธฃเนเธ');
        if (active && result.site) setSiteContent({ ...INITIAL_SITE_CONTENT, ...result.site });
      })
      .catch((error) => console.warn('Public header settings notice:', error));
    return () => { active = false; };
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 pointer-events-none">
      <Link href="/" className="pointer-events-auto flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full border border-crimson-700/60 bg-white flex items-center justify-center shadow-lg shadow-crimson-600/15 group-hover:border-crimson-600 transition shrink-0">
          <Sparkles className="w-4 h-4 text-amberGold-400" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-serif tracking-widest text-[#2b2d42] uppercase block font-bold leading-none drop-shadow-sm">
            {siteContent.site_title}
          </span>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 tracking-widest hidden sm:block font-sans">
            {siteContent.site_subtitle}
          </span>
        </div>
      </Link>

      {/* Main Desktop Navbar Links */}
      <nav className="pointer-events-auto hidden md:flex items-center gap-1 px-4 py-1.5 rounded-full border border-[#8d99ae]/45 bg-white/90 backdrop-blur-md shadow-xl shadow-[#2b2d42]/10 text-xs font-serif">
        <Link 
          href="/museum" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <Layers className="w-3.5 h-3.5 text-amberGold-400" />
          <span>เธซเนเธญเธเธเธดเธ—เธฃเธฃเธจเธเธฒเธฃ</span>
        </Link>
        <Link 
          href="/products" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span>เธ•เธฑเธงเธญเธขเนเธฒเธเธเธคเธเธฉเธจเธฒเธชเธ•เธฃเน</span>
        </Link>
        <Link 
          href="/articles" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>เธเธฅเธฑเธเธเธ—เธเธงเธฒเธก</span>
        </Link>
        <Link 
          href="/contact" 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#2b2d42] hover:text-white hover:bg-crimson-600 transition"
        >
          <PhoneCall className="w-3.5 h-3.5 text-amberGold-400" />
          <span>เธ•เธดเธ”เธ•เนเธญ</span>
        </Link>
      </nav>

      {/* Controls & Admin Link */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        {!isPortalOpen && (
          <button
            onClick={openPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full border border-crimson-700/50 bg-white/90 text-[11px] sm:text-xs text-[#2b2d42] hover:border-crimson-600 hover:bg-crimson-600 hover:text-white transition shadow-lg shadow-[#2b2d42]/10 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amberGold-400" />
            <span>เธเธฃเธฐเธ•เธนเธกเธดเธ•เธด</span>
          </button>
        )}

        <button
          onClick={toggleAudio}
          className="p-2 sm:p-2.5 rounded-full border border-crimson-700/30 bg-white/90 text-[#2b2d42] hover:text-white hover:bg-crimson-600 hover:border-crimson-600 transition backdrop-blur-sm shadow-md shadow-[#2b2d42]/10"
          title={isAudioMuted ? 'เน€เธเธดเธ”เน€เธชเธตเธขเธเธเธฃเธฃเธขเธฒเธเธฒเธจเธเนเธฒ' : 'เธเธดเธ”เน€เธชเธตเธขเธเธเธฃเธฃเธขเธฒเธเธฒเธจ'}
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amberGold-400" />}
        </button>

        <Link
          href="/admin/login"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-crimson-700/30 bg-white/90 text-xs text-[#2b2d42] hover:text-white hover:bg-crimson-600 hover:border-crimson-600 transition flex items-center gap-1.5 backdrop-blur-sm shadow-sm"
          title="เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเธนเนเธ”เธนเนเธฅ (Admin)"
        >
          <User className="w-3.5 h-3.5 text-amberGold-400" />
          <span className="hidden sm:inline">Admin CMS</span>
        </Link>
      </div>
    </header>
  );
}

