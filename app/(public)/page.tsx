'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useMuseumStore } from '@/store/useMuseumStore';
import { 
  Sparkles, 
  Layers, 
  Package, 
  BookOpen, 
  PhoneCall, 
  MessageCircle,
  Camera,
  Rotate3d
} from 'lucide-react';
import Link from 'next/link';
import type { ContactSettings, SiteContentSettings } from '@/types';
import { INITIAL_CONTACT_SETTINGS, INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { trackEvent } from '@/lib/analytics/tracker';

// Dynamic import of native Three.js Canvas with ssr: false
const MuseumSceneCanvas = dynamic(
  () => import('@/components/3d/MuseumSceneCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-obsidian-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-crimson-700 border-t-amberGold-400 animate-spin" />
          <span className="text-xs font-serif tracking-widest text-amberGold-400/80 uppercase">
            กำลังเปิดประตูมิติพิพิธภัณฑ์...
          </span>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const { isPortalOpen, openPortal } = useMuseumStore();
  const [contactSettings, setContactSettings] = useState<ContactSettings>(INITIAL_CONTACT_SETTINGS);
  const [siteContent, setSiteContent] = useState<SiteContentSettings>(INITIAL_SITE_CONTENT);
  const [displayMode, setDisplayMode] = useState<'3d' | 'real_photo'>(INITIAL_SITE_CONTENT.home_display_mode || '3d');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Parallax tilt state for Real Photo mode
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'อ่านการตั้งค่าหน้าแรกไม่สำเร็จ');
        if (json.contact) setContactSettings(prev => ({ ...prev, ...json.contact }));
        if (json.site) {
          const savedContent = { ...INITIAL_SITE_CONTENT, ...json.site } as SiteContentSettings;
          setSiteContent(savedContent);
          setDisplayMode(savedContent.home_display_mode === 'real_photo' ? 'real_photo' : '3d');
        }
      } catch (err) {
        console.warn('Load home settings notice:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // Handle interactive 3D parallax tilt for real photo mode
  const handleMouseMove = (e: React.MouseEvent) => {
    if (displayMode !== 'real_photo') return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20; // -10 to +10 degrees
    const y = (clientY / innerHeight - 0.5) * -20;
    setTilt({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-obsidian-950 select-none"
    >
      {/* ======================================================================
          MODE A: 3D Interactive Scene (Three.js with GLTF & Organic PBR)
          ====================================================================== */}
      {displayMode === '3d' && (
        settingsLoaded ? <MuseumSceneCanvas modelUrl={siteContent.home_3d_model_url || '/models/amanita.glb'} /> : (
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian-950">
            <div className="w-10 h-10 rounded-full border-2 border-crimson-700 border-t-amberGold-400 animate-spin" aria-label="กำลังโหลดการตั้งค่าหน้าแรก" />
          </div>
        )
      )}

      {/* ======================================================================
          MODE B: Ultra-Realistic Real Botanical Photo with 3D Parallax Tilt
          ====================================================================== */}
      {displayMode === 'real_photo' && (
        <div 
          onClick={() => {
            openPortal();
            trackEvent('museum_entry', 'portal_real_photo');
          }}
          className="absolute inset-0 flex items-center justify-center cursor-pointer overflow-hidden bg-obsidian-950"
        >
          {/* Deep Forest Atmospheric Backdrop with Ambient Mist */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2b2d42]/90 via-white/20 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,158,171,0.30)_0%,transparent_70%)] pointer-events-none" />

          {/* Floating Spore Particles (CSS Animation) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#fff1a8]/90 shadow-[0_0_10px_rgba(255,241,168,0.88)] blur-[0.5px] animate-pulse"
                style={{
                  top: `${(i * 17) % 95}%`,
                  left: `${(i * 29) % 95}%`,
                  animationDuration: `${2 + (i % 5)}s`,
                  transform: `scale(${0.6 + ((i * 7) % 10) / 10})`,
                }}
              />
            ))}
          </div>

          {/* Realistic High-Definition Real Mushroom Card with 3D Parallax Tilt */}
          <div 
            className="relative z-10 flex flex-col items-center transition-transform duration-200 ease-out"
            style={{
              transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            }}
          >
            {/* Glowing Backlight Halo */}
            <div className="absolute w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-tr from-crimson-600/35 via-white/45 to-transparent blur-3xl -z-10 animate-pulse" />

            {/* Real Specimen Photo */}
            <div className="relative group w-72 sm:w-96 rounded-3xl p-3 bg-gradient-to-b from-white/95 via-[#2b2d42]/90 to-[#2b2d42] border border-white/80 shadow-[0_20px_60px_rgba(43,45,66,0.24)] backdrop-blur-xl">
              <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={siteContent.home_photo_image_url || INITIAL_SITE_CONTENT.home_photo_image_url}
                  alt={siteContent.home_photo_alt || 'Amanita Muscaria botanical specimen'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Botanical Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/85 border border-white/80 backdrop-blur-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amberGold-400" />
                  <span className="text-[10px] font-mono text-[#2b2d42] font-bold uppercase tracking-wider">
                    ภาพถ่ายตัวอย่าง
                  </span>
                </div>

                {/* Subtitle Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#2b2d42] via-[#2b2d42]/85 to-transparent">
                  <span className="text-xs font-serif font-bold text-white block">
                    {siteContent.home_photo_caption || 'Amanita Muscaria (L.) Lam.'}
                  </span>
                  <span className="text-[10px] text-neutral-300 font-mono">
                    {siteContent.home_photo_subtitle || 'ตัวอย่างพฤกษศาสตร์สำหรับการศึกษา'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          Switch Display Mode Button (Top Right Floating Badge)
          ====================================================================== */}
      <div className="absolute top-28 sm:top-20 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
        <button
          onClick={() => {
            const next = displayMode === '3d' ? 'real_photo' : '3d';
            setDisplayMode(next);
            trackEvent('museum_entry', `mode_switch_${next}`);
          }}
          className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-crimson-600/70 bg-white/95 px-3 py-2 text-[10px] font-serif text-[#2b2d42] shadow-xl shadow-[#2b2d42]/15 backdrop-blur-md transition-all hover:bg-crimson-600 hover:border-crimson-600 hover:text-white hover:scale-105 sm:px-4 sm:text-xs"
        >
          {displayMode === '3d' ? (
            <>
              <Camera className="w-3.5 h-3.5 text-amberGold-400" />
              <span>สลับโหมด: ภาพถ่ายตัวอย่าง</span>
            </>
          ) : (
            <>
              <Rotate3d className="w-3.5 h-3.5 text-crimson-400" />
              <span>สลับโหมด: หมุน 3 มิติ 360° (3D Scene)</span>
            </>
          )}
        </button>
      </div>

      {/* ======================================================================
          Center Interactive Portal Trigger Button
          ====================================================================== */}
      {!isPortalOpen && (
        <div className="absolute bottom-20 sm:bottom-24 inset-x-0 z-20 flex flex-col items-center pointer-events-none text-center px-4 animate-pulse">
          <button
            onClick={openPortal}
            className="pointer-events-auto flex items-center gap-2.5 px-6 py-3 rounded-full border border-crimson-600 bg-crimson-600 text-white hover:bg-crimson-500 hover:border-crimson-500 text-xs sm:text-sm font-serif tracking-widest uppercase transition-all shadow-2xl shadow-[#2b2d42]/25 backdrop-blur-md hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-amberGold-400" />
            <span>{siteContent.portal_button_text}</span>
          </button>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 tracking-wider mt-2 font-mono">
            {displayMode === '3d' ? 'หมุน 360° หรือคลิกดอกเห็ดเพื่อเข้าชมนิทรรศการ' : 'แตะหรือคลิกภาพตัวอย่างจริงเพื่อเข้าสู่มิติพิพิธภัณฑ์'}
          </span>
        </div>
      )}

      {/* ======================================================================
          Bottom Quick-Access Floating Dock
          ====================================================================== */}
      <div className="absolute bottom-4 inset-x-0 z-20 hidden justify-center px-4 pointer-events-none md:flex">
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl border border-crimson-700/30 bg-white/90 backdrop-blur-lg shadow-2xl shadow-crimson-900/15 text-[11px] sm:text-xs font-serif overflow-x-auto max-w-full">
          <Link
            href="/museum"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent hover:border-crimson-600 hover:bg-crimson-950 text-[#2b2d42] hover:text-crimson-600 transition whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-amberGold-400" />
            <span>ห้องนิทรรศการ</span>
          </Link>

          <span className="text-neutral-700">|</span>

          <Link
            href="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent hover:border-crimson-600 hover:bg-crimson-950 text-[#2b2d42] hover:text-crimson-600 transition whitespace-nowrap"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>ตัวอย่างพฤกษศาสตร์</span>
          </Link>

          <span className="text-neutral-700">|</span>

          <Link
            href="/articles"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent hover:border-crimson-600 hover:bg-crimson-950 text-[#2b2d42] hover:text-crimson-600 transition whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>คลังบทความ</span>
          </Link>

          <span className="text-neutral-700">|</span>

          <Link
            href="/contact"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent hover:border-[#06C755]/50 hover:bg-[#06C755]/10 text-neutral-300 hover:text-[#06C755] transition whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#06C755]" />
            <span>ติดต่อเรา</span>
          </Link>

          {contactSettings.line_oa_url && (
            <>
              <span className="text-neutral-700 hidden sm:inline">|</span>
              <a
                href={contactSettings.line_oa_url}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06C755]/20 hover:bg-[#06C755]/30 text-[#06C755] border border-[#06C755]/40 transition whitespace-nowrap text-[11px] font-mono"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>แชท LINE OA</span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
