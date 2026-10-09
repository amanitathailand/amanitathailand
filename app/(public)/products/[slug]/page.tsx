export const dynamic = 'force-dynamic';

import React from 'react';
import { notFound } from 'next/navigation';
import { createClientServer } from '@/lib/supabase/server';
import { Product, SiteContentSettings } from '@/types';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';
import { ProductDetailView } from '@/components/shop/ProductDetailView';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let product: Product | undefined;
  let siteContent: SiteContentSettings = INITIAL_SITE_CONTENT;

  try {
    const supabase = await createClientServer();
    const [productRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*').eq('slug', slug).eq('status', 'published').maybeSingle(),
      supabase.from('admin_settings').select('key, value').in('key', ['site_content', 'contact_settings']),
    ]);
    if (productRes.error) throw productRes.error;
    product = productRes.data as Product | undefined;
    if (settingsRes.error) throw settingsRes.error;
    const settingsRows = settingsRes.data || [];
    const siteRow = settingsRows.find((row: any) => row.key === 'site_content');
    if (siteRow?.value) siteContent = { ...INITIAL_SITE_CONTENT, ...parseAdminSettingsValue(siteRow.value) } as SiteContentSettings;
    const contactRow = settingsRows.find((row: any) => row.key === 'contact_settings');
    if (contactRow?.value) {
      const contactSettings = parseAdminSettingsValue(contactRow.value);
      for (const key of ['promptpay_number', 'promptpay_name', 'promptpay_bank', 'line_oa_url', 'facebook_url', 'phone_number']) {
        const value = contactSettings[key];
        if (typeof value === 'string' && value) (siteContent as any)[key] = value;
      }
    }
  } catch (err) {
    console.warn('Product detail query fallback notice:', err);
  }

  if (!product) notFound();

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-5xl mx-auto">
      <ProductDetailView product={product} siteContent={siteContent} />
    </div>
  );
}
