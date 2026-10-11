import { createClientServer } from '@/lib/supabase/server';
import type { PixelConfig } from '@/types';

export async function getActivePixels(): Promise<PixelConfig[]> {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from('pixel_configs')
    .select('id, provider, pixel_id, is_active')
    .eq('is_active', true);
  if (error) throw error;
  return (data || []) as PixelConfig[];
}
