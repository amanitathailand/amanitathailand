export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { createClientServer } from '@/lib/supabase/server';
import { Article, SiteContentSettings } from '@/types';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'คลังบทความวิจัยและประวัติศาสตร์ | Amanita Thailand',
  description: 'รวมบทความวิชาการเกี่ยวกับเห็ด Amanita Muscaria จากมิติประวัติศาสตร์ สารเคมี และวัฒนธรรม',
};

export default async function ArticlesIndexPage() {
  let articles: Article[] = [];
  let siteContent: SiteContentSettings = INITIAL_SITE_CONTENT;

  try {
    const supabase = await createClientServer();
    const [articlesRes, settingsRes] = await Promise.all([
      supabase.from('articles').select('*').eq('status', 'published').order('created_at', { ascending: false }),
      supabase.from('admin_settings').select('key, value').eq('key', 'site_content'),
    ]);
    if (articlesRes.error) throw articlesRes.error;
    articles = articlesRes.data || [];
    if (settingsRes.error) throw settingsRes.error;
    const siteRow = settingsRes.data?.[0];
    if (siteRow?.value) siteContent = { ...INITIAL_SITE_CONTENT, ...parseAdminSettingsValue(siteRow.value) } as SiteContentSettings;
  } catch (err) {
    console.warn('Articles query fallback notice:', err);
    articles = [];
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-5xl mx-auto">
      {/* Dynamic Header from CMS */}
      <div className="text-center mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400">
          {siteContent.articles_subtitle}
        </span>
        <h1 className="text-4xl md:text-5xl font-serif text-amberGold-200 mt-2 font-bold">
          {siteContent.articles_title}
        </h1>
        <p className="text-neutral-400 max-w-2xl mx-auto mt-4 text-sm leading-relaxed">
          {siteContent.articles_description}
        </p>
      </div>

      <div className="space-y-6">
        {articles.map((art: Article) => (
          <Link
            key={art.id}
            href={`/articles/${art.slug}`}
            className="group block p-6 rounded-2xl border border-[#8d99ae]/55 bg-white hover:border-[#d90429] transition shadow-[0_12px_30px_rgba(43,45,66,0.12)]"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {art.featured_image_url && (
                <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-neutral-900">
                  <img
                    src={art.featured_image_url}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amberGold-400" />
                    <span>ใช้เวลาอ่าน ~{art.reading_time_minutes || 5} นาที</span>
                  </div>
                  <span>•</span>
                  <div className="flex gap-1.5">
                    {art.tags?.map((t, idx) => (
                      <span key={idx} className="text-crimson-400">#{t}</span>
                    ))}
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2b2d42] group-hover:text-[#d90429] transition-colors mb-2">
                  {art.title}
                </h2>
                <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed mb-4">
                  {art.excerpt}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#d90429]">
                  <span>อ่านบทความฉบับเต็ม</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
