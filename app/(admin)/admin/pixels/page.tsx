'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PixelConfig } from '@/types';
import { Sliders, Save, CheckCircle2, AlertCircle, RefreshCw, Info, ExternalLink } from 'lucide-react';

interface PixelCardData {
  provider: 'ga4' | 'gtm' | 'meta' | 'tiktok' | 'clarity';
  name: string;
  description: string;
  placeholder: string;
  idFormat: string;
  pixel_id: string;
  is_active: boolean;
  guideUrl: string;
}

const DEFAULT_ITEMS: PixelCardData[] = [
  {
    provider: 'ga4',
    name: 'Google Analytics 4 (GA4)',
    description: 'ตรวจวัดสถิติผู้เข้าชม วิเคราะห์พฤติกรรม และจำนวนการเปิดหน้าเพจแบบเรียลไทม์',
    placeholder: 'G-XXXXXXXXXX',
    idFormat: 'ขึ้นต้นด้วย G- ตามด้วยตัวอักษรและตัวเลข 10 หลัก',
    pixel_id: '',
    is_active: false,
    guideUrl: 'https://analytics.google.com'
  },
  {
    provider: 'meta',
    name: 'Meta / Facebook Pixel',
    description: 'ติดตามกิจกรรม Conversion และสร้างกลุ่มเป้าหมายสำหรับโฆษณา Facebook & Instagram',
    placeholder: '123456789012345',
    idFormat: 'ตัวเลขความยาว 15-16 หลัก',
    pixel_id: '',
    is_active: false,
    guideUrl: 'https://business.facebook.com'
  },
  {
    provider: 'tiktok',
    name: 'TikTok Pixel',
    description: 'วัดผลแคมเปญโฆษณาบน TikTok และติดตามผู้เข้าชมจากโซเชียลมีเดีย',
    placeholder: 'CXXXXXXXXXXXXXXXXXXX',
    idFormat: 'ขึ้นต้นด้วยตัว C ตามด้วยตัวอักษรและตัวเลข',
    pixel_id: '',
    is_active: false,
    guideUrl: 'https://ads.tiktok.com'
  },
  {
    provider: 'gtm',
    name: 'Google Tag Manager (GTM)',
    description: 'จัดการแท็กการตลาดและการติดตามสถิติขั้นสูงทั้งหมดผ่านคอนเทนเนอร์เดียว',
    placeholder: 'GTM-XXXXXXX',
    idFormat: 'ขึ้นต้นด้วย GTM- ตามด้วยตัวอักษร 7 หลัก',
    pixel_id: '',
    is_active: false,
    guideUrl: 'https://tagmanager.google.com'
  },
  {
    provider: 'clarity',
    name: 'Microsoft Clarity',
    description: 'บันทึกภาพวิดีโอหน้าจอ Heatmaps และวิเคราะห์ประสบการณ์การใช้งานของผู้เข้าชม (ฟรี 100%)',
    placeholder: 'xxxxxxxxxx',
    idFormat: 'Project ID ตัวอักษรและตัวเลขภาษาอังกฤษ',
    pixel_id: '',
    is_active: false,
    guideUrl: 'https://clarity.microsoft.com'
  }
];

