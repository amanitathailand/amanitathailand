export const dynamic = 'force-dynamic';

import React from 'react';
import { notFound } from 'next/navigation';
import { createClientServer } from '@/lib/supabase/server';
import { MuseumExhibit, MuseumHall } from '@/types';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import Link from 'next/link';
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

interface HallPageProps {
  params: Promise<{ hallSlug: string }>;
}

export default async function HallDetailPage({ params }: HallPageProps) {
  const { hallSlug } = await params;
  const supabase = await createClientServer();
  const { data: hallData, error: hallError } = await supabase
    .from('museum_halls')
    .select('*')
    .eq('slug', hallSlug)
    .eq('status', 'published')
    .maybeSingle();

  if (hallError) throw new Error(`อ่านห้องจัดแสดงจาก Supabase ไม่สำเร็จ: ${hallError.message}`);
  if (!hallData) notFound();
  const hall = hallData as MuseumHall;

  const { data: exhibitData, error: exhibitError } = await supabase
    .from('museum_exhibits')
    .select('*')
    .eq('hall_id', hall.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });
  if (exhibitError) throw new Error(`อ่านวัตถุจัดแสดงจาก Supabase ไม่สำเร็จ: ${exhibitError.message}`);
  const exhibits = (exhibitData || []) as MuseumExhibit[];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/museum" className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-amberGold-300 transition">
          <ArrowLeft className="w-3.5 h-3.5" /><span>ย้อนกลับไปรายการห้องจัดแสดงทั้งหมด</span>
        </Link>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-crimson-900/80 bg-obsidian-950 p-8 sm:p-12 mb-12 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-amberGold-400" /><span className="text-xs font-mono uppercase tracking-widest text-amberGold-400">{hall.subtitle || 'Permanent Exhibition'}</span></div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-amberGold-200 mb-4">{hall.title}</h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans">{hall.description}</p>
        </div>
        {hall.cover_image_url && <div className="absolute inset-0 opacity-20"><img src={hall.cover_image_url} alt="" className="w-full h-full object-cover" /></div>}
      </div>

      <div className="space-y-14">
        {exhibits.map((exhibit) => (
          <article key={exhibit.id} className="border-l border-amberGold-500/30 pl-6 sm:pl-8">
            <div className="flex items-center gap-2 text-amberGold-400 mb-3"><BookOpen className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest">วัตถุจัดแสดง · {exhibit.sort_order}</span></div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-mushroomWhite mb-3">{exhibit.title}</h2>
            {exhibit.summary && <p className="text-neutral-400 italic mb-6">{exhibit.summary}</p>}
            <BlockRenderer blocks={exhibit.content_blocks || []} />
          </article>
        ))}
        {exhibits.length === 0 && <p className="text-neutral-500 text-sm">ห้องจัดแสดงนี้ยังไม่มีรายการที่เผยแพร่</p>}
      </div>
    </div>
  );
}
