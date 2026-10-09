'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { PortalMenuIcon, PortalMenuItem, SiteContentSettings } from '@/types';
import { INITIAL_PORTAL_MENU_ITEMS } from '@/lib/data/portalMenu';
import { 
  Type, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  QrCode, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  X,
  ExternalLink,
  ArrowRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Compass,
  BookOpen,
  Layers,
  PhoneCall,
  Feather,
  Package
} from 'lucide-react';

const PORTAL_ICON_PREVIEW: Partial<Record<PortalMenuIcon, React.ComponentType<{ className?: string }>>> = {
  sparkles: Sparkles,
  compass: Compass,
  book: BookOpen,
  layers: Layers,
  phone: PhoneCall,
  feather: Feather,
  package: Package,
};

const DEFAULT_SETTINGS: SiteContentSettings = {
  site_title: 'Amanita Muscaria Digital Museum',
  site_subtitle: 'แพลตฟอร์มพิพิธภัณฑ์ดิจิทัลและแหล่งรวบรวมตัวอย่างพฤกษศาสตร์ Amanita Muscaria แห่งแรกในประเทศไทย',
  portal_button_text: 'เข้าสู่หอพิพิธภัณฑ์ดิจิทัล',
  portal_menu_items: INITIAL_PORTAL_MENU_ITEMS,
  home_display_mode: '3d',
  home_photo_image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop',
  home_photo_alt: 'Amanita Muscaria botanical specimen',
  home_photo_caption: 'Amanita Muscaria (L.) Lam.',
  home_photo_subtitle: 'ตัวอย่างพฤกษศาสตร์สำหรับการศึกษา',
  home_3d_model_url: '/models/amanita.glb',
  museum_title: 'หอนิทรรศการเสมือนจริง',
  museum_subtitle: 'สำรวจชีววิทยา ประวัติศาสตร์ชาติพันธุ์ และแบบจำลอง 3 มิติ',
  museum_description: 'ดื่มด่ำกับประสบการณ์นิทรรศการเห็ดอมฤต ผ่านระบบเสียงบรรยายและแบบจำลองชีวภาพ',
  products_title: 'ตัวอย่างพฤกษศาสตร์เพื่อการสะสมและการศึกษา',
  products_subtitle: 'Botanical Herbarium Specimens & Collector Editions',
  products_description: 'ตัวอย่างเห็ด Amanita Muscaria แท้เกรดคัดสรร นำเข้าถูกกฎหมายเพื่อการศึกษาวิจัยอนุกรมวิธานและงานสะสมพฤกษศาสตร์',
  articles_title: 'คลังบทความวิชาการ & ประวัติศาสตร์ชาติพันธุ์',
  articles_subtitle: 'Ethnobotany, Science & Cultural Studies',
  articles_description: 'องค์ความรู้ทางวิทยาศาสตร์ สารประกอบทางชีวเคมี และบทบาททางวัฒนธรรมของเห็ดหมวกแดง',
  footer_disclaimer: 'คำเตือน: วัตถุประสงค์เพื่อการศึกษา อนุกรมวิธานพืช และการสะสมทางพฤกษศาสตร์เท่านั้น ห้ามนำไปบริโภคโดยเด็ดขาด',
  promptpay_number: '0909964514',
  promptpay_name: 'นายวันชนะ',
  promptpay_bank: 'ธนาคารกสิกรไทย (K-Bank)'
};

function mergeSiteSettings(value: unknown): SiteContentSettings {
  const saved = value && typeof value === 'object' ? value as Partial<SiteContentSettings> : {};
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    portal_menu_items: Array.isArray(saved.portal_menu_items) ? saved.portal_menu_items : INITIAL_PORTAL_MENU_ITEMS,
  };
}

