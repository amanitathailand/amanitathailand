import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { INITIAL_CONTACT_SETTINGS, INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { createClientServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SAFE_SETTING_KEYS = ['contact_settings', 'site_content'] as const;

type SafeSettingKey = (typeof SAFE_SETTING_KEYS)[number];
type SettingRow = { key: string; value: unknown };

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
  });
}

function databaseFailure(error: { code?: string; message?: string }, requestId: string, operation: 'read' | 'write') {
  const timedOut = error.code === '57014' || /statement timeout|canceling statement/i.test(error.message || '');
  const errorCode = timedOut ? 'DB_STATEMENT_TIMEOUT' : error.code || 'DB_REQUEST_FAILED';
  const action = timedOut
    ? 'Supabase ยกเลิกคำสั่งเพราะฐานข้อมูลใช้เวลานานเกินกำหนด ระบบยังไม่ยืนยันการบันทึก ให้กดรีเฟรชเพื่อตรวจค่าจากฐานข้อมูลก่อนลองใหม่'
    : `${operation === 'write' ? 'บันทึก' : 'อ่าน'}ข้อมูลใน Supabase ไม่สำเร็จ`;

  console.error('Settings database operation failed:', {
    requestId,
    operation,
    code: error.code || null,
    message: error.message || 'unknown database error',
  });
  return jsonNoStore({ success: false, error: action, code: errorCode, requestId, operation }, timedOut ? 504 : 503);
}

const PORTAL_MENU_ICON_KEYS = new Set(['sparkles', 'compass', 'book', 'layers', 'phone', 'feather', 'package', 'none']);
const MAX_PORTAL_MENU_ITEMS = 12;

function isSafeInternalHref(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/^\/\s*javascript:/i.test(value);
}

function isSafeImageUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

function cleanPortalMenuItems(value: unknown) {
  if (!Array.isArray(value)) throw new Error('รายการเมนูต้องเป็น array');
  if (value.length > MAX_PORTAL_MENU_ITEMS) throw new Error(`เมนูวงแหวนเพิ่มได้ไม่เกิน ${MAX_PORTAL_MENU_ITEMS} รายการ`);

  const seenIds = new Set<string>();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('รูปแบบรายการเมนูไม่ถูกต้อง');
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const sub = typeof item.sub === 'string' ? item.sub.trim() : '';
    const href = typeof item.href === 'string' ? item.href.trim() : '';
    const imageUrl = typeof item.image_url === 'string' ? item.image_url.trim() : '';
    const iconKey = typeof item.icon_key === 'string' && PORTAL_MENU_ICON_KEYS.has(item.icon_key) ? item.icon_key : 'sparkles';
    const status = item.status === 'draft' ? 'draft' : item.status === 'published' ? 'published' : null;

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || seenIds.has(id)) throw new Error('รหัสการ์ดเมนูไม่ถูกต้องหรือซ้ำกัน');
    if (!label || label.length > 120) throw new Error('กรุณากรอกชื่อการ์ดไม่เกิน 120 ตัวอักษร');
    if (sub.length > 120) throw new Error('คำบรรยายภาษาอังกฤษยาวเกิน 120 ตัวอักษร');
    if (!href || href.length > 300 || !isSafeInternalHref(href)) throw new Error('ลิงก์การ์ดต้องเป็นเส้นทางภายในเว็บไซต์ เช่น /museum');
    if (imageUrl.length > 2048 || (imageUrl && !isSafeImageUrl(imageUrl))) throw new Error('URL ภาพต้องเป็น HTTPS หรือ path ภายในเว็บไซต์');
    if (!status) throw new Error('สถานะการ์ดเมนูไม่ถูกต้อง');

    seenIds.add(id);
    const requestedOrder = Number(item.sort_order);
    return {
      id,
      label,
      sub,
      href,
      icon_key: iconKey,
      image_url: imageUrl,
      sort_order: Number.isInteger(requestedOrder) && requestedOrder > 0 ? requestedOrder : index + 1,
      status,
    };
  });
}

function cleanPatch(value: unknown, defaults: Record<string, unknown>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(input)) {
    if (!(key in defaults)) continue;
    if (key === 'portal_menu_items') {
      result[key] = cleanPortalMenuItems(fieldValue);
      continue;
    }
    if (typeof fieldValue !== 'string') continue;
    result[key] = fieldValue.slice(0, 5000);
  }

  return result;
}

function revalidatePublicContent() {
  for (const path of [
    '/',
    '/museum',
    '/museum/[hallSlug]',
    '/products',
    '/products/[slug]',
    '/articles',
    '/articles/[slug]',
    '/contact',
  ]) {
    revalidatePath(path, 'page');
  }
}

