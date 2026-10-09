'use client';

import React, { useState, useEffect } from 'react';
import { ContactSettings } from '@/types';
import { INITIAL_CONTACT_SETTINGS } from '@/lib/data/initialData';
import { getPromptPayQrImageUrl } from '@/lib/utils/promptpay';
import { 
  PhoneCall, 
  MessageCircle, 
  Facebook, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  QrCode, 
  Building2, 
  Save, 
  RefreshCw, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  ShieldCheck, 
  X,
  AlertTriangle
} from 'lucide-react';

export default function AdminContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(INITIAL_CONTACT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<number>(590);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedPromptpay, setCopiedPromptpay] = useState(false);


  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const apiRes = await fetch('/api/settings', { cache: 'no-store' });
      const json = await apiRes.json();
      if (!apiRes.ok || !json.success) {
        throw new Error(json.error || 'อ่านข้อมูลจาก Supabase ไม่สำเร็จ');
      }
      if (json.contact) setSettings(prev => ({ ...prev, ...json.contact }));
      setRefreshRequired(false);
    } catch (apiErr) {
      console.warn('API settings load notice:', apiErr);
      const message = apiErr instanceof Error ? apiErr.message : 'อ่านข้อมูลจากฐานข้อมูลไม่สำเร็จ';
      setLoadError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadError || refreshRequired) {
      showToast('error', 'ยังบันทึกไม่ได้ กรุณากดรีเฟรชเพื่ออ่านค่าล่าสุดจากฐานข้อมูลก่อนลองใหม่');
      return;
    }

    const cleanPromptpay = (settings.promptpay_number || '').replace(/[^0-9]/g, '');
    if (cleanPromptpay.length !== 10 && cleanPromptpay.length !== 13 && cleanPromptpay.length !== 15) {
      showToast('error', 'หมายเลขพร้อมเพย์ต้องเป็นเบอร์โทรศัพท์ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก');
      return;
    }

    if (!settings.promptpay_name?.trim()) {
      showToast('error', 'กรุณาระบุชื่อบัญชีผู้รับเงินสำหรับตรวจสอบความถูกต้อง');
      return;
    }

    setSaving(true);

    try {
      const apiRes = await fetch('/api/settings', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactSettings: { ...settings, promptpay_number: cleanPromptpay },
        })
      });

      const result = await apiRes.json();
      if (!apiRes.ok || !result.success || result.supabaseStatus !== 'synced') {
        const reference = result.requestId ? ` (รหัสอ้างอิง ${result.requestId})` : '';
        const operation = result.operation === 'read'
          ? ' (อ่านค่าก่อนบันทึกไม่สำเร็จ)'
          : result.operation === 'write'
            ? ' (เขียนข้อมูลลง Supabase ไม่สำเร็จ)'
            : '';
        const code = result.code ? ` [${result.code}]` : '';
        throw new Error(`${result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'}${operation}${code}${reference}`);
      }

      setSettings(prev => ({ ...prev, ...(result.contact || settings) }));
      showToast('success', 'Supabase ยืนยันการบันทึกช่องทางติดต่อและ PromptPay แล้ว');
    } catch (err: any) {
      setRefreshRequired(true);
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setSettings(INITIAL_CONTACT_SETTINGS);
    setShowResetConfirm(false);
    showToast('success', 'รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อย (กดบันทึกเพื่ออัปเดตลงฐานข้อมูล)');
  };

  const copyPromptPayToClipboard = () => {
    navigator.clipboard.writeText(settings.promptpay_number);
    setCopiedPromptpay(true);
    setTimeout(() => setCopiedPromptpay(false), 2000);
  };

  const qrPreviewUrl = getPromptPayQrImageUrl(settings.promptpay_number, previewAmount);

  return (
    <div className="space-y-6 max-w-6xl">
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
            Amanita CMS Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-mushroomWhite">
            ตั้งค่าช่องทางติดต่อ & บัญชีรับชำระเงิน PromptPay QR
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            ปรับเปลี่ยน LINE OA, Facebook, เบอร์โทร, อีเมล, ที่อยู่ และบัญชีรับโอนเงิน PromptPay สำหรับหน้าสั่งซื้อและหน้าติดต่อ
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading || saving}
            className="px-3.5 py-2 rounded-xl border border-neutral-700 bg-obsidian-900 hover:border-amberGold-500 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            title="โหลดข้อมูลล่าสุดจากฐานข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 bg-obsidian-900 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200 text-xs flex items-center gap-1.5"
            title="รีเซ็ตเป็นค่าเริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเดิม</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="p-4 rounded-xl border border-crimson-700 bg-crimson-950/60 text-crimson-200 text-sm">
          โหลดข้อมูลช่องทางติดต่อ/PromptPay ไม่สำเร็จ: {loadError} — ค่าที่เห็นอาจเป็นค่าเริ่มต้น จึงปิดการบันทึกไว้จนกว่าจะอ่านฐานข้อมูลได้
        </div>
      )}
      {refreshRequired && !loadError && (
        <div role="alert" className="p-4 rounded-xl border border-amberGold-700 bg-amberGold-950/40 text-amberGold-200 text-sm">
          Supabase ยังไม่ยืนยันการบันทึกครั้งก่อน กรุณากดรีเฟรชเพื่อตรวจค่าจริงก่อนลองอีกครั้ง
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: PromptPay QR Payment Settings (Unified here!) */}
        <div className="p-6 rounded-3xl border border-amberGold-700/50 bg-gradient-to-b from-obsidian-900 to-obsidian-950 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amberGold-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amberGold-500/10 border border-amberGold-500/30 text-amberGold-400 shadow-inner">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-mushroomWhite flex items-center gap-2">
                  <span>การตั้งค่าบัญชีรับชำระเงิน PromptPay QR</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono">
                    เชื่อมต่อระบบสั่งซื้อจริง
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  ระบบจะนำข้อมูลนี้ไปสร้าง EMVCo PromptPay QR Code แบบไดนามิกตามยอดสั่งซื้อจริงในหน้าเว็บ
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-200 font-semibold block mb-1.5">
                    หมายเลขพร้อมเพย์ (PromptPay Number) <span className="text-crimson-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.promptpay_number}
                    onChange={(e) => setSettings({ ...settings, promptpay_number: e.target.value })}
                    placeholder="เช่น 0909964514"
                    className="w-full p-3 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite font-mono text-sm focus:border-amberGold-500 shadow-inner"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    เบอร์มือถือ 10 หลัก (เช่น 0909964514) หรือเลขประจำตัวประชาชน 13 หลัก
                  </span>
                </div>

                <div>
                  <label className="text-xs text-neutral-200 font-semibold block mb-1.5">
                    ชื่อบัญชีผู้รับเงิน (Account Name) <span className="text-crimson-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.promptpay_name}
                    onChange={(e) => setSettings({ ...settings, promptpay_name: e.target.value })}
                    placeholder="เช่น นายวันชนะ"
                    className="w-full p-3 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-sm focus:border-amberGold-500 shadow-inner"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    แสดงบนหน้าชำระเงินเพื่อให้ผู้ซื้อตรวจสอบความถูกต้องก่อนโอน
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-200 font-semibold block mb-1.5">
                    ธนาคารผู้ให้บริการ (Bank Provider) <span className="text-crimson-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.promptpay_bank}
                    onChange={(e) => setSettings({ ...settings, promptpay_bank: e.target.value })}
                    placeholder="เช่น ธนาคารกสิกรไทย (K-Bank)"
                    className="w-full p-3 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-sm focus:border-amberGold-500 shadow-inner"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-200 font-semibold block mb-1.5">
                    คำแนะนำในการชำระเงิน (Payment Note)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.payment_instructions || ''}
                    onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
                    placeholder="คำแนะนำที่แสดงใต้ QR Code ในหน้าสั่งซื้อ..."
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Interactive PromptPay Preview Card */}
            <div className="p-5 rounded-2xl border border-amberGold-800/40 bg-obsidian-950/80 flex flex-col items-center text-center space-y-3">
              <span className="text-[11px] font-mono text-amberGold-400 uppercase tracking-wider font-bold">
                ตัวอย่าง QR Code สด (Live Preview)
              </span>

              <div className="p-3 bg-white rounded-2xl shadow-xl border border-neutral-300">
                <img
                  src={qrPreviewUrl}
                  alt="PromptPay QR Preview"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              </div>

              <div className="w-full space-y-1 text-xs">
                <div className="flex items-center justify-between px-2 py-1 rounded bg-obsidian-900 border border-neutral-800">
                  <span className="text-neutral-400">เบอร์:</span>
                  <span className="font-mono text-amberGold-300 font-bold">{settings.promptpay_number || '-'}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-obsidian-900 border border-neutral-800">
                  <span className="text-neutral-400">ชื่อบัญชี:</span>
                  <span className="text-mushroomWhite font-medium">{settings.promptpay_name || '-'}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-obsidian-900 border border-neutral-800">
                  <span className="text-neutral-400">ธนาคาร:</span>
                  <span className="text-neutral-300">{settings.promptpay_bank || '-'}</span>
                </div>
              </div>

              <div className="w-full pt-1 flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">ทดสอบยอดเงิน:</span>
                <div className="flex gap-1 font-mono">
                  {[390, 590, 990].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setPreviewAmount(amt)}
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        previewAmount === amt 
                          ? 'border-amberGold-500 bg-amberGold-500/20 text-amberGold-300 font-bold'
                          : 'border-neutral-800 bg-obsidian-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      ฿{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Main Contact Channels (LINE, Facebook, Phone, Email, Shopee) */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/60 space-y-5">
          <h3 className="text-lg font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amberGold-400" />
            <span>ช่องทางติดต่อหลักของเว็บไซต์ (Social & Direct Contact)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LINE Official Account */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#06C755] flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>LINE Official Account</span>
                </span>
                {settings.line_oa_url && (
                  <a 
                    href={settings.line_oa_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-neutral-400 hover:text-[#06C755] flex items-center gap-1"
                  >
                    <span>เปิดลิงก์</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">LINE OA URL (ลิงก์แอดไลน์)</label>
                <input
                  type="text"
                  value={settings.line_oa_url}
                  onChange={(e) => setSettings({ ...settings, line_oa_url: e.target.value })}
                  placeholder="https://line.me/R/ti/p/@amanitathailand"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-[#06C755]"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">LINE ID (สำหรับแสดงบนหน้าเว็บ)</label>
                <input
                  type="text"
                  value={settings.line_oa_id}
                  onChange={(e) => setSettings({ ...settings, line_oa_id: e.target.value })}
                  placeholder="@amanitathailand"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-[#06C755]"
                />
              </div>
            </div>

            {/* Facebook Fanpage */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1877F2] flex items-center gap-1.5">
                  <Facebook className="w-4 h-4" />
                  <span>Facebook Fanpage</span>
                </span>
                {settings.facebook_url && (
                  <a 
                    href={settings.facebook_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-neutral-400 hover:text-[#1877F2] flex items-center gap-1"
                  >
                    <span>เปิดลิงก์</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Facebook Page URL</label>
                <input
                  type="text"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/amanitathailand"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">ชื่อหน้าเพจ (Page Display Name)</label>
                <input
                  type="text"
                  value={settings.facebook_name}
                  onChange={(e) => setSettings({ ...settings, facebook_name: e.target.value })}
                  placeholder="Amanita Thailand Digital Museum"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-[#1877F2]"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
              <span className="text-xs font-bold text-amberGold-400 flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>เบอร์โทรศัพท์ติดต่อ & ฝ่ายบริการลูกค้า</span>
              </span>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">เบอร์โทรศัพท์หลัก</label>
                <input
                  type="text"
                  value={settings.phone_number}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  placeholder="090-996-4514"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-amberGold-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">อีเมลติดต่อฝ่ายวิชาการ (Email)</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="contact@amanitathailand.com"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-amberGold-500"
                />
              </div>
            </div>

            {/* Shopee & Business Hours */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
              <span className="text-xs font-bold text-[#EE4D2D] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>ร้านค้าออนไลน์ Shopee & เวลาทำการ</span>
              </span>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Shopee Official Store URL</label>
                <input
                  type="text"
                  value={settings.shopee_url}
                  onChange={(e) => setSettings({ ...settings, shopee_url: e.target.value })}
                  placeholder="https://shopee.co.th/amanitathailand"
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs font-mono focus:border-[#EE4D2D]"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">วันและเวลาทำการ</label>
                <input
                  type="text"
                  value={settings.business_hours}
                  onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  placeholder="ทุกวัน เวลา 09:00 - 18:00 น."
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2 p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
              <span className="text-xs font-bold text-amberGold-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>ที่อยู่สำนักงาน / แหล่งอนุรักษ์พืชพรรณ</span>
              </span>
              <div>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="ศูนย์ศึกษาและอนุรักษ์พืชพรรณ Amanita Thailand..."
                  className="w-full p-2.5 rounded-xl bg-obsidian-900 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Contact Page Headlines */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-obsidian-900/60 space-y-4">
          <h3 className="text-base font-serif font-bold text-mushroomWhite border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amberGold-400" />
            <span>หัวข้อและคำบรรยายหน้าติดต่อ (/contact)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">หัวข้อหน้าติดต่อ (Contact Title)</label>
              <input
                type="text"
                value={settings.contact_title}
                onChange={(e) => setSettings({ ...settings, contact_title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">คำบรรยายย่อยภาษาอังกฤษ (Contact Subtitle)</label>
              <input
                type="text"
                value={settings.contact_subtitle}
                onChange={(e) => setSettings({ ...settings, contact_subtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">คำอธิบายเพิ่มเติม (Description)</label>
              <textarea
                rows={2}
                value={settings.contact_description}
                onChange={(e) => setSettings({ ...settings, contact_description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite text-xs focus:border-amberGold-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ข้อมูลจะถูกบันทึกลง Supabase และซิงค์ไปยังหน้า /contact, /products และ Order Modal ทันที</span>
          </div>

          <button
            type="submit"
            disabled={saving || loading || Boolean(loadError) || refreshRequired}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-amberGold-500 hover:bg-amberGold-400 text-obsidian-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amberGold-500/20 disabled:opacity-50 transition"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกช่องทางติดต่อ & บัญชีพร้อมเพย์'}</span>
          </button>
        </div>
      </form>

      {/* Safety Confirmation Dialog for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-serif font-bold text-mushroomWhite">ยืนยันการคืนค่าเริ่มต้น?</h4>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              คุณต้องการคืนค่าช่องทางติดต่อและบัญชีพร้อมเพย์กลับไปเป็นค่าตั้งต้นของ Amanita Thailand หรือไม่? การเปลี่ยนแปลงจะมีผลเมื่อคุณกดบันทึก
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 rounded-xl bg-amberGold-500 hover:bg-amberGold-400 text-obsidian-950 text-xs font-bold"
              >
                ยืนยันคืนค่าเดิม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
