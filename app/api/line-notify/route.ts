import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_KEYS = [
  'line_channel_id',
  'line_channel_access_token',
  'line_admin_user_id',
  'line_notifications_enabled',
] as const;
const SECRET_KEYS = new Set<string>(['line_channel_access_token']);
const noStore = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
});

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return noStore({ success: false, error: 'ต้องเข้าสู่ระบบผู้ดูแลก่อนอ่านการตั้งค่า LINE' }, 401);

    const { data, error } = await supabase
      .from('admin_settings')
      .select('key, value, is_active, description, updated_at')
      .in('key', [...SETTINGS_KEYS]);
    if (error) return noStore({ success: false, error: `อ่านการตั้งค่า LINE ไม่สำเร็จ: ${error.message}` }, 503);

    const settings = (data || []).map((row) => ({
      ...row,
      value: SECRET_KEYS.has(row.key) ? '' : row.value,
      is_configured: SECRET_KEYS.has(row.key) && typeof row.value === 'string' && row.value.length > 0,
    }));
    return noStore({
      success: true,
      settings,
      hasAccessToken: settings.some((row) => row.key === 'line_channel_access_token' && row.is_configured),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'อ่านการตั้งค่า LINE ไม่สำเร็จ';
    return noStore({ success: false, error: message }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return noStore({ success: false, error: 'ต้องเข้าสู่ระบบผู้ดูแลก่อนบันทึกการตั้งค่า LINE' }, 401);

    let body: { settingsToSave?: unknown; clearSecrets?: unknown };
    try {
      body = await req.json();
    } catch {
      return noStore({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
    }

    if (!Array.isArray(body.settingsToSave)) {
      return noStore({ success: false, error: 'ไม่มีการตั้งค่า LINE ที่ต้องการบันทึก' }, 400);
    }

    const input = body.settingsToSave as Array<Record<string, unknown>>;
    const rows: Array<{ key: string; value: string; is_active: boolean; description: string | null; updated_at: string }> = [];
    const now = new Date().toISOString();
    for (const item of input) {
      if (!item || typeof item.key !== 'string' || !SETTINGS_KEYS.includes(item.key as typeof SETTINGS_KEYS[number]) || typeof item.value !== 'string') {
        return noStore({ success: false, error: 'มีค่าการตั้งค่าที่ไม่รองรับหรือรูปแบบไม่ถูกต้อง' }, 400);
      }
      const value = item.value.trim();
      // A blank token means "keep the stored token"; token values are only replaced explicitly.
      if (item.key === 'line_channel_access_token' && !value) continue;
      if (value.length > (item.key === 'line_channel_access_token' ? 12000 : 500)) {
        return noStore({ success: false, error: `ค่าของ ${item.key} ยาวเกินกำหนด` }, 400);
      }
      rows.push({
        key: item.key,
        value,
        is_active: Boolean(item.is_active),
        description: typeof item.description === 'string' ? item.description.slice(0, 500) : null,
        updated_at: now,
      });
    }

    const clearSecrets = Array.isArray(body.clearSecrets) ? body.clearSecrets : [];
    for (const key of clearSecrets) {
      if (typeof key !== 'string' || !SECRET_KEYS.has(key)) {
        return noStore({ success: false, error: 'ไม่อนุญาตให้ล้าง secret ชนิดนี้' }, 400);
      }
      rows.push({ key, value: '', is_active: false, description: 'LINE Messaging API access token', updated_at: now });
    }

    if (!rows.length) return noStore({ success: false, error: 'ไม่มีฟิลด์ที่เปลี่ยนแปลงให้บันทึก' }, 400);
    const uniqueRows = [...new Map(rows.map((row) => [row.key, row])).values()];
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert(uniqueRows, { onConflict: 'key' })
      .select('key, is_active');
    if (error) return noStore({ success: false, error: `บันทึกการตั้งค่า LINE ไม่สำเร็จ: ${error.message}` }, 503);

    const savedKeys = new Set((data || []).map((row) => row.key));
    if (uniqueRows.some((row) => !savedKeys.has(row.key))) {
      return noStore({ success: false, error: 'Supabase ไม่ได้ยืนยันการบันทึกค่าครบทุกรายการ' }, 503);
    }

    return noStore({ success: true, savedKeys: [...savedKeys], tokenWasCleared: clearSecrets.includes('line_channel_access_token') });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'บันทึกการตั้งค่า LINE ไม่สำเร็จ';
    return noStore({ success: false, error: message }, 500);
  }
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return noStore({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
    }

    const eventType = body.eventType;
    if (eventType !== 'test' && eventType !== 'order') {
      return noStore({ success: false, error: 'ประเภทการแจ้งเตือนที่ไม่รองรับ' }, 400);
    }

    const { user, supabase: authenticatedSupabase } = await getAuthenticatedUser();
    if (eventType === 'test' && !user) {
      return noStore({ success: false, error: 'ต้องเข้าสู่ระบบผู้ดูแลก่อนทดสอบ LINE API' }, 401);
    }

    let settingsClient;
    if (user) {
      settingsClient = authenticatedSupabase;
    } else {
      settingsClient = createServiceClient();
      if (!settingsClient) {
        return noStore({ success: false, error: 'ยังส่งแจ้งเตือน LINE ไม่ได้: ต้องตั้งค่า SUPABASE_SERVICE_ROLE_KEY ฝั่ง server ก่อน' }, 503);
      }
    }

    const { data: settings, error: settingsError } = await settingsClient
      .from('admin_settings')
      .select('key, value, is_active')
      .in('key', [...SETTINGS_KEYS]);
    if (settingsError) {
      return noStore({ success: false, error: `อ่านค่าการแจ้งเตือนจาก Supabase ไม่สำเร็จ: ${settingsError.message}` }, 503);
    }

    let accessToken = '';
    let adminUserId = '';
    let notificationsEnabled = false;
    for (const row of settings || []) {
      if (row.key === 'line_channel_access_token' && typeof row.value === 'string') accessToken = row.value.trim();
      if (row.key === 'line_admin_user_id' && typeof row.value === 'string') adminUserId = row.value.trim();
      if (row.key === 'line_notifications_enabled') notificationsEnabled = row.is_active === true && row.value === 'true';
    }

    if (!notificationsEnabled) return noStore({ success: false, error: 'ปิดการแจ้งเตือน LINE อยู่ใน Admin Settings' }, 409);
    if (!accessToken) return noStore({ success: false, error: 'ยังไม่ได้ตั้ง Channel Access Token ใน Admin Settings' }, 503);
    if (!/^U[0-9a-f]{32}$/i.test(adminUserId)) {
      return noStore({ success: false, error: 'กรุณาตั้ง LINE User ID ของผู้ดูแลให้ถูกต้อง ระบบจะส่งแบบ Push ถึงผู้ดูแลคนเดียวและจะไม่ Broadcast' }, 400);
    }

    let message: string;
    if (eventType === 'test') {
      message = 'ทดสอบการแจ้งเตือนจาก Amanita Thailand Digital Museum — LINE Messaging API เชื่อมต่อแล้ว';
    } else {
      const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim() : '';
      const productName = typeof body.productName === 'string' ? body.productName.trim().slice(0, 180) : '';
      const customerName = typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 120) : '';
      const totalPrice = Number(body.totalPrice);
      const customerLineId = typeof body.customerLineId === 'string' ? body.customerLineId.trim().slice(0, 80) : '';
      const shippingAddress = typeof body.shippingAddress === 'string' ? body.shippingAddress.trim().slice(0, 300) : '';
      const slipUrl = typeof body.slipUrl === 'string' ? body.slipUrl.trim().slice(0, 500) : '';
      if (!/^AMN-[A-Z0-9-]{6,40}$/.test(orderNumber) || !productName || !customerName || !Number.isFinite(totalPrice) || totalPrice <= 0 || totalPrice > 100000000) {
        return noStore({ success: false, error: 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง' }, 400);
      }
      if (slipUrl && !/^https?:\/\//i.test(slipUrl)) return noStore({ success: false, error: 'URL สลิปไม่ถูกต้อง' }, 400);
      message = `มีคำสั่งซื้อใหม่จาก Amanita Thailand\nรหัส: ${orderNumber}\nสินค้า: ${productName}\nยอดที่แจ้ง: ${totalPrice.toLocaleString()} บาท\nผู้สั่ง: ${customerName}\nLINE: ${customerLineId || 'ไม่ระบุ'}\nที่อยู่: ${shippingAddress || 'ไม่ระบุ'}\nสลิป: ${slipUrl || 'ไม่ระบุ'}`;
    }

    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ to: adminUserId, messages: [{ type: 'text', text: message }] }),
    });

    if (!lineResponse.ok) {
      const details = (await lineResponse.text()).slice(0, 600);
      console.error('LINE Messaging API push failed:', lineResponse.status, details);
      return noStore({ success: false, error: `LINE Messaging API ตอบกลับ HTTP ${lineResponse.status}`, details }, 502);
    }

    return noStore({ success: true, mode: 'messaging_api', type: 'push' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ส่งข้อความ LINE ไม่สำเร็จ';
    console.error('LINE notification failed:', message);
    return noStore({ success: false, error: message }, 500);
  }
}
