'use client';


import React, { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/tracker';
import { ContactSettings } from '@/types';
import { INITIAL_CONTACT_SETTINGS } from '@/lib/data/initialData';
import { 
  MessageCircle, 
  Facebook, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  QrCode, 
  Copy, 
  Check, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles
} from 'lucide-react';

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(INITIAL_CONTACT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phoneOrLine: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedPromptpay, setCopiedPromptpay] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'อ่านข้อมูลติดต่อจาก Supabase ไม่สำเร็จ');
        if (json.contact) setSettings(prev => ({ ...prev, ...json.contact }));
      } catch (apiErr) {
        console.warn('API settings query notice:', apiErr);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchContactSettings();
  }, []);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast('error', 'กรุณากรอกชื่อ อีเมล และข้อความให้ครบถ้วน');
      return;
    }
    // Show confirmation modal to prevent accidental submission
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone_or_line: form.phoneOrLine.trim() || undefined,
          message: form.message.trim()
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success || !result.persisted) {
        throw new Error(result.error || 'บันทึกข้อความไม่สำเร็จ กรุณาลองอีกครั้ง');
      }

      setSubmitted(true);
      showToast('success', result.notificationStatus === 'sent'
        ? 'บันทึกข้อความแล้วและแจ้งผู้ดูแลทาง LINE แล้ว'
        : 'บันทึกข้อความลงระบบแล้ว แต่การแจ้งเตือน LINE ยังไม่พร้อม ผู้ดูแลควรตรวจรายการในฐานข้อมูล');
    } catch (err: any) {
      console.error(err);
      setSubmitted(false);
      showToast('error', err.message || 'ส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const copyPromptpay = () => {
    navigator.clipboard.writeText(settings.promptpay_number);
    setCopiedPromptpay(true);
    showToast('success', 'คัดลอกหมายเลขพร้อมเพย์แล้ว');
    setTimeout(() => setCopiedPromptpay(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] pt-24 sm:pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-fade-in ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-700 text-emerald-200' 
            : 'bg-crimson-950/95 border-crimson-700 text-crimson-200'
        }`}>
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:opacity-75 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10 sm:mb-12">
        <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-amberGold-400">
          {settings.contact_subtitle || 'Curator & Botanical Archive Contact'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-amberGold-200 mt-2 font-bold">
          {settings.contact_title || 'ติดต่อผู้ดูแลพิพิธภัณฑ์'}
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto leading-relaxed">
          {settings.contact_description || 'สำหรับการสอบถามข้อมูลเชิงวิชาการ ตัวอย่างพืชพรรณ หรือแจ้งความร่วมมือ'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* Contact Channels Card List */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl border border-neutral-800 bg-obsidian-950/80 shadow-2xl space-y-4">
            <h2 className="text-base sm:text-lg font-serif text-amberGold-300 font-bold flex items-center justify-between">
              <span>ช่องทางติดต่อทางการ</span>
              <span className="text-[10px] font-mono font-normal text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800">
                Official Channels
              </span>
            </h2>

            <div className="space-y-3">
              {/* LINE Official Account */}
              <a
                href={settings.line_oa_url || 'https://line.me'}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('line_click', 'contact_page')}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-[#06C755]/30 bg-[#06C755]/5 hover:bg-[#06C755]/15 text-mushroomWhite transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#06C755]/20 text-[#06C755]">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold block text-sm group-hover:text-[#06C755] transition">LINE Official Account</span>
                    <span className="text-xs text-neutral-400 font-mono">{settings.line_oa_id || '@amanitathailand'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#06C755] font-mono">
                  <span>เปิดแชท</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>

              {/* Facebook Fanpage */}
              <a
                href={settings.facebook_url || 'https://facebook.com'}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('facebook_click', 'contact_page')}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-[#1877F2]/30 bg-[#1877F2]/5 hover:bg-[#1877F2]/15 text-mushroomWhite transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#1877F2]/20 text-[#1877F2]">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold block text-sm group-hover:text-[#1877F2] transition">Facebook Fanpage</span>
                    <span className="text-xs text-neutral-400">{settings.facebook_name || 'Amanita Thailand Digital Museum'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#1877F2] font-mono">
                  <span>ดูเพจ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>

              {/* Phone Hotline */}
              {settings.phone_number && (
                <a
                  href={`tel:${settings.phone_number.replace(/[^0-9]/g, '')}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-amberGold-900/40 bg-obsidian-900/60 hover:bg-obsidian-900 text-mushroomWhite transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amberGold-500/10 text-amberGold-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block text-sm group-hover:text-amberGold-300 transition">เบอร์โทรศัพท์ติดต่อ</span>
                      <span className="text-xs text-neutral-400 font-mono">{settings.phone_number}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-amberGold-400 font-mono">กดโทรออก</span>
                </a>
              )}

              {/* Email */}
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-800 bg-obsidian-900/40 hover:bg-obsidian-900 text-mushroomWhite transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block text-sm group-hover:text-white transition">อีเมลส่วนงานวิชาการ</span>
                      <span className="text-xs text-neutral-400 font-mono">{settings.email}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">ส่งอีเมล</span>
                </a>
              )}

              {/* Shopee Store */}
              {settings.shopee_url && (
                <a
                  href={settings.shopee_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-[#EE4D2D]/30 bg-[#EE4D2D]/5 hover:bg-[#EE4D2D]/15 text-mushroomWhite transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#EE4D2D]/20 text-[#EE4D2D]">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block text-sm group-hover:text-[#EE4D2D] transition">ร้านค้าบน Shopee</span>
                      <span className="text-xs text-neutral-400">สั่งซื้อผ่านระบบแพลตฟอร์ม Shopee</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#EE4D2D] font-mono">
                    <span>เปิดร้าน</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              )}
            </div>

            {/* Address & Hours */}
            {(settings.address || settings.business_hours) && (
              <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-xs text-neutral-400">
                {settings.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amberGold-400 shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </div>
                )}
                {settings.business_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span>เวลาทำการ: {settings.business_hours}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PromptPay Support / Donation Card */}
          <div className="p-5 rounded-3xl border border-amberGold-800/40 bg-gradient-to-br from-obsidian-950 to-obsidian-900 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amberGold-500/10 text-amberGold-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-mushroomWhite">บัญชีรับชำระเงิน PromptPay QR กลาง</h3>
                  <p className="text-[11px] text-neutral-400">สำหรับสนับสนุนงานวิจัยหรือสั่งซื้อโดยตรง</p>
                </div>
              </div>
              <button
                type="button"
                onClick={copyPromptpay}
                className="px-2.5 py-1 rounded-lg border border-amberGold-800/60 bg-amberGold-500/10 hover:bg-amberGold-500/20 text-amberGold-300 text-xs font-mono flex items-center gap-1"
              >
                {copiedPromptpay ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPromptpay ? 'คัดลอกแล้ว' : 'คัดลอกเบอร์'}</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-obsidian-950 border border-neutral-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">หมายเลขพร้อมเพย์</span>
                <span className="font-mono text-amberGold-300 font-bold text-sm">{settings.promptpay_number}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">ชื่อบัญชี</span>
                <span className="font-medium text-white">{settings.promptpay_name}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>ธนาคาร: {settings.promptpay_bank}</span>
                <span className="text-[10px] text-emerald-400">พร้อมเพย์มาตรฐาน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form with Instant Alert & Confirmation */}
        <div className="p-5 sm:p-6 rounded-3xl border border-neutral-800 bg-obsidian-950/80 shadow-2xl">
          <h2 className="text-base sm:text-lg font-serif text-amberGold-300 font-bold mb-4 flex items-center justify-between">
            <span>ส่งข้อความถึงภัณฑารักษ์</span>
            <span className="text-xs font-mono font-normal text-neutral-500">แจ้งเตือนเข้า LINE ทันที</span>
          </h2>

          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-mushroomWhite text-xl font-semibold">ข้อความของคุณถูกส่งแล้ว</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                ระบบได้ส่งการแจ้งเตือนไปยังทีมภัณฑารักษ์ผ่าน LINE เรียบร้อยแล้ว และจะติดต่อกลับตามข้อมูลที่คุณระบุไว้โดยเร็ว
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', phoneOrLine: '', message: '' });
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
              >
                ส่งข้อความเพิ่มเติม
              </button>
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-neutral-300 block mb-1">
                  ชื่อ - นามสกุล หรือ นามแฝง <span className="text-crimson-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-neutral-800 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-500 shadow-inner"
                  placeholder="ระบุชื่อของคุณ"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-300 block mb-1">
                  อีเมลติดต่อกลับ <span className="text-crimson-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-neutral-800 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-500 shadow-inner"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-300 block mb-1">
                  เบอร์โทร หรือ LINE ID (ทางเลือกเพื่อติดต่อกลับด่วน)
                </label>
                <input
                  type="text"
                  value={form.phoneOrLine}
                  onChange={(e) => setForm({ ...form, phoneOrLine: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-neutral-800 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-500 shadow-inner"
                  placeholder="เช่น 081-xxx-xxxx หรือ @line_id"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-300 block mb-1">
                  ข้อความหรือคำถาม <span className="text-crimson-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-neutral-800 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-500 resize-none shadow-inner"
                  placeholder="พิมพ์ข้อความ คำถาม หรือข้อมูลที่ต้องการติดต่อ..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-crimson-800 to-crimson-600 hover:from-crimson-700 hover:to-crimson-500 text-mushroomWhite text-sm font-serif font-bold transition shadow-xl shadow-crimson-950/60 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>ตรวจสอบและส่งข้อความ</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Prevent Misclick */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-serif font-bold text-base text-mushroomWhite flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amberGold-400" />
                <span>ยืนยันการส่งข้อความถึงภัณฑารักษ์</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 bg-obsidian-950 p-3.5 rounded-2xl border border-neutral-800">
              <p><span className="text-neutral-500">ผู้ส่ง:</span> <span className="font-semibold text-white">{form.name}</span></p>
              <p><span className="text-neutral-500">อีเมล:</span> <span className="text-white">{form.email}</span></p>
              {form.phoneOrLine && (
                <p><span className="text-neutral-500">เบอร์ / LINE:</span> <span className="text-amberGold-300 font-mono">{form.phoneOrLine}</span></p>
              )}
              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-neutral-500 block mb-1">ข้อความ:</span>
                <p className="text-neutral-200 line-clamp-3 italic">&ldquo;{form.message}&rdquo;</p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              ระบบจะส่งข้อมูลไปยังทีมงานและแจ้งเตือนเข้าแอปพลิเคชัน LINE ทันที
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                กลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amberGold-500 hover:bg-amberGold-400 text-obsidian-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amberGold-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ยืนยันส่งข้อความจริง</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