export async function GET() {
  try {
    // Always query the database. No local file or browser cache can override newer DB values.
    const supabase = await createClientServer();
    const { data, error } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', [...SAFE_SETTING_KEYS]);

    if (error) {
      console.error('Read public settings failed:', error.message);
      return jsonNoStore({ success: false, error: 'อ่านการตั้งค่าจากฐานข้อมูลไม่สำเร็จ', details: error.message }, 503);
    }

    const rows = (data || []) as SettingRow[];
    const siteRow = rows.find((row) => row.key === 'site_content');
    const contactRow = rows.find((row) => row.key === 'contact_settings');
    const site = { ...INITIAL_SITE_CONTENT, ...parseAdminSettingsValue(siteRow?.value) } as typeof INITIAL_SITE_CONTENT;
    const contact = { ...INITIAL_CONTACT_SETTINGS, ...parseAdminSettingsValue(contactRow?.value) } as typeof INITIAL_CONTACT_SETTINGS;

    // Keep payment/contact fields consistent for existing public consumers of site_content.
    for (const key of ['promptpay_number', 'promptpay_name', 'promptpay_bank'] as const) {
      const value = contact[key as keyof typeof contact];
      if (typeof value === 'string' && value) site[key] = value;
    }

    return jsonNoStore({
      success: true,
      contact,
      site,
      source: 'supabase',
      updated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
    console.error('Read settings failed:', message);
    return jsonNoStore({ success: false, error: message }, 503);
  }
}

export async function POST(req: Request) {
  const requestId = globalThis.crypto.randomUUID();
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return jsonNoStore({ success: false, error: 'ต้องเข้าสู่ระบบผู้ดูแลก่อนแก้ไขการตั้งค่า' }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonNoStore({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
    }

    const hasContact = Object.prototype.hasOwnProperty.call(body, 'contactSettings');
    const hasSite = Object.prototype.hasOwnProperty.call(body, 'siteSettings');
    if (!hasContact && !hasSite) {
      return jsonNoStore({ success: false, error: 'ไม่มีข้อมูลการตั้งค่าที่ต้องการบันทึก' }, 400);
    }

    let contactPatch: Record<string, unknown> | null;
    let sitePatch: Record<string, unknown> | null;
    try {
      contactPatch = hasContact ? cleanPatch(body.contactSettings, INITIAL_CONTACT_SETTINGS as unknown as Record<string, unknown>) : null;
      sitePatch = hasSite ? cleanPatch(body.siteSettings, INITIAL_SITE_CONTENT as unknown as Record<string, unknown>) : null;
    } catch (validationError: unknown) {
      const message = validationError instanceof Error ? validationError.message : 'ข้อมูลเมนูไม่ถูกต้อง';
      return jsonNoStore({ success: false, error: message }, 400);
    }

    if ((hasContact && Object.keys(contactPatch || {}).length === 0) || (hasSite && Object.keys(sitePatch || {}).length === 0)) {
      return jsonNoStore({ success: false, error: 'ไม่มีฟิลด์การตั้งค่าที่รองรับให้บันทึก' }, 400);
    }

    // The Contact form submits a complete settings object. In that case use
    // its validated values directly and avoid an unnecessary pre-read.
    const contactIsComplete = contactPatch
      ? Object.keys(INITIAL_CONTACT_SETTINGS).every((key) => Object.prototype.hasOwnProperty.call(contactPatch, key))
      : false;
    const keysToRead: SafeSettingKey[] = [];
    if (contactPatch && !contactIsComplete) keysToRead.push('contact_settings');
    if (sitePatch) keysToRead.push('site_content');

    let rows: SettingRow[] = [];
    if (keysToRead.length > 0) {
      const { data: existingRows, error: readError } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', keysToRead);

      if (readError) {
        return databaseFailure(readError, requestId, 'read');
      }
      rows = (existingRows || []) as SettingRow[];
    }

    const currentContact = parseAdminSettingsValue(rows.find((row) => row.key === 'contact_settings')?.value);
    const currentSite = parseAdminSettingsValue(rows.find((row) => row.key === 'site_content')?.value);
    const now = new Date().toISOString();
    const writes: Array<Record<string, unknown>> = [];

    if (contactPatch) {
      const contact = {
        ...INITIAL_CONTACT_SETTINGS,
        ...(contactIsComplete ? {} : currentContact),
        ...contactPatch,
      };
      // Contact and PromptPay are canonical in contact_settings. Public API
      // and product loaders overlay these values where needed, so do not
      // duplicate the write into site_content.
      writes.push({ key: 'contact_settings', value: contact, is_active: true, description: 'การตั้งค่าช่องทางติดต่อและการชำระเงิน', updated_at: now });
    }

    if (sitePatch) {
      const site = { ...INITIAL_SITE_CONTENT, ...currentSite, ...sitePatch };
      writes.push({ key: 'site_content', value: site, is_active: true, description: 'การตั้งค่าเนื้อหาหลักของเว็บไซต์', updated_at: now });
    }

    // De-duplicate site_content when both panels are submitted in one request.
    const uniqueWrites = [...new Map(writes.map((row) => [row.key, row])).values()];
    const { data: savedRows, error: writeError } = await supabase
      .from('admin_settings')
      .upsert(uniqueWrites, { onConflict: 'key' })
      .select('key, value');

    if (writeError) {
      return databaseFailure(writeError, requestId, 'write');
    }

    const savedKeys = new Set((savedRows || []).map((row: { key: string }) => row.key));
    if (uniqueWrites.some((row) => !savedKeys.has(String(row.key)))) {
      return jsonNoStore({ success: false, error: 'ฐานข้อมูลไม่ได้ยืนยันการบันทึกค่าทุกรายการ' }, 503);
    }

    revalidatePublicContent();
    const savedContact = parseAdminSettingsValue(savedRows?.find((row: SettingRow) => row.key === 'contact_settings')?.value);
    const savedSite = parseAdminSettingsValue(savedRows?.find((row: SettingRow) => row.key === 'site_content')?.value);

    return jsonNoStore({
      success: true,
      message: 'บันทึกและยืนยันข้อมูลจาก Supabase แล้ว',
      supabaseStatus: 'synced',
      contact: savedContact,
      site: savedSite,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    console.error('Persist settings failed:', message);
    return jsonNoStore({ success: false, error: message }, 500);
  }
}
