import React from 'react';
import { createClientServer } from '@/lib/supabase/server';
import { Eye, Sparkles, MessageCircle, TrendingUp, Layers } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let totalViews: number | null = null;
  let portalEntries: number | null = null;
  let lineClicks: number | null = null;
  let fbClicks: number | null = null;
  let recentEvents: any[] = [];
  let loadError = '';

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  // Fetch actual persisted metrics in parallel; a timeout is shown as an error, never as sample data.
  try {
    const fetchDashboardStats = async () => {
      const supabase = await createClientServer();
      const [totalRes, portalRes, lineRes, fbRes, eventsRes] = await Promise.all([
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'museum_entry'),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'line_click'),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'facebook_click'),
        supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      const failed = [totalRes, portalRes, lineRes, fbRes, eventsRes].find((result) => result.error);
      if (failed?.error) throw failed.error;

      return {
        total: totalRes.count,
        portal: portalRes.count,
        line: lineRes.count,
        fb: fbRes.count,
        events: eventsRes.data
      };
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('การอ่านสถิติใช้เวลานานเกินกำหนด')), 8000);
    });

    const stats = await Promise.race([fetchDashboardStats(), timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);

    totalViews = stats.total ?? 0;
    portalEntries = stats.portal ?? 0;
    lineClicks = stats.line ?? 0;
    fbClicks = stats.fb ?? 0;
    recentEvents = stats.events || [];
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    loadError = err instanceof Error ? err.message : 'อ่าน Analytics จาก Supabase ไม่สำเร็จ';
    console.error('Analytics events query failed:', loadError);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amberGold-200">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">ภาพรวม Analytics ที่บันทึกไว้ใน Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/museum"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-crimson-900/60 hover:bg-crimson-800 text-mushroomWhite text-xs font-mono border border-crimson-700/50 transition"
          >
            <Layers className="w-3.5 h-3.5 text-amberGold-400" />
            <span>จัดการห้องนิทรรศการ</span>
          </Link>
        </div>
      </div>

      {loadError && <div role="alert" className="p-4 rounded-xl border border-crimson-700 bg-crimson-950/60 text-crimson-200 text-sm">อ่านข้อมูล Dashboard จาก Supabase ไม่สำเร็จ: {loadError}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase">การเข้าชมทั้งหมด</span>
            <Eye className="w-4 h-4 text-amberGold-400" />
          </div>
          <span className="text-3xl font-serif font-bold text-mushroomWhite">{totalViews ?? '—'}</span>
          <span className="text-[11px] text-neutral-400 block mt-1">{loadError ? 'ไม่สามารถอ่านข้อมูลได้' : 'ข้อมูลจาก Supabase'}</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase">ผ่านประตูมิติ 3D</span>
            <Sparkles className="w-4 h-4 text-crimson-400" />
          </div>
          <span className="text-3xl font-serif font-bold text-mushroomWhite">{portalEntries ?? '—'}</span>
          <span className="text-[11px] text-amberGold-400 block mt-1">Portal Interactive Sessions</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase">คลิกสอบถาม LINE OA</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-serif font-bold text-mushroomWhite">{lineClicks ?? '—'}</span>
          <span className="text-[11px] text-emerald-400/80 block mt-1">Direct Conversions</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase">คลิก Facebook</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-3xl font-serif font-bold text-mushroomWhite">{fbClicks ?? '—'}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Social Engagements</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-neutral-800 bg-obsidian-900/60 shadow-xl">
        <h2 className="text-lg font-serif font-bold text-amberGold-300 mb-4">ประวัติกิจกรรมล่าสุด (Recent Activity)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-mono">
                <th className="pb-3">ประเภทกิจกรรม (Event)</th>
                <th className="pb-3">Resource / Path</th>
                <th className="pb-3">Session ID</th>
                <th className="pb-3">เวลาที่เกิดกิจกรรม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono">
              {recentEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-neutral-900/40">
                  <td className="py-2.5 font-bold text-amberGold-400">{ev.event_type}</td>
                  <td className="py-2.5">{ev.resource_id || '-'}</td>
                  <td className="py-2.5 text-neutral-500">{ev.session_id ? ev.session_id.substring(0, 14) : 'sess_anon'}</td>
                  <td className="py-2.5 text-neutral-400">{new Date(ev.created_at).toLocaleTimeString('th-TH')}</td>
                </tr>
              ))}
              {!loadError && recentEvents.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-neutral-500">ยังไม่มีเหตุการณ์ที่บันทึกในฐานข้อมูล</td></tr>
              )}
              {loadError && recentEvents.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-neutral-500">แสดงรายการไม่ได้จนกว่าจะเชื่อมต่อฐานข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
