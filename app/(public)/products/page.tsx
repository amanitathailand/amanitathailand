export const dynamic = 'force-dynamic';

import React from 'react';
import { createClientServer } from '@/lib/supabase/server';
import { Product, SiteContentSettings } from '@/types';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';
import { ProductsCatalog } from '@/components/shop/ProductsCatalog';
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';

export const metadata = {
  title: 'นิทรรศการตัวอย่างทางพฤกษศาสตร์ & สั่งซื้อพร้อมเพย์ | Amanita Thailand',
  description: 'ตัวอย่างเห็ด Amanita Muscaria เกรดสะสมเพื่อการศึกษาทางพฤกษศาสตร์ สั่งซื้อผ่านระบบ PromptPay QR แนบสลิป หรือผ่าน Shopee',
};

export default async function ProductsIndexPage() {
  let products: Product[] = [];
  let siteContent: SiteContentSettings = INITIAL_SITE_CONTENT;

  try {
    const supabase = await createClientServer();
    const [productsRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*').eq('status', 'published').order('sort_order', { ascending: true }),
      supabase.from('admin_settings').select('key, value').in('key', ['site_content', 'contact_settings']),
    ]);
    if (productsRes.error) throw productsRes.error;
    products = productsRes.data || [];
    if (settingsRes.error) throw settingsRes.error;
    const rows = settingsRes.data || [];
    const siteRow = rows.find((row: any) => row.key === 'site_content');
    if (siteRow?.value) siteContent = { ...INITIAL_SITE_CONTENT, ...parseAdminSettingsValue(siteRow.value) } as SiteContentSettings;
    const contactRow = rows.find((row: any) => row.key === 'contact_settings');
    if (contactRow?.value) {
      const contactSettings = parseAdminSettingsValue(contactRow.value);
      for (const key of ['promptpay_number', 'promptpay_name', 'promptpay_bank', 'line_oa_url', 'facebook_url', 'phone_number']) {
        const value = contactSettings[key];
        if (typeof value === 'string' && value) (siteContent as any)[key] = value;
      }
    }
  } catch (err) {
    console.warn('Products query fallback notice:', err);
    products = [];
  }

  return (
    <div className="min-h-screen pt-32 sm:pt-36 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Dynamic Header from CMS */}
      <div className="text-center mb-12">
        <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400">
          {siteContent.products_subtitle}
        </span>
        <h1 className="text-4xl md:text-5xl font-serif text-amberGold-200 mt-2 font-bold">
          {siteContent.products_title}
        </h1>
        <p className="text-neutral-400 max-w-2xl mx-auto mt-4 text-sm leading-relaxed">
          {siteContent.products_description}
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-obsidian-900 border border-neutral-800">
            <CreditCard className="w-3.5 h-3.5 text-amberGold-400" />
            <span>สแกน PromptPay QR ยอดจริง</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-obsidian-900 border border-neutral-800">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>จัดส่งพัสดุพร้อมแจ้งเลขติดตาม</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-obsidian-900 border border-neutral-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>ผู้ดูแลตรวจสอบสลิปและรับแจ้งเตือน LINE</span>
          </div>
        </div>
      </div>

      {/* Interactive Catalog Component */}
      <ProductsCatalog products={products} siteContent={siteContent} />
    </div>
  );
}
