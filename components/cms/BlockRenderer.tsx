'use client';

import React from 'react';
import { ContentBlock } from '@/types';
import { Quote, AlertCircle, ExternalLink, Layers } from 'lucide-react';
import { ImageLightbox } from '@/components/media/ImageLightbox';

interface BlockRendererProps {
  blocks: ContentBlock[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-8 my-8 font-sans">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading': {
            const data = block.data as { level?: number; text: string };
            const lvl = data.level || 2;
            if (lvl === 1) {
              return <h1 key={block.id} className="text-3xl md:text-4xl font-serif text-amberGold-300 font-bold border-b border-crimson-900/50 pb-3">{data.text}</h1>;
            }
            if (lvl === 3) {
              return <h3 key={block.id} className="text-xl font-serif text-amberGold-200 font-semibold">{data.text}</h3>;
            }
            return <h2 key={block.id} className="text-2xl md:text-3xl font-serif text-amberGold-200/90 font-bold">{data.text}</h2>;
          }

          case 'text': {
            const data = block.data as { content: string };
            return (
              <div 
                key={block.id} 
                className="text-neutral-300 leading-relaxed text-base font-normal whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            );
          }

          case 'image': {
            const data = block.data as { url: string; caption?: string; alt?: string };
            return (
              <figure key={block.id} className="my-6 rounded-xl overflow-hidden border border-crimson-950/80 bg-obsidian-950/60 shadow-xl">
                <ImageLightbox
                  images={[{ src: data.url, alt: data.alt || 'นิทรรศการภาพ Amanita', caption: data.caption }]}
                  imageClassName="w-full h-auto max-h-[500px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  triggerClassName="group relative block w-full cursor-zoom-in overflow-hidden"
                />
                {data.caption && <figcaption className="p-3 text-xs text-center text-neutral-400 font-mono italic">{data.caption}</figcaption>}
              </figure>
            );
          }

          case 'gallery': {
            const data = block.data as { items: Array<{ url: string; caption?: string }> };
            return (
              <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                {(data.items || []).map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-neutral-800 bg-obsidian-900">
                    <ImageLightbox
                      images={(data.items || []).map((item) => ({ src: item.url, caption: item.caption, alt: 'ภาพจาก Gallery' }))}
                      initialIndex={i}
                      imageClassName="w-full h-48 object-cover transition duration-300 group-hover:scale-105"
                      triggerClassName="group relative block w-full cursor-zoom-in overflow-hidden"
                    />
                    {img.caption && <p className="p-2 text-xs text-neutral-400">{img.caption}</p>}
                  </div>
                ))}
              </div>
            );
          }

          case 'quote': {
            const data = block.data as { quote: string; author?: string };
            return (
              <blockquote key={block.id} className="border-l-4 border-crimson-600 pl-6 py-4 italic text-amberGold-200/90 my-6 bg-crimson-950/30 rounded-r-xl">
                <Quote className="w-6 h-6 text-crimson-500 mb-2 opacity-70" />
                <p className="text-lg font-serif leading-relaxed">“{data.quote}”</p>
                {data.author && <cite className="block text-xs text-neutral-400 mt-2 font-mono not-italic">— {data.author}</cite>}
              </blockquote>
            );
          }

          case 'timeline': {
            const data = block.data as { events: Array<{ year: string; title: string; desc: string }> };
            return (
              <div key={block.id} className="border-l-2 border-amberGold-600/40 pl-6 space-y-6 my-8">
                {(data.events || []).map((ev, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-crimson-600 border-2 border-amberGold-400" />
                    <span className="text-xs font-mono font-bold text-amberGold-400 uppercase tracking-widest">{ev.year}</span>
                    <h4 className="text-base font-serif font-bold text-mushroomWhite mt-0.5">{ev.title}</h4>
                    <p className="text-sm text-neutral-400 mt-1">{ev.desc}</p>
                  </div>
                ))}
              </div>
            );
          }

          case 'accordion': {
            const data = block.data as { items: Array<{ title: string; content: string }> };
            return (
              <div key={block.id} className="space-y-3 my-6">
                {(data.items || []).map((item, i) => (
                  <details key={i} className="p-4 rounded-xl border border-neutral-800 bg-obsidian-900/60 group">
                    <summary className="font-serif font-semibold text-amberGold-300 cursor-pointer list-none flex justify-between items-center">
                      <span>{item.title}</span>
                      <span className="text-amberGold-500 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-3 text-sm text-neutral-300 leading-relaxed pt-2 border-t border-neutral-800/60">{item.content}</p>
                  </details>
                ))}
              </div>
            );
          }

          case 'callout': {
            const data = block.data as { title?: string; message: string; variant?: 'info' | 'warning' };
            const isWarn = data.variant === 'warning';
            return (
              <div key={block.id} className={`p-5 rounded-xl border ${isWarn ? 'border-amberGold-600/60 bg-amberGold-950/20' : 'border-crimson-800/60 bg-crimson-950/30'} my-6 flex items-start gap-4`}>
                <AlertCircle className={`w-6 h-6 ${isWarn ? 'text-amberGold-400' : 'text-crimson-400'} shrink-0 mt-0.5`} />
                <div>
                  {data.title && <h4 className="font-serif font-bold text-mushroomWhite mb-1">{data.title}</h4>}
                  <p className="text-sm text-neutral-300 leading-relaxed">{data.message}</p>
                </div>
              </div>
            );
          }

          case 'button': {
            const data = block.data as { label: string; url: string; style?: string };
            return (
              <div key={block.id} className="my-6">
                <a 
                  href={data.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite font-serif text-sm font-semibold tracking-wide transition shadow-lg hover:shadow-crimson-900/40"
                >
                  <span>{data.label}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
          }

          case 'divider': {
            return <hr key={block.id} className="border-t border-neutral-800/80 my-10" />;
          }

          case 'youtube': {
            const data = block.data as { videoId: string };
            return (
              <div key={block.id} className="my-6 aspect-video rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${data.videoId}`}
                  title="Amanita Video"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            );
          }

          case 'audio': {
            const data = block.data as { url: string; title?: string };
            return (
              <div key={block.id} className="p-4 rounded-xl border border-neutral-800 bg-obsidian-900/70 my-6">
                {data.title && <span className="text-xs font-mono text-amberGold-400 block mb-2">{data.title}</span>}
                <audio controls className="w-full">
                  <source src={data.url} type="audio/mpeg" />
                  เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
                </audio>
              </div>
            );
          }

          case '3d_model': {
            const data = block.data as { modelUrl: string; label?: string };
            return (
              <div key={block.id} className="p-6 rounded-xl border border-crimson-900/60 bg-obsidian-950/70 text-center my-6">
                <Layers className="w-8 h-8 text-amberGold-400 mx-auto mb-2" />
                <p className="text-sm font-serif text-mushroomWhite">{data.label || 'วัตถุจัดแสดง 3 มิติ (3D Exhibit Artifact)'}</p>
                <span className="text-xs text-neutral-400 font-mono mt-1 block">GLB Source: {data.modelUrl}</span>
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
