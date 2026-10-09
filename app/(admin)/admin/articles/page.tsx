'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Article, ContentBlock } from '@/types';
import { BlockEditor } from '@/components/cms/BlockEditor';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Clock, 
  X, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const isUUID = (str?: string | null) => 
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    reading_time_minutes: 5,
    tags: 'วิทยาศาสตร์, ประวัติศาสตร์',
    featured_image_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
    status: 'published' as 'published' | 'draft',
    content_blocks: [] as ContentBlock[],
  });

  const supabase = createClient();

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (err: any) {
      console.error('Fetch articles failed:', err);
      setArticles([]);
      showToast('error', `โหลดบทความจาก Supabase ไม่สำเร็จ: ${err.message || 'ตรวจสอบการเชื่อมต่อและสิทธิ์'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const openAddModal = () => {
    setEditingArticle(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      reading_time_minutes: 5,
      tags: 'วิทยาศาสตร์, ชีวเคมี, มานุษยวิทยา',
      featured_image_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
      status: 'published',
      content_blocks: [
        { id: 'b1', type: 'heading', data: { level: 2, text: 'บทนำและภาพรวม' } },
        { id: 'b2', type: 'text', data: { content: 'พิมพ์เนื้อหาบทความวิชาการของคุณที่นี่...' } }
      ]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (art: Article) => {
    setEditingArticle(art);
    setForm({
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt || '',
      reading_time_minutes: art.reading_time_minutes || 5,
      tags: (art.tags || []).join(', '),
      featured_image_url: art.featured_image_url || '',
      status: art.status as 'published' | 'draft',
      content_blocks: art.content_blocks || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload: any = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      reading_time_minutes: Number(form.reading_time_minutes) || 5,
      tags: tagArray,
      featured_image_url: form.featured_image_url.trim(),
      status: form.status,
      content_blocks: form.content_blocks
    };

    if (editingArticle && isUUID(editingArticle.id)) {
      payload.id = editingArticle.id;
    }

    try {
      const result = editingArticle && isUUID(editingArticle.id)
        ? await supabase.from('articles').update(payload).eq('id', editingArticle.id).select().maybeSingle()
        : await supabase.from('articles').upsert(payload, { onConflict: 'slug' }).select().single();
      const { data, error } = result;

      if (error || !data) {
        showToast('error', `บันทึกไม่สำเร็จ: ${error?.message || 'Supabase ไม่พบแถวที่บันทึก'}`);
        setSaving(false);
        return;
      }

      const savedArticle = data as Article;

      setArticles(prev => {
        const exists = prev.some(a => a.slug === payload.slug || a.id === savedArticle.id);
        if (exists) {
          return prev.map(a => (a.slug === payload.slug || a.id === savedArticle.id) ? savedArticle : a);
        }
        return [savedArticle, ...prev];
      });

      setIsModalOpen(false);
      showToast('success', `บันทึกบทความ "${payload.title}" ลงฐานข้อมูลจริงเรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    const target = articleToDelete;
    setArticleToDelete(null);

    try {
      let query = supabase.from('articles').delete().select('id');
      if (isUUID(target.id)) {
        query = query.eq('id', target.id);
      } else {
        query = query.eq('slug', target.slug);
      }

      const { data, error } = await query;
      if (error) {
        showToast('error', `ลบไม่สำเร็จ: ${error.message}`);
        return;
      }
      if (!data?.length) {
        showToast('error', 'Supabase ไม่พบแถวบทความที่ต้องการลบ จึงไม่ได้ลบข้อมูล');
        await fetchArticles();
        return;
      }

      setArticles(prev => prev.filter(a => a.id !== target.id && a.slug !== target.slug));
      showToast('success', `ลบบทความ "${target.title}" ออกจากฐานข้อมูล Supabase เรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amberGold-200">
            จัดการบทความวิชาการและบล็อก (Articles CMS)
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            เขียน เผยแพร่ และแก้ไขเนื้อหาบทความ บันทึกลง Supabase พร้อมระบบบล็อกเนื้อหาอิสระ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchArticles}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 bg-obsidian-900 text-neutral-300 hover:text-white text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-crimson-800 to-crimson-600 hover:from-crimson-700 hover:to-crimson-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-crimson-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างบทความใหม่</span>
          </button>
        </div>
      </div>

      {/* Article List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((art) => (
          <div 
            key={art.id} 
            className="rounded-2xl border border-crimson-950/60 bg-obsidian-900/60 overflow-hidden flex flex-col justify-between hover:border-amberGold-500/40 transition duration-300"
          >
            <div>
              <div className="relative h-44 w-full bg-obsidian-950 overflow-hidden">
                <img 
                  src={art.featured_image_url || 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800'} 
                  alt={art.title}
                  className="w-full h-full object-cover transition duration-500 hover:scale-105"
                />
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                  art.status === 'published' 
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' 
                    : 'bg-neutral-900/80 text-neutral-400 border border-neutral-700'
                }`}>
                  {art.status}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                  <Clock className="w-3 h-3 text-amberGold-400" />
                  <span>อ่าน {art.reading_time_minutes || 5} นาที</span>
                  <span>•</span>
                  <span>{art.content_blocks?.length || 0} บล็อก</span>
                </div>
                <h3 className="font-serif font-bold text-base text-mushroomWhite line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {art.excerpt || 'ไม่มีคำอธิบายย่อ'}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(art.tags || []).slice(0, 3).map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-obsidian-950 border border-neutral-800 text-neutral-300">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-neutral-800/60 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">
                /{art.slug}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(art)}
                  className="p-1.5 rounded-lg border border-neutral-700 bg-obsidian-950 text-neutral-300 hover:text-amberGold-300 hover:border-amberGold-500 transition"
                  title="แก้ไขบทความ"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setArticleToDelete(art)}
                  className="p-1.5 rounded-lg border border-neutral-800 bg-obsidian-950 text-crimson-400 hover:text-crimson-300 hover:border-crimson-800 transition"
                  title="ลบบทความ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-obsidian-900 border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amberGold-400 font-bold block">
                  {editingArticle ? 'แก้ไขบทความ' : 'สร้างบทความใหม่'}
                </span>
                <h3 className="text-xl font-serif font-bold text-mushroomWhite">
                  {form.title || 'ไม่มีชื่อหัวข้อ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    ชื่อบทความ (Title) <span className="text-crimson-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite focus:border-amberGold-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    Slug URL (ต้องไม่ซ้ำกัน) <span className="text-crimson-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-mono focus:border-amberGold-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    รูปภาพหน้าปก URL
                  </label>
                  <input
                    type="text"
                    value={form.featured_image_url}
                    onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-mono focus:border-amberGold-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-neutral-300 font-medium block mb-1">
                      เวลาอ่าน (นาที)
                    </label>
                    <input
                      type="number"
                      value={form.reading_time_minutes}
                      onChange={(e) => setForm({ ...form, reading_time_minutes: parseInt(e.target.value) || 5 })}
                      className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-300 font-medium block mb-1">
                      สถานะเผยแพร่
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    แท็ก (คั่นด้วยเครื่องหมายจุลภาค ,)
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite focus:border-amberGold-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    คำบรรยายย่อ (Excerpt)
                  </label>
                  <textarea
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-xs text-mushroomWhite focus:border-amberGold-500"
                  />
                </div>
              </div>

              {/* Interactive Content Blocks */}
              <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60">
                <BlockEditor
                  blocks={form.content_blocks}
                  onChange={(newBlocks) => setForm({ ...form, content_blocks: newBlocks })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amberGold-500 hover:bg-amberGold-400 text-obsidian-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึกลงฐานข้อมูล Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Article Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-crimson-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-crimson-400">
              <div className="p-2.5 rounded-2xl bg-crimson-950/80 border border-crimson-800">
                <Trash2 className="w-6 h-6 text-crimson-400" />
              </div>
              <div>
                <h4 className="text-base font-serif font-bold text-mushroomWhite">ยืนยันการลบบทความวิชาการ</h4>
                <span className="text-xs text-neutral-400 line-clamp-1">/{articleToDelete.slug}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              คุณต้องการลบบทความ &ldquo;{articleToDelete.title}&rdquo; ออกจากคลังบทความใช่หรือไม่? บล็อกเนื้อหาทั้งหมดในบทความนี้จะถูกลบอย่างถาวร
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteArticle}
                className="px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold shadow-lg shadow-crimson-900/40"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