export default function AdminPixelsPage() {
  const [pixels, setPixels] = useState<PixelCardData[]>(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPixels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('pixel_configs').select('*');
      if (error) throw error;
      setPixels(prev => prev.map(def => {
          const row = (data || []).find((r: any) => r.provider === def.provider);
          if (row) {
            return {
              ...def,
              pixel_id: row.pixel_id || '',
              is_active: row.is_active ?? false
            };
          }
          return { ...def, pixel_id: '', is_active: false };
        }));
    } catch (err: any) {
      console.error('Fetch pixel configs error:', err);
      setStatusMsg(`อ่าน Tracking Pixels จาก Supabase ไม่สำเร็จ: ${err.message || 'ตรวจสอบสิทธิ์และการเชื่อมต่อ'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPixels();
  }, []);

  const handleUpdatePixelId = (provider: string, newId: string) => {
    setPixels(prev => prev.map(p => p.provider === provider ? { ...p, pixel_id: newId } : p));
  };

  const handleToggleActive = (provider: string) => {
    setPixels(prev => prev.map(p => p.provider === provider ? { ...p, is_active: !p.is_active } : p));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setStatusMsg(null);

    try {
      const savedRows: Array<{ provider: string; pixel_id: string; is_active: boolean }> = [];
      for (const p of pixels) {
        const { data, error } = await supabase
          .from('pixel_configs')
          .upsert({
            provider: p.provider,
            pixel_id: p.pixel_id.trim(),
            is_active: p.is_active,
            updated_at: new Date().toISOString()
          }, { onConflict: 'provider' })
          .select('provider, pixel_id, is_active')
          .single();

        if (error) {
          throw error;
        }
        if (!data || data.provider !== p.provider) throw new Error(`Supabase ไม่ได้ยืนยัน provider ${p.provider}`);
        savedRows.push(data);
      }

      setPixels(prev => prev.map(pixel => {
        const saved = savedRows.find(row => row.provider === pixel.provider);
        return saved ? { ...pixel, pixel_id: saved.pixel_id || '', is_active: saved.is_active } : pixel;
      }));
      setSavedSuccess(true);
      setStatusMsg(`Supabase ยืนยันการบันทึก Tracking Pixels ${savedRows.length} รายการแล้ว`);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setStatusMsg(`บันทึก Tracking Pixels ไม่สำเร็จ: ${err.message || 'Supabase ไม่ได้ยืนยันการบันทึก'}`);
      await fetchPixels();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amberGold-200">
            จัดการ Tracking Pixels & Analytics IDs
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            กรอก Pixel ID หรือ Measurement ID ในช่องด้านล่าง แล้วกดบันทึก ระบบจะฝังสคริปต์ทำงานทั่วทั้งเว็บไซต์อัตโนมัติ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPixels}
            disabled={loading}
            className="p-2.5 rounded-xl border border-neutral-800 bg-obsidian-900 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            title="รีเฟรชข้อมูลจากฐานข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite text-xs font-serif font-bold transition shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึกลงฐานข้อมูล...' : 'บันทึกการตั้งค่าทั้งหมด'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Explicit Pixel Configuration Cards */}
      <div className="space-y-4">
        {pixels.map((item) => (
          <div 
            key={item.provider}
            className={`p-5 rounded-2xl border transition-all ${
              item.is_active 
                ? 'border-amberGold-500/50 bg-obsidian-900 shadow-xl' 
                : 'border-neutral-800/80 bg-obsidian-900/60 opacity-90'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amberGold-300">
                  {item.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  item.is_active 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {item.is_active ? '● กำลังเปิดใช้งาน (ACTIVE)' : '○ ปิดการทำงาน (INACTIVE)'}
                </span>
              </div>
              <a 
                href={item.guideUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-neutral-500 hover:text-amberGold-400 font-mono flex items-center gap-1 transition"
              >
                <span>เข้าสู่ Console ผู้ให้บริการ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              {item.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-mono text-neutral-300 block mb-1">
                  ระบุ ID หรือ Measurement Code:
                </label>
                <input
                  type="text"
                  value={item.pixel_id}
                  onChange={(e) => handleUpdatePixelId(item.provider, e.target.value)}
                  placeholder={`ตัวอย่าง: ${item.placeholder}`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-neutral-700/80 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-400 font-mono tracking-wide"
                />
                <span className="text-[10px] text-neutral-500 font-mono block mt-1">
                  รูปแบบ: {item.idFormat}
                </span>
              </div>

              <div className="sm:col-span-4 flex sm:justify-end items-center pt-2 sm:pt-4">
                <label className="flex items-center gap-3 text-xs font-mono cursor-pointer select-none bg-obsidian-950/70 p-2.5 rounded-xl border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={() => handleToggleActive(item.provider)}
                    className="w-4 h-4 accent-amberGold-500 rounded cursor-pointer"
                  />
                  <span className={item.is_active ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                    {item.is_active ? 'เปิดสคริปต์นี้' : 'ปิดสคริปต์นี้'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-neutral-800 bg-obsidian-950/60 text-xs text-neutral-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-amberGold-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-neutral-300">คำแนะนำระบบฉีดสคริปต์อัตโนมัติ (Script Injector):</p>
          <p>
            เมื่อบันทึก Pixel ID และตั้งค่าเป็น Active แล้ว คอมโพเนนต์ `ScriptInjector` ในหน้าหลักจะทำการโหลด SDK ของผู้ให้บริการนั้น ๆ (เช่น gtag.js สำหรับ GA4 หรือ fbevents.js สำหรับ Meta) เข้าสู่ส่วน Header ของเว็บโดยอัตโนมัติทันที
          </p>
        </div>
      </div>
    </div>
  );
}
