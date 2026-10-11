export const dynamic = 'force-dynamic';

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClientServer } from '@/lib/supabase/server';
import { Product, SiteContentSettings } from '@/types';
import { INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';
import { ProductDetailView } from '@/components/shop/ProductDetailView';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClientServer();
  const { data } = await supabase
    .from('products')
    .select('name, description, hero_image_url, botanical_name')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) return { title: 'ไม่พบสินค้า | Amanita Thailand' };

  const description = String(data.description || `ตัวอย่าง ${data.botanical_name || data.name} สำหรับการศึกษาทางพฤกษศาสตร์`).slice(0, 155);
  const title = `${data.name} | Amanita Thailand Botanical Archive`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://amanitathailand.vercel.app'}/products/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: data.hero_image_url ? [{ url: data.hero_image_url, alt: data.name }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: data.hero_image_url ? [data.hero_image_url] : undefined },
  };
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
    const rawProduct = productRes.data as Product | undefined;
    product = rawProduct
      ? {
          ...rawProduct,
          variants: rawProduct.variants?.map(({ note: _note, ...variant }) => variant),
        }
      : undefined;
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
