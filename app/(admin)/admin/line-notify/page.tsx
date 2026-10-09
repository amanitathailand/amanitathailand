'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Hash,
  Key,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  User,
} from 'lucide-react';

type StatusMessage = { type: 'success' | 'error'; text: string; details?: string };

export default function AdminLineSettingsPage() {
  const [channelId, setChannelId] = useState('');
  const [channelAccessToken, setChannelAccessToken] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const [clearAccessToken, setClearAccessToken] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<StatusMessage | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/line-notify', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'อ่านการตั้งค่า LINE จาก Supabase ไม่สำเร็จ');

      setChannelId('');
      setChannelAccessToken('');
      setAdminUserId('');
      setHasAccessToken(Boolean(result.hasAccessToken));
      setClearAccessToken(false);
      setIsEnabled(false);
      for (const row of result.settings || []) {
        if (row.key === 'line_channel_id') setChannelId(typeof row.value === 'string' ? row.value : '');
        if (row.key === 'line_channel_access_token') setHasAccessToken(Boolean(row.is_configured));
        if (row.key === 'line_admin_user_id') setAdminUserId(typeof row.value === 'string' ? row.value : '');
        if (row.key === 'line_notifications_enabled') setIsEnabled(row.value === 'true' && row.is_active === true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'อ่านการตั้งค่า LINE ไม่สำเร็จ';
      setLoadError(message);
      setStatusMsg({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSave = async () => {
    if (loadError) {
      setStatusMsg({ type: 'error', text: 'ยังบันทึกไม่ได้ เพราะอ่านค่าปัจจุบันจากฐานข้อมูลไม่สำเร็จ กรุณาเชื่อมต่อแล้วกดรีเฟรช' });
      return;
    }
    if (isEnabled && !/^U[0-9a-f]{32}$/i.test(adminUserId.trim())) {
      setStatusMsg({ type: 'error', text: 'กรุณาระบุ LINE User ID ของผู้ดูแลให้ถูกต้อง ระบบจะส่งแบบส่วนตัวและไม่ Broadcast' });
      return;
    }
    if (isEnabled && !channelAccessToken.trim() && !hasAccessToken) {
      setStatusMsg({ type: 'error', text: 'กรุณากรอก Channel Access Token ก่อนเปิดการแจ้งเตือน' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    const settingsToSave = [
      { key: 'line_channel_id', value: channelId.trim(), is_active: isEnabled, description: 'LINE Messaging API Channel ID' },
      { key: 'line_admin_user_id', value: adminUserId.trim(), is_active: isEnabled, description: 'LINE User ID ผู้รับแจ้งเตือนส่วนตัว' },
      { key: 'line_notifications_enabled', value: isEnabled ? 'true' : 'false', is_active: isEnabled, description: 'สถานะเปิด/ปิดการแจ้งเตือน LINE' },
      ...(channelAccessToken.trim() ? [{ key: 'line_channel_access_token', value: channelAccessToken.trim(), is_active: isEnabled, description: 'LINE Messaging API Channel Access Token' }] : []),
    ];

    try {
      const response = await fetch('/api/line-notify', {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingsToSave,
          clearSecrets: clearAccessToken ? ['line_channel_access_token'] : [],
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Supabase ไม่ได้ยืนยันการบันทึก');

      setChannelAccessToken('');
      setClearAccessToken(false);
      setStatusMsg({ type: 'success', text: 'Supabase ยืนยันการบันทึกแล้ว โดยไม่ส่ง Channel Access Token กลับมาที่เบราว์เซอร์' });
      await fetchSettings();
    } catch (error) {
      setStatusMsg({ type: 'error', text: `บันทึกการตั้งค่าไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (loadError || !hasAccessToken || !isEnabled || !/^U[0-9a-f]{32}$/i.test(adminUserId.trim())) {
      setStatusMsg({ type: 'error', text: 'บันทึก Channel Access Token, User ID และเปิดแจ้งเตือนก่อน จากนั้นจึงทดสอบได้' });
      return;
    }

    setTesting(true);
    setStatusMsg(null);
    try {
      const response = await fetch('/api/line-notify', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'test' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.details ? `${result.error}: ${result.details}` : result.error || 'ส่งข้อความทดสอบไม่สำเร็จ');
      setStatusMsg({ type: 'success', text: 'LINE Messaging API ส่งข้อความทดสอบถึง LINE User ID ที่ตั้งค่าไว้แล้ว' });
    } catch (error) {
      setStatusMsg({ type: 'error', text: error instanceof Error ? error.message : 'เชื่อมต่อ LINE Messaging API ไม่สำเร็จ' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amberGold-200">ตั้งค่าการแจ้งเตือน LINE Messaging API</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">ส่ง Push Message เฉพาะผู้ดูแลที่กำหนด ไม่มีการ Broadcast ไปยังผู้ติดตามทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchSettings} disabled={loading || saving} className="p-2.5 rounded-xl border border-neutral-800 bg-obsidian-900 text-neutral-300 hover:text-white disabled:opacity-50" title="รีเฟรชจากฐานข้อมูล">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={handleSave} disabled={loading || saving || Boolean(loadError)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite text-xs font-serif font-bold transition shadow-lg disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="p-4 rounded-xl border border-crimson-700 bg-crimson-950/60 text-crimson-200 text-sm">อ่านค่าจาก Supabase ไม่สำเร็จ: {loadError} ค่าที่เห็นอาจไม่ใช่ค่าล่าสุด จึงปิดการบันทึกไว้จนกว่าจะโหลดข้อมูลจริงได้</div>}
      {statusMsg && (
        <div role="status" className={`p-4 rounded-xl border text-xs flex items-start gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' : 'bg-crimson-950/80 border-crimson-700 text-crimson-200'}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl border border-neutral-800 bg-obsidian-900/90 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06C755]/20 border border-[#06C755]/50 flex items-center justify-center"><BellRing className="w-5 h-5 text-[#06C755]" /></div>
            <div>
              <h2 className="text-sm font-serif font-bold text-mushroomWhite">Messaging API credentials</h2>
              <span className="text-[11px] text-neutral-400 font-mono">Access token ถูกเก็บในฐานข้อมูลและไม่ส่งกลับจาก API GET</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-mono cursor-pointer select-none bg-obsidian-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} disabled={loading || Boolean(loadError)} className="w-4 h-4 accent-[#06C755] rounded" />
            <span className={isEnabled ? 'text-[#06C755] font-bold' : 'text-neutral-500'}>{isEnabled ? 'เปิดแจ้งเตือน' : 'ปิดแจ้งเตือน'}</span>
          </label>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-mono text-neutral-300 block mb-1.5 font-bold flex items-center gap-1.5"><Hash className="w-4 h-4 text-amberGold-400" />LINE Channel ID</label>
            <input type="text" value={channelId} onChange={(event) => setChannelId(event.target.value)} disabled={loading || Boolean(loadError)} placeholder="LINE Developers Console → Messaging API" className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-sm text-mushroomWhite focus:border-amberGold-400 font-mono disabled:opacity-50" />
          </div>

          <div>
            <label className="text-xs font-mono text-neutral-300 block mb-1.5 font-bold flex items-center gap-1.5"><Key className="w-4 h-4 text-amberGold-400" />Channel Access Token</label>
            <input type="password" autoComplete="new-password" value={channelAccessToken} onChange={(event) => { setChannelAccessToken(event.target.value); if (event.target.value) setClearAccessToken(false); }} disabled={loading || Boolean(loadError)} placeholder={hasAccessToken ? 'ตั้งค่าแล้ว — เว้นว่างเพื่อเก็บ token เดิม หรือใส่ค่าใหม่' : 'วาง long-lived Channel Access Token ที่นี่'} className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-sm text-mushroomWhite focus:border-amberGold-400 font-mono disabled:opacity-50" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
              <span className="text-[10px] text-neutral-500">สถานะ: {hasAccessToken ? 'มี token ที่เก็บไว้ (ไม่แสดงค่า)' : 'ยังไม่มี token'}</span>
              {hasAccessToken && <label className="text-[10px] text-crimson-300 flex items-center gap-2"><input type="checkbox" checked={clearAccessToken} onChange={(event) => setClearAccessToken(event.target.checked)} disabled={loading || Boolean(loadError)} />ลบ token เดิมเมื่อบันทึก</label>}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-neutral-300 block mb-1.5 font-bold flex items-center gap-1.5"><User className="w-4 h-4 text-emerald-400" />LINE User ID ของผู้ดูแล (ผู้รับ Push)</label>
            <input type="text" value={adminUserId} onChange={(event) => setAdminUserId(event.target.value)} disabled={loading || Boolean(loadError)} placeholder="U ตามด้วยตัวอักษร/ตัวเลข 32 ตัว" className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-sm text-mushroomWhite focus:border-amberGold-400 font-mono disabled:opacity-50" />
            <p className="text-[10px] text-neutral-500 mt-1">ระบบตรวจรูปแบบ User ID และส่งถึงผู้ดูแลคนเดียวเท่านั้น; หากไม่มี ID ที่ถูกต้องจะไม่ส่งข้อความ</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-neutral-800">
          <button type="button" onClick={handleSave} disabled={loading || saving || Boolean(loadError)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite text-xs font-serif font-bold disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกลง Supabase'}</button>
          <button type="button" onClick={handleTestNotification} disabled={loading || testing || Boolean(loadError) || !hasAccessToken || !isEnabled || !/^U[0-9a-f]{32}$/i.test(adminUserId.trim())} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#06C755]/60 bg-[#06C755]/15 hover:bg-[#06C755]/30 text-emerald-300 text-xs font-serif font-bold disabled:opacity-50"><Send className="w-3.5 h-3.5" />{testing ? 'กำลังส่งทดสอบ...' : 'ส่งข้อความทดสอบ'}</button>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-amberGold-800/40 bg-amberGold-950/20 text-xs text-neutral-300 space-y-3">
        <div className="flex items-center gap-2 text-amberGold-300 font-semibold"><ShieldAlert className="w-4 h-4" /><span>ข้อกำหนดและวิธีตั้งค่า</span></div>
        <p>LINE Notify ยุติบริการอย่างเป็นทางการเมื่อ 31 มีนาคม 2025 แล้ว ระบบนี้จึงใช้ LINE Messaging API เท่านั้น และจะไม่ส่งแบบ Broadcast โดยอัตโนมัติ</p>
        <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed text-[11px]">
          <li>สร้างหรือเลือก Messaging API channel ใน <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="text-amberGold-400 underline inline-flex items-center gap-1">LINE Developers Console <ExternalLink className="w-2.5 h-2.5" /></a></li>
          <li>สร้าง long-lived Channel Access Token และกำหนด LINE User ID ของผู้ดูแลที่ติดตาม Official Account แล้ว</li>
          <li>บันทึกค่าและทดสอบ ระบบจะส่ง Push ถึงผู้ดูแลคนเดียว ห้ามใส่ token ในข้อความ/URL</li>
          <li>การแจ้งเตือนจากฟอร์มสาธารณะต้องตั้ง `SUPABASE_SERVICE_ROLE_KEY` ใน server environment; ห้ามใส่ค่านี้ใน client bundle</li>
        </ol>
        <p className="flex items-start gap-2 text-neutral-400"><HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />การแจ้งเตือนเป็นส่วนเสริมของการบันทึกคำสั่งซื้อ; ถ้าการส่ง LINE ล้มเหลว ข้อมูลคำสั่งซื้อยังต้องตรวจสอบได้ในหน้า Orders</p>
      </div>
    </div>
  );
}
