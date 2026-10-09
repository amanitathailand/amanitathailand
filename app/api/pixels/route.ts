import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    let query = supabase
      .from('pixel_configs')
      .select('id, provider, pixel_id, is_active')
      .order('provider', { ascending: true });

    if (!user) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message, pixels: [] }, { status: 500 });
    }

    return NextResponse.json({ success: true, pixels: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'โหลด tracking pixels ไม่สำเร็จ', pixels: [] }, { status: 500 });
  }
}
