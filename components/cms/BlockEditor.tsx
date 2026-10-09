'use client';

import React from 'react';
import { ContentBlock, BlockType } from '@/types';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Heading, 
  Type, 
  Image as ImageIcon, 
  Quote, 
  AlertCircle, 
  Minus, 
  Video 
} from 'lucide-react';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export function BlockEditor({ blocks = [], onChange }: BlockEditorProps) {
  const addBlock = (type: BlockType) => {
    const id = 'blk_' + Math.random().toString(36).substring(2, 9);
    let initialData: any = {};

    switch (type) {
      case 'heading':
        initialData = { level: 2, text: 'หัวข้อใหม่' };
        break;
      case 'text':
        initialData = { content: 'ใส่เนื้อหาข้อความหรือคำอธิบายที่นี่...' };
        break;
      case 'image':
        initialData = { 
          url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200', 
          caption: 'คำบรรยายภาพ' 
        };
        break;
      case 'quote':
        initialData = { text: 'ข้อความคำคมหรือข้อความสำคัญ', author: 'ผู้บันทึก' };
        break;
      case 'callout':
        initialData = { 
          type: 'warning', 
          title: 'ข้อควรระวังสำคัญ', 
          text: 'ข้อมูลการวิจัยและการเก็บรักษาตัวอย่าง' 
        };
        break;
      case 'youtube':
        initialData = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
        break;
      case 'divider':
        initialData = {};
        break;
      default:
        initialData = { text: '' };
    }

    const newBlocks = [...blocks, { id, type, data: initialData }];
    onChange(newBlocks);
  };

  const updateBlockData = (index: number, key: string, value: any) => {
    const next = [...blocks];
    next[index] = {
      ...next[index],
      data: {
        ...next[index].data,
        [key]: value
      }
    };
    onChange(next);
  };

  const removeBlock = (index: number) => {
    const next = blocks.filter((_, i) => i !== index);
    onChange(next);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const next = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-mushroomWhite flex items-center gap-2">
            <span>บล็อกเนื้อหาแบบโต้ตอบ (Content Blocks)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-amberGold-400 font-mono">
              {blocks.length} บล็อก
            </span>
          </h4>
          <p className="text-xs text-neutral-400">
            ปรับแต่งลำดับ ข้อความ รูปภาพ คำเตือน และคำอธิบายเชิงลึก
          </p>
        </div>
      </div>

      {/* Block List */}
      <div className="space-y-3">
        {blocks.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-neutral-800 text-neutral-500 text-xs">
            ยังไม่มีบล็อกเนื้อหา กดปุ่มด้านล่างเพื่อเพิ่มหัวข้อ ย่อหน้า หรือรูปภาพ
          </div>
        ) : (
          blocks.map((block, idx) => (
            <div 
              key={block.id || idx}
              className="p-3.5 rounded-xl border border-neutral-800 bg-obsidian-900/80 space-y-2.5 transition hover:border-neutral-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amberGold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{block.type}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, 'down')}
                    disabled={idx === blocks.length - 1}
                    className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(idx)}
                    className="p-1 rounded text-crimson-400 hover:text-crimson-300 hover:bg-crimson-950/40"
                    title="ลบบล็อกนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Block Input Controls based on type */}
              {block.type === 'heading' && (
                <div className="grid grid-cols-4 gap-2">
                  <select
                    value={block.data?.level || 2}
                    onChange={(e) => updateBlockData(idx, 'level', parseInt(e.target.value))}
                    className="col-span-1 p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite"
                  >
                    <option value={1}>H1 ใหญ่สุด</option>
                    <option value={2}>H2 หัวข้อหลัก</option>
                    <option value={3}>H3 หัวข้อย่อย</option>
                  </select>
                  <input
                    type="text"
                    value={block.data?.text || ''}
                    onChange={(e) => updateBlockData(idx, 'text', e.target.value)}
                    placeholder="ข้อความหัวข้อ..."
                    className="col-span-3 p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-semibold focus:border-amberGold-500"
                  />
                </div>
              )}

              {block.type === 'text' && (
                <textarea
                  rows={3}
                  value={block.data?.content || ''}
                  onChange={(e) => updateBlockData(idx, 'content', e.target.value)}
                  placeholder="เขียนข้อความหรือเนื้อหาบรรยาย..."
                  className="w-full p-2.5 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite leading-relaxed focus:border-amberGold-500"
                />
              )}

              {block.type === 'image' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={block.data?.url || ''}
                    onChange={(e) => updateBlockData(idx, 'url', e.target.value)}
                    placeholder="Image URL (https://...)"
                    className="w-full p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-mono"
                  />
                  <input
                    type="text"
                    value={block.data?.caption || ''}
                    onChange={(e) => updateBlockData(idx, 'caption', e.target.value)}
                    placeholder="คำบรรยายใต้ภาพ..."
                    className="w-full p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-neutral-300"
                  />
                </div>
              )}

              {block.type === 'quote' && (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={block.data?.text || ''}
                    onChange={(e) => updateBlockData(idx, 'text', e.target.value)}
                    placeholder="ข้อความคำคม..."
                    className="w-full p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-amberGold-300 italic"
                  />
                  <input
                    type="text"
                    value={block.data?.author || ''}
                    onChange={(e) => updateBlockData(idx, 'author', e.target.value)}
                    placeholder="ที่มา / เจ้าของคำกล่าว..."
                    className="w-full p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-neutral-400"
                  />
                </div>
              )}

              {block.type === 'callout' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={block.data?.type || 'warning'}
                      onChange={(e) => updateBlockData(idx, 'type', e.target.value)}
                      className="col-span-1 p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite"
                    >
                      <option value="warning">คำเตือน (เหลือง)</option>
                      <option value="danger">อันตราย (แดง)</option>
                      <option value="info">ข้อมูล (ฟ้า)</option>
                    </select>
                    <input
                      type="text"
                      value={block.data?.title || ''}
                      onChange={(e) => updateBlockData(idx, 'title', e.target.value)}
                      placeholder="หัวข้อกล่องข้อความ..."
                      className="col-span-2 p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-bold"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={block.data?.text || ''}
                    onChange={(e) => updateBlockData(idx, 'text', e.target.value)}
                    placeholder="คำอธิบายในกล่อง..."
                    className="w-full p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite"
                  />
                </div>
              )}

              {block.type === 'youtube' && (
                <input
                  type="text"
                  value={block.data?.url || ''}
                  onChange={(e) => updateBlockData(idx, 'url', e.target.value)}
                  placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
                  className="w-full p-2 rounded-lg bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-mono"
                />
              )}

              {block.type === 'divider' && (
                <div className="py-2 text-center text-xs text-neutral-500 font-mono">
                  --- เส้นคั่นส่วนเนื้อหา (Divider) ---
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Block Toolbar */}
      <div className="pt-2 border-t border-neutral-800">
        <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-2 font-mono">
          + เพิ่มบล็อกใหม่
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => addBlock('heading')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <Heading className="w-3.5 h-3.5 text-amberGold-400" />
            <span>หัวข้อ</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('text')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span>ย่อหน้า</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('image')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>รูปภาพ</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('quote')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <Quote className="w-3.5 h-3.5 text-amber-400" />
            <span>คำคม</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('callout')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>กล่องเตือน</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('youtube')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5 text-red-500" />
            <span>YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('divider')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-obsidian-900 hover:border-amberGold-500/50 text-xs text-neutral-300 flex items-center gap-1.5"
          >
            <Minus className="w-3.5 h-3.5 text-neutral-400" />
            <span>เส้นคั่น</span>
          </button>
        </div>
      </div>
    </div>
  );
}
