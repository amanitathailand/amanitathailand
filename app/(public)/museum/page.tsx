export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { createClientServer } from '@/lib/supabase/server';
import { MuseumHall, SiteContentSettings } from '@/types';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';
import { ArrowRight, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'ห้องจัดแสดงทั้งหมด | Amanita Digital Museum',
  description: 'สำรวจห้องจัดแสดงดิจิทัลของเห็ดศักดิ์สิทธิ์ Amanita Muscaria ทั้ง 4 มิติ',
};

export default async function MuseumIndexPage() {
  let halls: MuseumHall[] = [];
  let siteContent: SiteContentSettings = INITIAL_SITE_CONTENT;

  try {
    const supabase = await createClientServer();
    const [hallsRes, settingsRes] = await Promise.all([
      supabase.from('museum_halls').select('*').eq('status', 'published').order('sort_order', { ascending: true }),
      supabase.from('admin_settings').select('key, value').eq('key', 'site_content'),
    ]);
    if (hallsRes.error) throw hallsRes.error;
    halls = hallsRes.data || [];
    if (settingsRes.error) throw settingsRes.error;
    const siteRow = settingsRes.data?.[0];
    if (siteRow?.value) siteContent = { ...INITIAL_SITE_CONTENT, ...parseAdminSettingsValue(siteRow.value) } as SiteContentSettings;
  } catch (err) {
    console.warn('Supabase query error, using initial halls data:', err);
    halls = [];
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-6xl mx-auto">
      {/* Dynamic Header from CMS */}
      <div className="text-center mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400">
          {siteContent.museum_subtitle}
        </span>
        <h1 className="text-4xl md:text-5xl font-serif text-amberGold-200 mt-2 font-bold">
          {siteContent.museum_title}
        </h1>
        <p className="text-neutral-400 max-w-2xl mx-auto mt-4 text-sm leading-relaxed">
          {siteContent.museum_description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {halls.map((hall: MuseumHall) => (
          <Link
            key={hall.id}
            href={`/museum/${hall.slug}`}
            className="group relative rounded-2xl overflow-hidden border border-[#8d99ae]/55 bg-white hover:border-[#d90429] transition-all duration-300 shadow-[0_12px_30px_rgba(43,45,66,0.12)] flex flex-col justify-between"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={hall.cover_image_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'}
                alt={hall.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />
            </div>

            <div className="p-6 relative -mt-12">
              <span className="text-xs font-mono text-amberGold-400 uppercase tracking-widest block mb-1">
                {hall.subtitle || 'Permanent Hall'}
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#2b2d42] group-hover:text-[#d90429] transition-colors">
                {hall.title}
              </h2>
              <p className="text-neutral-400 text-sm mt-3 line-clamp-3 leading-relaxed">
                {hall.description}
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs font-serif text-[#d90429] font-bold group-hover:translate-x-1 transition-transform">
                <Sparkles className="w-4 h-4 text-crimson-400" />
                <span>เข้าสู่นิทรรศการห้องนี้</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