export default function AdminSiteContentPage() {
  const [settings, setSettings] = useState<SiteContentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPortalItemId, setUploadingPortalItemId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();


  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'อ่านข้อมูลจาก Supabase ไม่สำเร็จ');
      }
      if (json.site) setSettings(mergeSiteSettings(json.site));
      setRefreshRequired(false);
    } catch (err: any) {
      console.warn('Could not load site_content setting:', err.message);
      setLoadError(err.message || 'อ่านข้อมูลจากฐานข้อมูลไม่สำเร็จ');
      showToast('error', err.message || 'อ่านข้อมูลจากฐานข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingPortalItemId) {
      showToast('error', 'กรุณารอให้อัปโหลดภาพเสร็จก่อนบันทึกเมนู');
      return;
    }
    if (loadError || refreshRequired) {
      showToast('error', 'ยังบันทึกไม่ได้ กรุณากดรีเฟรชเพื่ออ่านค่าล่าสุดจากฐานข้อมูลก่อนลองใหม่');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteSettings: settings })
      });

      const result = await res.json();
      if (!res.ok || !result.success || result.supabaseStatus !== 'synced') {
        const reference = result.requestId ? ` (รหัสอ้างอิง ${result.requestId})` : '';
        throw new Error((result.error || 'Supabase ไม่ได้ยืนยันการบันทึก') + reference);
      }

      if (result.site) setSettings(mergeSiteSettings(result.site));
      showToast('success', 'Supabase ยืนยันการบันทึกเนื้อหาเว็บไซต์และเมนูวงแหวนแล้ว');
    } catch (err: any) {
      setRefreshRequired(true);
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const updatePortalItems = (update: (items: PortalMenuItem[]) => PortalMenuItem[]) => {
    setSettings((current) => {
      const currentItems = current.portal_menu_items || INITIAL_PORTAL_MENU_ITEMS;
      const nextItems = update([...currentItems]);
      return {
        ...current,
        portal_menu_items: nextItems.map((item, index) => ({ ...item, sort_order: index + 1 })),
      };
    });
  };

  const patchPortalItem = (id: string, patch: Partial<PortalMenuItem>) => {
    updatePortalItems((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const addPortalItem = () => {
    updatePortalItems((items) => [
      ...items,
      {
        id: `portal-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
        label: '',
        sub: '',
        href: '/museum',
        icon_key: 'sparkles',
        image_url: '',
        sort_order: items.length + 1,
        status: 'draft',
      },
    ]);
  };

  const movePortalItem = (id: string, delta: -1 | 1) => {
    updatePortalItems((items) => {
      const from = items.findIndex((item) => item.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= items.length) return items;
      [items[from], items[to]] = [items[to], items[from]];
      return items;
    });
  };

  const uploadPortalImage = async (id: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'เลือกได้เฉพาะไฟล์ภาพ');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('error', 'ไฟล์ภาพต้องมีขนาดไม่เกิน 8 MB');
      return;
    }

    setUploadingPortalItemId(id);
    let storagePath = '';
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      storagePath = `portal-menu/${uniqueId}_${cleanName}`;
      const { error: uploadError } = await supabase.storage.from('museum-media').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('museum-media').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;
      const { error: metadataError } = await supabase.from('media_assets').insert([{
        file_name: file.name,
        storage_path: storagePath,
        public_url: publicUrl,
        mime_type: file.type,
        file_size_bytes: file.size,
      }]).select('id').single();

      if (metadataError) {
        await supabase.storage.from('museum-media').remove([storagePath]);
        throw metadataError;
      }

      patchPortalItem(id, { image_url: publicUrl });
      showToast('success', 'อัปโหลดภาพแล้ว กดปุ่มบันทึกด้านล่างเพื่อผูกภาพกับการ์ด');
    } catch (error: any) {
      showToast('error', `อัปโหลดภาพไม่สำเร็จ: ${error.message || 'ตรวจสอบสิทธิ์ Storage และ Media Library'}`);
    } finally {
      setUploadingPortalItemId(null);
    }
  };

  const portalMenuItems = [...(settings.portal_menu_items || [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-2xl animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200' 
            : 'bg-crimson-950/90 border-crimson-700 text-crimson-200'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400 font-bold block">
            Amanita CMS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-mushroomWhite">
            แก้ไขหัวข้อ & ข้อความหลักเว็บไซต์ (Site Content)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            ปรับแต่งชื่อเว็บ, คำบรรยายหน้าพิพิธภัณฑ์/สินค้า/บทความ และคำเตือนส่วนท้าย
          </p>
        </div>
        <button
          type="button"
          onClick={loadSettings}
          disabled={loading || saving}
          className="px-4 py-2 rounded-xl border border-neutral-700 bg-obsidian-900 hover:border-amberGold-500 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {loadError && (
        <div role="alert" className="p-4 rounded-xl border border-crimson-700 bg-crimson-950/60 text-crimson-200 text-sm">
          โหลด Site Content จากฐานข้อมูลไม่สำเร็จ: {loadError} — ค่าที่เห็นอาจเป็นค่าเริ่มต้น จึงปิดการบันทึกไว้จนกว่าจะโหลดข้อมูลจริงได้
        </div>
      )}
      {refreshRequired && !loadError && (
        <div role="alert" className="p-4 rounded-xl border border-amberGold-700 bg-amberGold-950/40 text-amberGold-200 text-sm">
          Supabase ยังไม่ยืนยันการบันทึกครั้งก่อน กรุณากดรีเฟรชเพื่อตรวจค่าจริงก่อนลองอีกครั้ง
        </div>
      )}

      {/* Notice Card: PromptPay Moved to Contact & Payment Settings */}
      <div className="p-5 rounded-2xl border border-amberGold-800/40 bg-gradient-to-r from-amberGold-950/30 to-obsidian-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amberGold-500/10 border border-amberGold-500/30 text-amberGold-400 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-bold text-amberGold-200">
              การตั้งค่าบัญชีรับชำระเงิน PromptPay QR ได้ย้ายไปรวมกับหน้าใหม่แล้ว
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              เพื่อความสะดวกในการจัดการช่องทางติดต่อและบัญชีรับเงินในที่เดียวกัน คุณสามารถไปที่หน้า &quot;ช่องทางติดต่อ &amp; พร้อมเพย์&quot; ได้ทันที
            </p>
          </div>
        </div>

        <Link
          href="/admin/contact"
          className="px-4 py-2 rounded-xl bg-amberGold-500 hover:bg-amberGold-400 text-obsidian-950 font-bold text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-md"
        >
          <span>ไปที่หน้าตั้งค่าติดต่อ & พร้อมเพย์</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section: General Website Headlines */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/50 space-y-4">
          <h3 className="text-base font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Type className="w-4 h-4 text-amberGold-400" />
            <span>หัวข้อหลักหน้าแรก (Home & Portal)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">ชื่อเว็บไซต์หลัก (Site Title)</label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">ข้อความปุ่มเข้าสู่พิพิธภัณฑ์</label>
              <input
                type="text"
                value={settings.portal_button_text}
                onChange={(e) => setSettings({ ...settings, portal_button_text: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">คำบรรยายสั้นหน้าแรก (Site Subtitle)</label>
              <textarea
                rows={2}
                value={settings.site_subtitle}
                onChange={(e) => setSettings({ ...settings, site_subtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
          </div>
        </div>

        {/* Section: CRUD for the radial cards shown after clicking the mushroom */}
        <section className="p-6 rounded-3xl border border-amberGold-800/40 bg-obsidian-900/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-serif font-bold text-mushroomWhite flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amberGold-400" />
                เมนูวงแหวนเมื่อคลิกดอกเห็ด (Radial Portal)
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1">เพิ่ม/แก้ไข/ลบหัวข้อ ปรับลำดับ ซ่อนเป็นฉบับร่าง และใช้ภาพแทนไอคอนบนการ์ดได้</p>
            </div>
            <button
              type="button"
              onClick={addPortalItem}
              disabled={portalMenuItems.length >= 12 || loading || saving}
              className="px-3 py-2 rounded-lg bg-crimson-800 hover:bg-crimson-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> เพิ่มการ์ด
            </button>
          </div>

          <p className="text-[10px] text-neutral-500">แสดงได้สูงสุด 12 การ์ด • ลิงก์ต้องเป็น path ภายใน เช่น <code>/museum/legend-hall</code> • รูปภาพจากการอัปโหลดจะอยู่ใน Media Library</p>

          {portalMenuItems.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-neutral-700 text-center text-xs text-neutral-500">
              ยังไม่มีการ์ดในเมนูวงแหวน กด “เพิ่มการ์ด” เพื่อเริ่มสร้างรายการ
            </div>
          )}

          <div className="space-y-3">
            {portalMenuItems.map((item, index) => (
              <article key={item.id} className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/70 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-amberGold-500/10 text-amberGold-300 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                    <span className="text-xs font-semibold text-neutral-200 truncate">{item.label || 'การ์ดใหม่'}</span>
                    <span className={`text-[9px] px-2 py-1 rounded-full ${item.status === 'published' ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>
                      {item.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" title="เลื่อนขึ้น" aria-label="เลื่อนการ์ดขึ้น" disabled={index === 0} onClick={() => movePortalItem(item.id, -1)} className="p-2 rounded-lg hover:bg-neutral-800 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" title="เลื่อนลง" aria-label="เลื่อนการ์ดลง" disabled={index === portalMenuItems.length - 1} onClick={() => movePortalItem(item.id, 1)} className="p-2 rounded-lg hover:bg-neutral-800 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" title="ลบการ์ด (ยังไม่บันทึกจนกดปุ่มด้านล่าง)" aria-label="ลบการ์ด" onClick={() => updatePortalItems((items) => items.filter((entry) => entry.id !== item.id))} className="p-2 rounded-lg text-crimson-300 hover:bg-crimson-950/60"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">หัวข้อภาษาไทย</label>
                    <input required maxLength={120} value={item.label} onChange={(e) => patchPortalItem(item.id, { label: e.target.value })} className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500" placeholder="เช่น ห้องประวัติศาสตร์" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">คำบรรยายภาษาอังกฤษ</label>
                    <input maxLength={120} value={item.sub} onChange={(e) => patchPortalItem(item.id, { sub: e.target.value })} className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500" placeholder="เช่น Chronicles" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">ลิงก์ปลายทางในเว็บไซต์</label>
                    <input required maxLength={300} value={item.href} onChange={(e) => patchPortalItem(item.id, { href: e.target.value })} className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-amberGold-500" placeholder="/museum/legend-hall" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">สถานะการ์ด</label>
                    <select value={item.status} onChange={(e) => patchPortalItem(item.id, { status: e.target.value as 'published' | 'draft' })} className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500">
                      <option value="published">เผยแพร่ในเมนู</option>
                      <option value="draft">ฉบับร่าง (ซ่อนไม่ให้ผู้เข้าชมเห็น)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">ไอคอน (ใช้เมื่อไม่มีภาพ)</label>
                    <select value={item.icon_key} onChange={(e) => patchPortalItem(item.id, { icon_key: e.target.value as PortalMenuIcon })} className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500">
                      <option value="none">ไม่มี icon</option><option value="sparkles">ประกายดาว</option><option value="compass">เข็มทิศ</option><option value="book">หนังสือ</option><option value="layers">ชั้นตัวอย่าง</option><option value="phone">ติดต่อ</option><option value="feather">ปากกา/บทความ</option><option value="package">กล่องตัวอย่าง</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">URL ภาพ (หรืออัปโหลดจากเครื่อง)</label>
                    <input value={item.image_url || ''} onChange={(e) => patchPortalItem(item.id, { image_url: e.target.value })} className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500" placeholder="https://... หรือ /images/..." />
                    <label className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-700 hover:border-amberGold-500 text-[10px] text-neutral-300 cursor-pointer">
                      <Upload className={`w-3.5 h-3.5 ${uploadingPortalItemId === item.id ? 'animate-bounce' : ''}`} />
                      {uploadingPortalItemId === item.id ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพไป Supabase'}
                      <input type="file" accept="image/*" disabled={Boolean(uploadingPortalItemId) || saving} className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0]; if (file) void uploadPortalImage(item.id, file); e.currentTarget.value = ''; }} />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
                  <div className="w-14 h-14 rounded-xl border border-amberGold-500/30 bg-obsidian-900 flex items-center justify-center overflow-hidden shrink-0">
                    {item.image_url ? <img src={item.image_url} alt="ตัวอย่างภาพการ์ด" className="w-full h-full object-cover" /> : (() => { const PreviewIcon = PORTAL_ICON_PREVIEW[item.icon_key]; return PreviewIcon ? <PreviewIcon className="w-5 h-5 text-amberGold-400" /> : null; })()}
                  </div>
                  <p className="text-[10px] text-neutral-500">{item.image_url ? 'ภาพนี้จะแสดงแทนไอคอนบนการ์ด' : item.icon_key === 'none' ? 'ไม่มีภาพและไม่มี icon — เว้นพื้นที่ภาพบนการ์ดไว้' : 'ไม่มีภาพ — เมนูจะแสดงไอคอนที่เลือกไว้'}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/50 space-y-4">
          <h3 className="text-base font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amberGold-400" />
            <span>ภาพหน้าแรกและฉาก 3D</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">โหมดเริ่มต้นของหน้า Home</label>
              <select
                value={settings.home_display_mode || '3d'}
                onChange={(e) => setSettings({ ...settings, home_display_mode: e.target.value as '3d' | 'real_photo' })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              >
                <option value="3d">ฉากโมเดล 3D</option>
                <option value="real_photo">ภาพถ่ายพร้อม parallax</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">URL โมเดล GLB (เว้นว่างเพื่อใช้โมเดลใน public/models)</label>
              <input
                type="url"
                value={settings.home_3d_model_url || ''}
                onChange={(e) => setSettings({ ...settings, home_3d_model_url: e.target.value })}
                placeholder="/models/amanita.glb หรือ URL สาธารณะจาก Media Library"
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">ไฟล์โมเดลจากโดเมนภายนอกต้องอนุญาต CORS; แนะนำอัปโหลดผ่าน Media Library</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">URL ภาพในโหมดภาพถ่าย</label>
              <input
                type="url"
                value={settings.home_photo_image_url || ''}
                onChange={(e) => setSettings({ ...settings, home_photo_image_url: e.target.value })}
                placeholder="URL จาก Media Library หรือ URL รูปที่เข้าถึงได้สาธารณะ"
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">ข้อความกำกับภาพ</label>
              <input
                type="text"
                value={settings.home_photo_caption || ''}
                onChange={(e) => setSettings({ ...settings, home_photo_caption: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">คำอธิบายภาพสำหรับ accessibility</label>
              <input
                type="text"
                value={settings.home_photo_alt || ''}
                onChange={(e) => setSettings({ ...settings, home_photo_alt: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">คำบรรยายใต้ภาพ</label>
              <input
                type="text"
                value={settings.home_photo_subtitle || ''}
                onChange={(e) => setSettings({ ...settings, home_photo_subtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Products Section Headlines */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/50 space-y-4">
          <h3 className="text-base font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amberGold-400" />
            <span>หัวข้อหน้าร้านค้าตัวอย่างพฤกษศาสตร์ (/products)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">หัวข้อหน้าสินค้า (Title)</label>
              <input
                type="text"
                value={settings.products_title}
                onChange={(e) => setSettings({ ...settings, products_title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">คำบรรยายย่อย (Subtitle)</label>
              <input
                type="text"
                value={settings.products_subtitle}
                onChange={(e) => setSettings({ ...settings, products_subtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">คำอธิบายรายละเอียด (Description)</label>
              <textarea
                rows={2}
                value={settings.products_description}
                onChange={(e) => setSettings({ ...settings, products_description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Museum & Articles Headlines */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/50 space-y-4">
          <h3 className="text-base font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amberGold-400" />
            <span>หัวข้อหน้าพิพิธภัณฑ์ & บทความวิชาการ</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">หัวข้อหน้าพิพิธภัณฑ์ (Museum Title)</label>
              <input
                type="text"
                value={settings.museum_title}
                onChange={(e) => setSettings({ ...settings, museum_title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">หัวข้อหน้าบทความ (Articles Title)</label>
              <input
                type="text"
                value={settings.articles_title}
                onChange={(e) => setSettings({ ...settings, articles_title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Footer Disclaimer */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/50 space-y-4">
          <h3 className="text-base font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amberGold-400" />
            <span>ข้อความคำเตือนทางกฎหมายส่วนท้าย (Footer Disclaimer)</span>
          </h3>
          <div>
            <textarea
              rows={2}
              value={settings.footer_disclaimer}
              onChange={(e) => setSettings({ ...settings, footer_disclaimer: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || loading || Boolean(loadError) || refreshRequired || Boolean(uploadingPortalItemId)}
            className="px-6 py-3 rounded-2xl bg-amberGold-500 hover:bg-amberGold-400 text-obsidian-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amberGold-500/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกเนื้อหาเว็บไซต์และเมนูวงแหวนลงฐานข้อมูล'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
