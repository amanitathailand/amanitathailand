'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  X, 
  ShoppingBag, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    botanical_name: 'Amanita Muscaria',
    origin_region: 'Highlands of Chiang Mai',
    description: '',
    price: 390,
    hero_image_url: '',
    line_oa_url: 'https://line.me/R/ti/p/@amanitathailand',
    facebook_url: 'https://facebook.com/amanitathailand',
    shopee_url: 'https://shopee.co.th/amanitathailand',
    status: 'published' as 'published' | 'draft',
    variants: [
      { size: '3g', price: 390, in_stock: true, note: 'ตัวอย่างขนาดเล็ก' },
      { size: '5g', price: 590, in_stock: true, note: 'ขนาดยอดนิยม' },
      { size: '10g', price: 990, in_stock: true, note: 'ชุดสะสมเปรียบเทียบ' },
      { size: '15g', price: 1450, in_stock: true, note: 'เกรดสูงสุด' }
    ] as ProductVariant[]
  });


  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'อ่านรายการสินค้าจาก Supabase ไม่สำเร็จ');
      }
      setProducts(json.products || []);
    } catch (error) {
      setProducts([]);
      showNotification('error', error instanceof Error ? error.message : 'อ่านรายการสินค้าจากฐานข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      slug: '',
      botanical_name: 'Amanita Muscaria',
      origin_region: 'Highlands of Chiang Mai',
      description: '',
      price: 390,
      hero_image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop',
      line_oa_url: 'https://line.me/R/ti/p/@amanitathailand',
      facebook_url: 'https://facebook.com/amanitathailand',
      shopee_url: 'https://shopee.co.th/amanitathailand',
      status: 'published',
      variants: [
        { size: '3g', price: 390, in_stock: true, note: 'ตัวอย่างขนาดเล็ก' },
        { size: '5g', price: 590, in_stock: true, note: 'ขนาดยอดนิยม' },
        { size: '10g', price: 990, in_stock: true, note: 'ชุดสะสมเปรียบเทียบ' },
        { size: '15g', price: 1450, in_stock: true, note: 'เกรดสูงสุด' }
      ]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name,
      slug: prod.slug,
      botanical_name: prod.botanical_name,
      origin_region: prod.origin_region,
      description: prod.description,
      price: prod.price || 390,
      hero_image_url: prod.hero_image_url,
      line_oa_url: prod.line_oa_url || '',
      facebook_url: prod.facebook_url || '',
      shopee_url: prod.shopee_url || '',
      status: prod.status as 'published' | 'draft',
      variants: prod.variants && prod.variants.length > 0 ? prod.variants : [
        { size: '5g', price: prod.price || 590, in_stock: true, note: 'ตัวอย่างมาตรฐาน' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleUpdateVariantPrice = (idx: number, newPrice: number) => {
    const updated = [...form.variants];
    updated[idx].price = newPrice;
    setForm({ ...form, variants: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.price || form.price <= 0) {
      showNotification('error', 'กรุณาระบุราคาสินค้าเริ่มต้นที่ถูกต้อง (มากกว่า 0 บาท)');
      return;
    }
    setSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        ...form,
        ...(editingProduct?.id ? { id: editingProduct.id } : {})
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showNotification('error', `บันทึกไม่สำเร็จ: ${json.error || 'Server error'}`);
      } else {
        showNotification('success', `บันทึกข้อมูลและราคาตัวอย่าง "${form.name}" เรียบร้อยแล้ว!`);
        setIsModalOpen(false);
        await fetchProducts();
      }
    } catch (err: any) {
      showNotification('error', `เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const target = productToDelete;
    setProductToDelete(null);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);

    try {
      const isUuid = Boolean(target.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id));
      const url = isUuid ? `/api/products?id=${target.id}` : `/api/products?slug=${encodeURIComponent(target.slug)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        showNotification('error', `ลบไม่สำเร็จ: ${json.error || 'Server error'}`);
      } else {
        showNotification('success', `ลบตัวอย่าง "${target.name}" เรียบร้อยแล้ว`);
        await fetchProducts();
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amberGold-200">
            จัดการตัวอย่างพฤกษศาสตร์และราคา (Products & Pricing CMS)
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            แก้ไขราคาจำหน่ายจริงของแต่ละขนาด เชื่อมต่อ PromptPay QR และลิงก์ Shopee บันทึกลง Supabase จริง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-neutral-800 bg-obsidian-900 text-neutral-300 hover:text-white"
            title="รีเฟรชข้อมูลจาก Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite text-xs font-serif font-bold transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            เพิ่มตัวอย่างพฤกษศาสตร์
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400 font-mono">กำลังโหลดรายการตัวอย่างจาก Supabase...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl border border-neutral-800 bg-obsidian-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl hover:border-neutral-700 transition">
              <div className="flex items-center gap-4">
                <img src={p.hero_image_url} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-neutral-800" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-serif font-bold text-mushroomWhite">{p.name}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${p.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'}`}>
                      {p.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800">
                      เริ่มต้น ฿{(p.variants?.[0]?.price || p.price || 390).toLocaleString()}
                    </span>
                    {p.shopee_url && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EE4D2D]/20 text-[#EE4D2D] border border-[#EE4D2D]/40 font-mono font-bold flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>Shopee</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-amberGold-400 font-mono">{p.botanical_name}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(p.variants || []).map((v, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                        {v.size}: ฿{v.price ? v.price.toLocaleString() : '-'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button onClick={() => openEditModal(p)} className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition" title="แก้ไข">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setProductToDelete(p)} className="p-2.5 rounded-lg bg-crimson-950 hover:bg-crimson-900 text-crimson-300 transition" title="ลบ">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-obsidian-900 p-6 shadow-2xl max-h-[92dvh] overflow-y-auto text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-2">
              <h3 className="text-lg font-serif font-bold text-amberGold-300">
                {editingProduct ? 'แก้ไขตัวอย่างพฤกษศาสตร์และราคา' : 'เพิ่มตัวอย่างพฤกษศาสตร์ใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-mono font-bold">ชื่อตัวอย่าง (Name) *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500 font-serif font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1 font-mono font-bold text-emerald-400">ราคาเริ่มต้น (Base Price บาท) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-emerald-300 font-mono font-bold focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1 font-mono">Slug (URL) *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1 font-mono">ชื่อพฤกษศาสตร์ (Botanical)</label>
                  <input
                    type="text"
                    value={form.botanical_name}
                    onChange={(e) => setForm({ ...form, botanical_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500"
                  />
                </div>
              </div>

              {/* Price of each variant */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-obsidian-950/70 space-y-3">
                <span className="text-xs font-serif font-bold text-amberGold-300 block">
                  กำหนดราคาของแต่ละขนาด (Variant Pricing):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.variants.map((v, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-neutral-800 bg-obsidian-900 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-mushroomWhite block">{v.size}</span>
                        {v.note && <span className="text-[10px] text-neutral-500 block truncate">{v.note}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 w-28">
                        <span className="text-neutral-400 font-mono">฿</span>
                        <input
                          type="number"
                          value={v.price || 0}
                          onChange={(e) => handleUpdateVariantPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 rounded bg-obsidian-950 border border-neutral-700 text-emerald-300 font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">รายละเอียดตัวอย่าง (Description)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono">รูปรวม / รูปหน้าปก (Image URL)</label>
                <input
                  type="url"
                  value={form.hero_image_url}
                  onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-mushroomWhite focus:border-amberGold-500 font-mono"
                />
              </div>

              {/* Channels */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-obsidian-950/70 space-y-3">
                <span className="text-xs font-serif font-bold text-amberGold-300 block">
                  ช่องทางการสั่งซื้อและการติดต่อ:
                </span>

                <div>
                  <label className="block text-neutral-300 mb-1 font-mono font-bold flex items-center gap-1.5 text-[#EE4D2D]">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>ลิงก์สั่งซื้อบน Shopee (Shopee Product / Store URL)</span>
                  </label>
                  <input
                    type="url"
                    value={form.shopee_url}
                    onChange={(e) => setForm({ ...form, shopee_url: e.target.value })}
                    placeholder="https://shopee.co.th/..."
                    className="w-full p-2 rounded-lg bg-obsidian-900 border border-neutral-700 text-mushroomWhite focus:border-[#EE4D2D] font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1 font-mono text-[#06C755] font-semibold">
                      LINE OA Link
                    </label>
                    <input
                      type="url"
                      value={form.line_oa_url}
                      onChange={(e) => setForm({ ...form, line_oa_url: e.target.value })}
                      placeholder="https://line.me/R/ti/p/..."
                      className="w-full p-2 rounded-lg bg-obsidian-900 border border-neutral-700 text-mushroomWhite focus:border-[#06C755] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1 font-mono text-blue-400 font-semibold">
                      Facebook Page Link
                    </label>
                    <input
                      type="url"
                      value={form.facebook_url}
                      onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full p-2 rounded-lg bg-obsidian-900 border border-neutral-700 text-mushroomWhite focus:border-blue-400 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-300">
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

      {/* Custom Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-crimson-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-crimson-400">
              <div className="p-2.5 rounded-2xl bg-crimson-950/80 border border-crimson-800">
                <Trash2 className="w-6 h-6 text-crimson-400" />
              </div>
              <div>
                <h4 className="text-base font-serif font-bold text-mushroomWhite">ยืนยันการลบตัวอย่างพฤกษศาสตร์</h4>
                <span className="text-xs text-neutral-400 line-clamp-1">{productToDelete.name}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              คุณต้องการลบตัวอย่าง &ldquo;{productToDelete.name}&rdquo; (/{productToDelete.slug}) ออกจากระบบใช่หรือไม่? การลบนี้จะนำข้อมูลออกจากหน้าร้านค้าทันที
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
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
