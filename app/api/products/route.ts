import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeVariants(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((variant): variant is Record<string, unknown> => Boolean(variant && typeof variant === 'object'))
    .map((variant) => ({
      size: String(variant.size || '').trim(),
      price: Number(variant.price || 0),
      in_stock: variant.in_stock !== false,
      note: variant.note ? String(variant.note).slice(0, 240) : undefined,
    }))
    .filter((variant) => variant.size && Number.isFinite(variant.price) && variant.price > 0);
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    let query = supabase.from('products').select('*').order('sort_order', { ascending: true });

    if (!user) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'โหลดข้อมูลสินค้าไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ต้องเข้าสู่ระบบผู้ดูแลก่อนแก้ไขสินค้า' }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || '').trim();
    const slug = String(body.slug || '').trim();
    const description = String(body.description || '').trim();
    const heroImageUrl = String(body.hero_image_url || '').trim();

    if (!name || !slug || !description || !heroImageUrl) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อ slug คำอธิบาย และรูปภาพสินค้าให้ครบถ้วน' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      name: name.slice(0, 240),
      slug: slug.slice(0, 160),
      botanical_name: String(body.botanical_name || 'Amanita Muscaria').slice(0, 240),
      origin_region: String(body.origin_region || '').slice(0, 240),
      description: description.slice(0, 5000),
      price: Math.max(0, Number(body.price || 0)),
      hero_image_url: heroImageUrl.slice(0, 2000),
      line_oa_url: String(body.line_oa_url || '').slice(0, 500),
      facebook_url: String(body.facebook_url || '').slice(0, 500),
      shopee_url: body.shopee_url ? String(body.shopee_url).slice(0, 500) : null,
      variants: normalizeVariants(body.variants),
      status: body.status === 'draft' ? 'draft' : 'published',
      // The live products schema has no updated_at column; omit it until an
      // approved schema migration adds the column.
    };

    if (!Number.isFinite(payload.price as number) || (payload.price as number) <= 0) {
      return NextResponse.json({ success: false, error: 'ราคาสินค้าต้องมากกว่า 0 บาท' }, { status: 400 });
    }

    if (isUuid(body.id)) {
      payload.id = body.id;
    }

    const query = isUuid(body.id)
      ? supabase.from('products').update(payload).eq('id', body.id).select().maybeSingle()
      : supabase.from('products').upsert(payload, { onConflict: 'slug' }).select().single();
    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้าในฐานข้อมูลที่ต้องการแก้ไข' }, { status: 404 });
    }

    revalidatePath('/products', 'page');
    revalidatePath('/products/[slug]', 'page');

    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'บันทึกสินค้าไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ต้องเข้าสู่ระบบผู้ดูแลก่อนลบสินค้า' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const slug = url.searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json({ success: false, error: 'ต้องระบุ id หรือ slug ของสินค้า' }, { status: 400 });
    }

    const deleteQuery = supabase.from('products').delete();
    const { data, error } = await (id
      ? deleteQuery.eq('id', id)
      : deleteQuery.eq('slug', slug as string))
      .select('id');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!data?.length) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้าในฐานข้อมูลที่ต้องการลบ' }, { status: 404 });
    }

    revalidatePath('/products', 'page');
    revalidatePath('/products/[slug]', 'page');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'ลบสินค้าไม่สำเร็จ' }, { status: 500 });
  }
}
