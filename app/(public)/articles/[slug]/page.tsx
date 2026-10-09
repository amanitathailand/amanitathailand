export const dynamic = 'force-dynamic';

import React from 'react';
import { notFound } from 'next/navigation';
import { createClientServer } from '@/lib/supabase/server';
import { Article } from '@/types';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw new Error(`อ่านบทความจาก Supabase ไม่สำเร็จ: ${error.message}`);
  const article = data as Article | null;
  if (!article) notFound();

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-4xl mx-auto">
      <Link href="/articles" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-amberGold-300 mb-8 font-mono">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>ย้อนกลับไปรายการบทความทั้งหมด</span>
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 mb-3">
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amberGold-400" /><span>ใช้เวลาอ่าน ~{article.reading_time_minutes || 5} นาที</span></div>
          <span>•</span>
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-neutral-500" /><span>{new Date(article.published_at || article.created_at || Date.now()).toLocaleDateString('th-TH')}</span></div>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-amberGold-200 mb-6 leading-tight">{article.title}</h1>
        <p className="text-base md:text-lg text-neutral-300 italic font-serif leading-relaxed mb-6 border-l-2 border-amberGold-500/50 pl-4 py-1">{article.excerpt}</p>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, i) => <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-obsidian-900 border border-neutral-800 text-[10px] text-neutral-400 font-mono"><Tag className="w-3 h-3" />{tag}</span>)}
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-amberGold-500/30 to-transparent mb-10" />
      <BlockRenderer blocks={article.content_blocks || []} />
    </div>
  );
}
