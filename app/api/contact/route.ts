import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
  });
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return response({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phoneOrLine = typeof body.phone_or_line === 'string' ? body.phone_or_line.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const productSlug = typeof body.product_slug === 'string' ? body.product_slug.trim() : '';

    if (!name || name.length > 120 || !email || email.length > 240 || !/^\S+@\S+\.\S+$/.test(email) || !message || message.length > 3000 || phoneOrLine.length > 100 || productSlug.length > 160) {
      return response({ success: false, error: 'กรุณาตรวจสอบชื่อ อีเมล และข้อความให้ถูกต้อง' }, 400);
    }

    // The live analytics_events schema stores event details in `payload`; do not claim receipt if Supabase rejects the write.
    const database = createServiceClient() || await createClientServer();
    const { error: persistError } = await database.from('analytics_events').insert({
      event_type: 'contact_submit',
      resource_id: productSlug || 'general_contact',
      session_id: `contact_${Date.now()}`,
      payload: { name, email, phone_or_line: phoneOrLine, message, product_slug: productSlug },
    });
    if (persistError) {
      console.error('Persist contact submission failed:', persistError.message);
      return response({ success: false, error: 'บันทึกข้อความลงฐานข้อมูลไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อผ่านช่องทางที่แสดงบนหน้าเว็บ' }, 503);
    }

    let notificationStatus: 'sent' | 'unavailable' | 'failed' = 'unavailable';
    const serviceDatabase = createServiceClient();
    if (!serviceDatabase) {
      console.warn('LINE contact notification unavailable: SUPABASE_SERVICE_ROLE_KEY is missing');
    } else {
      const { data: settings, error: settingsError } = await serviceDatabase
        .from('admin_settings')
        .select('key, value, is_active')
        .in('key', ['line_channel_access_token', 'line_admin_user_id', 'line_notifications_enabled']);

      if (settingsError) {
        notificationStatus = 'failed';
        console.error('Read LINE settings for contact notification failed:', settingsError.message);
      } else {
        let accessToken = '';
        let adminUserId = '';
        let enabled = false;
        for (const row of settings || []) {
          if (row.key === 'line_channel_access_token' && typeof row.value === 'string') accessToken = row.value.trim();
          if (row.key === 'line_admin_user_id' && typeof row.value === 'string') adminUserId = row.value.trim();
          if (row.key === 'line_notifications_enabled') enabled = row.value === 'true' && row.is_active === true;
        }

        if (enabled && accessToken && /^U[0-9a-f]{32}$/i.test(adminUserId)) {
          const lineMessage = `มีข้อความติดต่อใหม่จาก Amanita Thailand\nชื่อ: ${name}\nอีเมล: ${email}\n${phoneOrLine ? `โทร/LINE: ${phoneOrLine}\n` : ''}${productSlug ? `สนใจหน้า: ${productSlug}\n` : ''}ข้อความ: ${message}`;
          try {
            const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ to: adminUserId, messages: [{ type: 'text', text: lineMessage }] }),
            });
            notificationStatus = lineResponse.ok ? 'sent' : 'failed';
            if (!lineResponse.ok) console.error('LINE contact push failed:', lineResponse.status, (await lineResponse.text()).slice(0, 600));
          } catch (error) {
            notificationStatus = 'failed';
            console.error('LINE contact push request failed:', error);
          }
        }
      }
    }

    const notificationMessage = notificationStatus === 'sent'
      ? 'บันทึกข้อความแล้วและส่งแจ้งเตือนผู้ดูแลทาง LINE แล้ว'
      : 'บันทึกข้อความแล้ว แต่ยังยืนยันการแจ้งเตือน LINE ไม่ได้';
    return response({ success: true, persisted: true, notificationStatus, message: notificationMessage }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'บันทึกข้อความติดต่อไม่สำเร็จ';
    console.error('Contact submission failed:', message);
    return response({ success: false, error: message }, 500);
  }
}
