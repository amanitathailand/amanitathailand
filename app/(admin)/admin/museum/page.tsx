'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MuseumHall, MuseumExhibit, ContentBlock } from '@/types';
import { BlockEditor } from '@/components/cms/BlockEditor';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  Sparkles, 
  BookOpen, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminMuseumPage() {
  const [activeTab, setActiveTab] = useState<'halls' | 'exhibits'>('halls');
  const [halls, setHalls] = useState<MuseumHall[]>([]);
  const [exhibits, setExhibits] = useState<MuseumExhibit[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hallToDelete, setHallToDelete] = useState<MuseumHall | null>(null);
  const [exhibitToDelete, setExhibitToDelete] = useState<MuseumExhibit | null>(null);

  // Hall Modal State
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<MuseumHall | null>(null);
  const [hallForm, setHallForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    cover_image_url: '',
    status: 'published' as 'published' | 'draft',
    sort_order: 1,
  });

  // Exhibit Modal State
  const [isExhibitModalOpen, setIsExhibitModalOpen] = useState(false);
  const [editingExhibit, setEditingExhibit] = useState<MuseumExhibit | null>(null);
  const [exhibitForm, setExhibitForm] = useState({
    title: '',
    slug: '',
    summary: '',
    hall_id: selectedHallId,
    content_blocks: [] as ContentBlock[],
    sort_order: 1,
    status: 'published' as 'published' | 'draft',
  });

  const supabase = createClient();

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Halls
      const { data: hallsData, error: hallsError } = await supabase
        .from('museum_halls')
        .select('*')
        .order('sort_order', { ascending: true });

      if (hallsError) throw hallsError;
      const actualHalls = hallsData || [];
      setHalls(actualHalls);
      if (!actualHalls.some(h => h.id === selectedHallId)) setSelectedHallId(actualHalls[0]?.id || '');

      // 2. Fetch Exhibits
      const { data: exhibitsData, error: exhibitsError } = await supabase
        .from('museum_exhibits')
        .select('*')
        .order('sort_order', { ascending: true });
      if (exhibitsError) throw exhibitsError;
      setExhibits(exhibitsData || []);
    } catch (err: any) {
      console.error('Fetch museum data failed:', err);
      setHalls([]);
      setExhibits([]);
      showNotification('error', `โหลดข้อมูลห้องจัดแสดงจาก Supabase ไม่สำเร็จ: ${err.message || 'ตรวจสอบสิทธิ์และการเชื่อมต่อ'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setExhibitForm(prev => ({ ...prev, hall_id: selectedHallId }));
  }, [selectedHallId]);

  // Hall Handlers
  const openAddHallModal = () => {
    setEditingHall(null);
    setHallForm({
      title: '',
      slug: '',
      subtitle: '',
      description: '',
      cover_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      status: 'published',
      sort_order: halls.length + 1,
    });
    setIsHallModalOpen(true);
  };

  const openEditHallModal = (hall: MuseumHall) => {
    setEditingHall(hall);
    setHallForm({
      title: hall.title,
      slug: hall.slug,
      subtitle: hall.subtitle || '',
      description: hall.description || '',
      cover_image_url: hall.cover_image_url || '',
      status: hall.status as 'published' | 'draft',
      sort_order: hall.sort_order || 1,
    });
    setIsHallModalOpen(true);
  };

  const handleSaveHall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const isUuid = editingHall?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingHall.id);

    try {
      let error;
      let savedRow;
      if (editingHall && isUuid) {
        // Update by UUID
        const res = await supabase
          .from('museum_halls')
          .update(hallForm)
          .eq('id', editingHall.id)
          .select('*')
          .maybeSingle();
        error = res.error;
        savedRow = res.data;
      } else {
        const res = await supabase
          .from('museum_halls')
          .upsert(hallForm, { onConflict: 'slug' })
          .select('*')
          .single();
        error = res.error;
        savedRow = res.data;
      }

      if (error || !savedRow) {
        showNotification('error', `Supabase ไม่ยืนยันการบันทึกห้องจัดแสดง: ${error?.message || 'ไม่พบแถวที่บันทึก'}`);
      } else {
        showNotification('success', `บันทึกข้อมูลห้อง "${hallForm.title}" ลงฐานข้อมูล Supabase สำเร็จเรียบร้อย!`);
        setIsHallModalOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      showNotification('error', `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถติดต่อฐานข้อมูลได้'}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteHall = async () => {
    if (!hallToDelete) return;
    const target = hallToDelete;
    setHallToDelete(null);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);

    try {
      const res = isUuid
        ? await supabase.from('museum_halls').delete().eq('id', target.id).select('id')
        : await supabase.from('museum_halls').delete().eq('slug', target.slug).select('id');

      if (res.error || !res.data?.length) {
        showNotification('error', `ลบไม่สำเร็จ: ${res.error?.message || 'Supabase ไม่พบแถวที่ต้องการลบ'}`);
      } else {
        showNotification('success', `ลบห้อง "${target.title}" ออกจากฐานข้อมูล Supabase เรียบร้อยแล้ว`);
        await fetchData();
      }
    } catch (err: any) {
      showNotification('error', `เกิดข้อผิดพลาดในการลบ: ${err.message}`);
    }
  };

  // Exhibit Handlers
  const currentHall = halls.find(h => h.id === selectedHallId) || halls[0];
  const hallExhibits = exhibits.filter(e => e.hall_id === (currentHall?.id || selectedHallId));

  const openAddExhibitModal = () => {
    setEditingExhibit(null);
    setExhibitForm({
      title: '',
      slug: '',
      summary: '',
      hall_id: currentHall?.id || selectedHallId,
      sort_order: hallExhibits.length + 1,
      status: 'published',
      content_blocks: [
        { id: 'b_' + Date.now(), type: 'heading', data: { level: 2, text: 'หัวข้อเนื้อหาย่อย' } },
        { id: 't_' + Date.now(), type: 'text', data: { content: 'พิมพ์เนื้อหารายละเอียดของวัตถุจัดแสดง หรือเรื่องราวคติชนวิทยาที่นี่...' } }
      ]
    });
    setIsExhibitModalOpen(true);
  };

  const openEditExhibitModal = (ex: MuseumExhibit) => {
    setEditingExhibit(ex);
    setExhibitForm({
      title: ex.title,
      slug: ex.slug,
      summary: ex.summary || '',
      hall_id: ex.hall_id,
      sort_order: ex.sort_order || 1,
      status: ex.status as 'published' | 'draft',
      content_blocks: ex.content_blocks || []
    });
    setIsExhibitModalOpen(true);
  };

  const handleSaveExhibit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const isUuid = editingExhibit?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingExhibit.id);

    // Ensure valid hall_id UUID or lookup from currentHall
    let targetHallId = exhibitForm.hall_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetHallId)) {
      // Find UUID of currentHall in halls
      const matched = halls.find(h => h.slug === currentHall?.slug);
      if (matched && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matched.id)) {
        targetHallId = matched.id;
      }
    }

    const payload = {
      title: exhibitForm.title,
      slug: exhibitForm.slug,
      summary: exhibitForm.summary,
      hall_id: targetHallId,
      sort_order: exhibitForm.sort_order,
      status: exhibitForm.status,
      content_blocks: exhibitForm.content_blocks,
    };

    try {
      let error;
      let savedRow;
      if (editingExhibit && isUuid) {
        const res = await supabase
          .from('museum_exhibits')
          .update(payload)
          .eq('id', editingExhibit.id)
          .select('*')
          .maybeSingle();
        error = res.error;
        savedRow = res.data;
      } else {
        const res = await supabase
          .from('museum_exhibits')
          .upsert(payload, { onConflict: 'slug' })
          .select('*')
          .single();
        error = res.error;
        savedRow = res.data;
      }

      if (error || !savedRow) {
        showNotification('error', `Supabase ไม่ยืนยันการบันทึกเนื้อหาย่อย: ${error?.message || 'ไม่พบแถวที่บันทึก'}`);
      } else {
        showNotification('success', `บันทึกเนื้อหาย่อย "${exhibitForm.title}" ลง Supabase สำเร็จเรียบร้อย!`);
        setIsExhibitModalOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      showNotification('error', `เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteExhibit = async () => {
    if (!exhibitToDelete) return;
    const target = exhibitToDelete;
    setExhibitToDelete(null);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);

    try {
      const res = isUuid
        ? await supabase.from('museum_exhibits').delete().eq('id', target.id).select('id')
        : await supabase.from('museum_exhibits').delete().eq('slug', target.slug).select('id');

      if (res.error || !res.data?.length) {
        showNotification('error', `ลบไม่สำเร็จ: ${res.error?.message || 'Supabase ไม่พบแถวที่ต้องการลบ'}`);
      } else {
        showNotification('success', `ลบเนื้อหาวัตถุ "${target.title}" ออกจาก Supabase เรียบร้อยแล้ว`);
        await fetchData();
      }
    } catch (err: any) {
      showNotification('error', `เกิดข้อผิดพลาดในการลบ: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Toast Notification Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 shadow-2xl animate-fadeIn ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
            : 'bg-crimson-950 border-crimson-600 text-crimson-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amberGold-200">
            ระบบจัดการนิทรรศการและเนื้อหาห้องจัดแสดง (Museum CMS)
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            บันทึก แก้ไข ลบ ข้อมูลห้องจัดแสดงและเนื้อหาย่อยลงฐานข้อมูล Supabase จริง พร้อมแจ้งเตือนสถานะทันที
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-neutral-800 bg-obsidian-900 text-neutral-300 hover:text-white"
            title="รีเฟรชข้อมูลจาก Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {activeTab === 'halls' ? (
            <button
              onClick={openAddHallModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite text-xs font-serif font-bold transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              เพิ่มห้องจัดแสดงใหม่
            </button>
          ) : (
            <button
              onClick={openAddExhibitModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amberGold-600 hover:bg-amberGold-500 text-obsidian-950 text-xs font-serif font-bold transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              เพิ่มเนื้อหาย่อย/วัตถุจัดแสดง
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-4 text-xs font-serif">
        <button
          onClick={() => setActiveTab('halls')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 font-bold transition ${
            activeTab === 'halls'
              ? 'border-amberGold-400 text-amberGold-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. จัดการห้องจัดแสดงหลัก (Museum Halls: {halls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exhibits')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 font-bold transition ${
            activeTab === 'exhibits'
              ? 'border-amberGold-400 text-amberGold-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>2. จัดการเนื้อหาย่อยและบล็อกเนื้อหา (Exhibits & Content Blocks)</span>
        </button>
      </div>

      {/* TAB 1: HALLS MANAGEMENT */}
      {activeTab === 'halls' && (
        <div className="grid grid-cols-1 gap-4">
          {halls.map((hall) => {
            const countEx = exhibits.filter(e => e.hall_id === hall.id).length;
            return (
              <div 
                key={hall.id} 
                className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl hover:border-neutral-700 transition"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <img
                    src={hall.cover_image_url || ''}
                    alt={hall.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-neutral-800"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-serif font-bold text-mushroomWhite">{hall.title}</h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${hall.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'}`}>
                        {hall.status}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-crimson-950 text-amberGold-300 font-mono border border-crimson-900/60">
                        {countEx} เนื้อหาย่อย
                      </span>
                    </div>
                    <span className="text-xs text-amberGold-400 font-mono">/museum/{hall.slug}</span>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">{hall.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      setSelectedHallId(hall.id);
                      setActiveTab('exhibits');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-crimson-950 hover:bg-crimson-900 text-amberGold-300 border border-crimson-800/60 text-xs font-mono transition"
                    title="เข้าไปแก้ไขเนื้อหาย่อยในห้องนี้"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>จัดการเนื้อหาในห้อง ({countEx})</span>
                  </button>

                  <button
                    onClick={() => openEditHallModal(hall)}
                    className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setHallToDelete(hall)}
                    className="p-2.5 rounded-lg bg-crimson-950 hover:bg-crimson-900 text-crimson-300 transition"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EXHIBITS MANAGEMENT */}
      {activeTab === 'exhibits' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400 uppercase font-bold">เลือกห้องจัดแสดง:</span>
              <div className="flex flex-wrap gap-2">
                {halls.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHallId(h.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-serif transition ${
                      selectedHallId === h.id
                        ? 'bg-amberGold-500 text-obsidian-950 font-bold shadow-md'
                        : 'bg-obsidian-950 text-neutral-300 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {h.title}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={openAddExhibitModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amberGold-600 hover:bg-amberGold-500 text-obsidian-950 text-xs font-serif font-bold transition shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มเนื้อหาย่อยใหม่</span>
            </button>
          </div>

          <div className="space-y-4">
            {hallExhibits.map((ex) => (
              <div 
                key={ex.id} 
                className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80 space-y-4 shadow-xl hover:border-amberGold-500/40 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-amberGold-950 border border-amberGold-600/50 text-amberGold-300 flex items-center justify-center text-xs font-bold font-mono">
                        {ex.sort_order}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-mushroomWhite">{ex.title}</h3>
                    </div>
                    {ex.summary && (
                      <p className="text-xs text-neutral-400 mt-1 italic pl-8">{ex.summary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditExhibitModal(ex)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-mushroomWhite text-xs font-mono transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amberGold-400" />
                      <span>แก้ไขเนื้อหาบล็อก</span>
                    </button>
                    <button
                      onClick={() => setExhibitToDelete(ex)}
                      className="p-2 rounded-lg bg-crimson-950 hover:bg-crimson-900 text-crimson-300 transition"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pl-2">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                    โครงสร้างบล็อกเนื้อหา ({ex.content_blocks?.length || 0} บล็อก):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.content_blocks?.map((b, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-obsidian-950 border border-neutral-800 text-neutral-300 font-mono">
                        {b.type === 'heading' ? `📌 ${b.data?.text || 'Heading'}` :
                         b.type === 'text' ? `📝 ข้อความ` :
                         b.type === 'image' ? '🖼️ รูปภาพ' :
                         b.type === 'quote' ? '💬 คำคม' :
                         b.type === 'callout' ? `⚠️ Callout` : b.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {hallExhibits.length === 0 && (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-obsidian-900/30">
                <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-serif text-neutral-300">ยังไม่มีเนื้อหาย่อยในห้องนี้</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hall Modal */}
      {isHallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-obsidian-900 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-lg font-serif font-bold text-amberGold-300">
                {editingHall ? 'แก้ไขห้องจัดแสดง' : 'เพิ่มห้องจัดแสดงใหม่'}
              </h3>
              <button onClick={() => setIsHallModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHall} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-neutral-300 mb-1 font-mono">ชื่อห้องจัดแสดง (Title) *</label>
                <input
                  type="text"
                  required
                  value={hallForm.title}
                  onChange={(e) => setHallForm({ ...hallForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500 font-serif font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1 font-mono">Slug (URL Path) *</label>
                  <input
                    type="text"
                    required
                    value={hallForm.slug}
                    onChange={(e) => setHallForm({ ...hallForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite font-mono focus:border-amberGold-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1 font-mono">ลำดับการแสดง (Sort Order)</label>
                  <input
                    type="number"
                    value={hallForm.sort_order}
                    onChange={(e) => setHallForm({ ...hallForm, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">คำบรรยายย่อย (Subtitle)</label>
                <input
                  type="text"
                  value={hallForm.subtitle}
                  onChange={(e) => setHallForm({ ...hallForm, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">รายละเอียดห้อง (Description)</label>
                <textarea
                  rows={3}
                  value={hallForm.description}
                  onChange={(e) => setHallForm({ ...hallForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">รูปภาพหน้าปก (Cover Image URL)</label>
                <input
                  type="url"
                  value={hallForm.cover_image_url}
                  onChange={(e) => setHallForm({ ...hallForm, cover_image_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite font-mono focus:border-amberGold-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">สถานะ (Status)</label>
                <select
                  value={hallForm.status}
                  onChange={(e) => setHallForm({ ...hallForm, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500"
                >
                  <option value="published">เผยแพร่ทันที (Published)</option>
                  <option value="draft">ฉบับร่าง (Draft)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsHallModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite font-bold font-serif shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'กำลังบันทึกลง Supabase...' : 'บันทึกลง Supabase จริง'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exhibit Modal */}
      {isExhibitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-2xl border border-neutral-800 bg-obsidian-900 p-6 shadow-2xl max-h-[92dvh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-amberGold-400 uppercase tracking-widest block">
                  Hall: {currentHall?.title}
                </span>
                <h3 className="text-xl font-serif font-bold text-mushroomWhite">
                  {editingExhibit ? 'แก้ไขเนื้อหาย่อย / วัตถุจัดแสดง' : 'สร้างเนื้อหาย่อยใหม่ในห้องนี้'}
                </h3>
              </div>
              <button onClick={() => setIsExhibitModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExhibit} className="space-y-6 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-mono font-bold">ชื่อหัวข้อย่อย / วัตถุจัดแสดง *</label>
                  <input
                    type="text"
                    required
                    value={exhibitForm.title}
                    onChange={(e) => setExhibitForm({ ...exhibitForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite font-serif font-bold text-sm focus:border-amberGold-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-mono">Slug (URL Identifier) *</label>
                  <input
                    type="text"
                    required
                    value={exhibitForm.slug}
                    onChange={(e) => setExhibitForm({ ...exhibitForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite font-mono focus:border-amberGold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">คำนำสรุปย่อ (Summary/Excerpt)</label>
                <textarea
                  rows={2}
                  value={exhibitForm.summary}
                  onChange={(e) => setExhibitForm({ ...exhibitForm, summary: e.target.value })}
                  placeholder="เขียนสรุปย่อของเรื่องราวหรือวัตถุจัดแสดงนี้..."
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-neutral-300 focus:border-amberGold-500 resize-none"
                />
              </div>

              {/* Block Editor */}
              <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
                <BlockEditor
                  blocks={exhibitForm.content_blocks}
                  onChange={(newBlocks) => setExhibitForm({ ...exhibitForm, content_blocks: newBlocks })}
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800">
                <div className="flex items-center gap-3">
                  <label className="font-mono text-neutral-400">สถานะการเผยแพร่:</label>
                  <select
                    value={exhibitForm.status}
                    onChange={(e) => setExhibitForm({ ...exhibitForm, status: e.target.value as any })}
                    className="p-2 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite"
                  >
                    <option value="published">เผยแพร่ทันที (Published)</option>
                    <option value="draft">บันทึกเป็นฉบับร่าง (Draft)</option>
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsExhibitModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amberGold-600 hover:bg-amberGold-500 text-obsidian-950 font-bold font-serif shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'กำลังบันทึกลง Supabase...' : 'บันทึกเนื้อหาลง Supabase จริง'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Hall Delete Confirmation Modal */}
      {hallToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-crimson-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-crimson-400">
              <div className="p-2.5 rounded-2xl bg-crimson-950/80 border border-crimson-800">
                <Trash2 className="w-6 h-6 text-crimson-400" />
              </div>
              <div>
                <h4 className="text-base font-serif font-bold text-mushroomWhite">ยืนยันการลบห้องจัดแสดง</h4>
                <span className="text-xs text-neutral-400 line-clamp-1">/{hallToDelete.slug}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              คุณต้องการลบห้อง &ldquo;{hallToDelete.title}&rdquo; ออกจากระบบใช่หรือไม่? วัตถุจัดแสดงย่อยทั้งหมดที่อยู่ในห้องนี้จะได้รับผลกระทบ
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setHallToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteHall}
                className="px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold shadow-lg shadow-crimson-900/40"
              >
                ยืนยันการลบห้องนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Exhibit Delete Confirmation Modal */}
      {exhibitToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-crimson-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-crimson-400">
              <div className="p-2.5 rounded-2xl bg-crimson-950/80 border border-crimson-800">
                <Trash2 className="w-6 h-6 text-crimson-400" />
              </div>
              <div>
                <h4 className="text-base font-serif font-bold text-mushroomWhite">ยืนยันการลบวัตถุจัดแสดง</h4>
                <span className="text-xs text-neutral-400 line-clamp-1">/{exhibitToDelete.slug}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              คุณต้องการลบเนื้อหาวัตถุจัดแสดง &ldquo;{exhibitToDelete.title}&rdquo; ออกจากห้องนิทรรศการนี้ใช่หรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExhibitToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteExhibit}
                className="px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold shadow-lg shadow-crimson-900/40"
              >
                ยืนยันการลบวัตถุนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
