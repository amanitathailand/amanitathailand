'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { LocalMockSupabase } = require('./support/local-mock-supabase.cjs');

const ROOT = path.resolve(__dirname, '..');
const networkCalls = [];

function loadTypeScriptModule(filePath, dependencies = {}) {
  const source = fs.readFileSync(filePath, 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require(specifier) {
      if (Object.prototype.hasOwnProperty.call(dependencies, specifier)) return dependencies[specifier];
      throw new Error(`Local CRUD tests blocked unmocked import: ${specifier}`);
    },
    Request,
    Response,
    URL,
    Date,
    console: { log() {}, warn() {}, error() {} },
    process: { env: {} },
    crypto: { randomUUID },
    fetch: async (...args) => {
      networkCalls.push(args);
      throw new Error('Network access is disabled in local CRUD tests');
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(javascript, sandbox, { filename: filePath });
  return module.exports;
}

const portalMenuModule = loadTypeScriptModule(path.join(ROOT, 'lib', 'data', 'portalMenu.ts'));
const initialData = loadTypeScriptModule(path.join(ROOT, 'lib', 'data', 'initialData.ts'), {
  '@/types': {},
  './portalMenu': portalMenuModule,
});
const settingsValueModule = loadTypeScriptModule(path.join(ROOT, 'lib', 'data', 'parseAdminSettingsValue.ts'));

function createFixture(seed = {}) {
  const db = new LocalMockSupabase(seed);
  const authState = { user: null, supabase: db };
  const cacheInvalidations = [];
  const dependencies = {
    'next/server': { NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), init) } },
    'next/cache': { revalidatePath: (...args) => cacheInvalidations.push(args) },
    '@/lib/supabase/auth': {
      getAuthenticatedUser: async () => ({ user: authState.user, supabase: authState.supabase }),
    },
    '@/lib/supabase/server': { createClientServer: async () => db },
    '@/lib/supabase/service': { createServiceClient: () => db },
    '@/lib/data/initialData': initialData,
    '@/lib/data/parseAdminSettingsValue': settingsValueModule,
  };
  const loadRoute = (route) => loadTypeScriptModule(path.join(ROOT, 'app', 'api', route, 'route.ts'), dependencies);
  return {
    db,
    authState,
    cacheInvalidations,
    routes: {
      products: loadRoute('products'),
      settings: loadRoute('settings'),
      pixels: loadRoute('pixels'),
      contact: loadRoute('contact'),
      line: loadRoute('line-notify'),
    },
  };
}

function jsonRequest(method, url, body) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function jsonResponse(response) {
  return { status: response.status, body: await response.json(), headers: response.headers };
}

function mockSettingValue(fixture, key) {
  const row = fixture.db.tables.admin_settings?.find((item) => item.key === key);
  if (!row) return undefined;
  return typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
}

const productPayload = (overrides = {}) => ({
  name: 'Local specimen',
  slug: 'local-specimen',
  description: 'Mock botanical exhibit product',
  hero_image_url: 'https://mock.invalid/specimen.png',
  price: 390,
  variants: [{ size: '3g', price: 390, in_stock: true }],
  status: 'published',
  ...overrides,
});

test('Products API: ปฏิเสธ unauthenticated write, สร้าง/อ่าน/แก้ไข/ลบ และซ่อน draft จาก public', async () => {
  const fixture = createFixture();
  const route = fixture.routes.products;

  let result = await jsonResponse(await route.POST(jsonRequest('POST', '/api/products', productPayload())));
  assert.equal(result.status, 401);
  assert.equal(fixture.db.tables.products, undefined);

  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  result = await jsonResponse(await route.POST(jsonRequest('POST', '/api/products', productPayload())));
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  const created = result.body.product;
  assert.match(created.id, /^[0-9a-f-]{36}$/i);
  assert.equal(fixture.db.tables.products.length, 1);
  assert.equal(Object.hasOwn(created, 'updated_at'), false);
  assert.equal(Object.hasOwn(fixture.db.operations[0].payload, 'updated_at'), false);

  const draftResult = await jsonResponse(await route.POST(jsonRequest('POST', '/api/products', productPayload({
    slug: 'local-draft', name: 'Draft specimen', status: 'draft',
  }))));
  assert.equal(draftResult.status, 200);
  fixture.authState.user = null;
  result = await jsonResponse(await route.GET());
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.products.map((product) => product.slug), ['local-specimen']);
  assert.match(result.headers.get('cache-control') || '', /no-store/i);

  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  result = await jsonResponse(await route.POST(jsonRequest('POST', '/api/products', productPayload({
    id: created.id, slug: 'local-specimen-edited', name: 'Edited specimen', price: 490,
  }))));
  assert.equal(result.status, 200);
  assert.equal(result.body.product.id, created.id);
  assert.equal(result.body.product.slug, 'local-specimen-edited');
  assert.equal(result.body.product.price, 490);
  assert.equal(Object.hasOwn(result.body.product, 'updated_at'), false);
  assert.equal(Object.hasOwn(fixture.db.operations.at(-1).payload, 'updated_at'), false);
  assert.ok(fixture.cacheInvalidations.some(([url]) => url === '/products'));

  result = await jsonResponse(await route.DELETE(jsonRequest('DELETE', `/api/products?id=${created.id}`)));
  assert.equal(result.status, 200);
  assert.equal(fixture.db.tables.products.some((product) => product.id === created.id), false);
  result = await jsonResponse(await route.DELETE(jsonRequest('DELETE', '/api/products?id=00000000-0000-0000-0000-000000000000')));
  assert.equal(result.status, 404);

  const schemaMismatch = await fixture.db.from('products').insert({
    slug: 'invalid-updated-at',
    updated_at: new Date().toISOString(),
  });
  assert.equal(schemaMismatch.error?.code, 'PGRST204');
  assert.match(schemaMismatch.error?.message || '', /Could not find the 'updated_at' column of 'products'/);
});

test('Settings API: บันทึก site/contact settings, อ่านกลับจาก mock DB และ revalidate public pages', async () => {
  const fixture = createFixture({ admin_settings: [
    { key: 'site_content', value: { site_title: 'Before' }, is_active: true },
    { key: 'contact_settings', value: { phone_number: '000', line_oa_id: '@preserve-me' }, is_active: true },
  ] });
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };

  let result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: { site_title: 'After local save', home_display_mode: 'photo', unknown_admin_key: 'must be ignored' },
    contactSettings: { phone_number: '0991234567' },
  })));
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.supabaseStatus, 'synced');
  assert.equal(mockSettingValue(fixture, 'site_content').site_title, 'After local save');
  assert.equal(mockSettingValue(fixture, 'contact_settings').phone_number, '0991234567');
  assert.equal(mockSettingValue(fixture, 'contact_settings').line_oa_id, '@preserve-me');
  assert.equal(fixture.cacheInvalidations.length, 8);

  result = await jsonResponse(await fixture.routes.settings.GET());
  assert.equal(result.status, 200);
  assert.equal(result.body.source, 'supabase');
  assert.equal(result.body.site.site_title, 'After local save');
  assert.equal(result.body.contact.phone_number, '0991234567');
  assert.match(result.headers.get('cache-control') || '', /no-store/i);
});

test('Settings API: Contact/PromptPay full form เขียน contact_settings แถวเดียวและอ่านค่า public กลับได้', async () => {
  const fixture = createFixture({ admin_settings: [
    { key: 'site_content', value: { site_title: 'Keep this title', promptpay_number: '0999999999' }, is_active: true },
    { key: 'contact_settings', value: { promptpay_number: '0999999999', line_oa_id: '@amanitathailand' }, is_active: true },
  ] });
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };

  const contactSettings = {
    contact_title: 'Local contact title',
    contact_subtitle: 'Local contact subtitle',
    contact_description: 'Local contact description',
    line_oa_url: 'https://line.me/R/ti/p/@amth',
    line_oa_id: '@amth',
    facebook_url: 'https://facebook.com/local-test',
    facebook_name: 'Local test page',
    phone_number: '0800000000',
    email: 'contact@example.test',
    address: 'Mock-only address',
    business_hours: 'Daily 09:00-18:00',
    shopee_url: 'https://shopee.co.th/local-test',
    google_maps_url: 'https://maps.google.com/?q=local-test',
    promptpay_number: '0812345678',
    promptpay_name: 'Local Test Recipient',
    promptpay_bank: 'Mock Bank',
    payment_instructions: 'Mock-only payment note',
  };

  let result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    contactSettings,
  })));
  assert.equal(result.status, 200);
  assert.equal(result.body.supabaseStatus, 'synced');
  assert.equal(result.body.contact.promptpay_number, '0812345678');
  assert.equal(result.body.contact.promptpay_name, 'Local Test Recipient');
  assert.equal(result.body.contact.payment_instructions, 'Mock-only payment note');
  assert.equal(result.body.contact.line_oa_id, '@amth');
  assert.equal(typeof fixture.db.tables.admin_settings.find((row) => row.key === 'contact_settings').value, 'string');
  assert.equal(mockSettingValue(fixture, 'contact_settings').line_oa_id, '@amth');

  const operationsBeforeReadBack = fixture.db.operations.filter((operation) => operation.table === 'admin_settings');
  assert.deepEqual(operationsBeforeReadBack.map((operation) => operation.action), ['upsert']);
  assert.deepEqual(operationsBeforeReadBack[0].payload.map((row) => row.key), ['contact_settings']);
  assert.equal(mockSettingValue(fixture, 'site_content').site_title, 'Keep this title');
  assert.equal(mockSettingValue(fixture, 'site_content').promptpay_number, '0999999999');

  result = await jsonResponse(await fixture.routes.settings.GET());
  assert.equal(result.body.contact.promptpay_number, '0812345678');
  assert.equal(result.body.contact.line_oa_id, '@amth');
  assert.equal(result.body.site.promptpay_number, '0812345678');
  assert.equal(result.body.site.site_title, 'Keep this title');
});

test('Settings API: radial portal items CRUD เก็บ image URL/order/status ใน site_content และอ่านกลับได้', async () => {
  const fixture = createFixture({ admin_settings: [
    { key: 'site_content', value: { site_title: 'Portal test site' }, is_active: true },
  ] });
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };

  const firstSave = [
    {
      id: 'portal-test-1', label: 'ห้องทดสอบ', sub: 'Test Hall', href: '/museum/test-hall',
      icon_key: 'none', image_url: 'https://media.example.test/test-hall.jpg', sort_order: 1, status: 'published',
    },
    {
      id: 'portal-test-2', label: 'บทความทดสอบ', sub: 'Test Articles', href: '/articles',
      icon_key: 'none', image_url: '', sort_order: 2, status: 'draft',
    },
  ];

  let result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: { portal_menu_items: firstSave },
  })));
  assert.equal(result.status, 200);
  assert.equal(result.body.supabaseStatus, 'synced');
  assert.deepEqual(result.body.site.portal_menu_items, firstSave);
  assert.equal(result.body.site.portal_menu_items[0].icon_key, 'none');
  assert.deepEqual(mockSettingValue(fixture, 'site_content').portal_menu_items, firstSave);

  const edited = [{ ...firstSave[0], label: 'หัวข้อที่แก้แล้ว', image_url: 'https://media.example.test/updated.jpg' }];
  result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: { portal_menu_items: edited },
  })));
  assert.equal(result.status, 200);
  assert.deepEqual(mockSettingValue(fixture, 'site_content').portal_menu_items, edited);

  result = await jsonResponse(await fixture.routes.settings.GET());
  assert.deepEqual(result.body.site.portal_menu_items, edited);
  assert.equal(typeof fixture.db.tables.admin_settings.find((row) => row.key === 'site_content').value, 'string');
});

test('Settings API: radial portal menu ปฏิเสธ external href และไม่เขียนค่าเมื่อ validation ไม่ผ่าน', async () => {
  const fixture = createFixture();
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  const result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: {
      site_title: 'Unsafe portal test',
      portal_menu_items: [{
        id: 'portal-unsafe', label: 'Unsafe', sub: '', href: 'https://outside.example.test',
        icon_key: 'sparkles', image_url: '', sort_order: 1, status: 'published',
      }],
    },
  })));

  assert.equal(result.status, 400);
  assert.match(result.body.error, /เส้นทางภายในเว็บไซต์/);
  assert.equal(fixture.db.operations.some((operation) => operation.action === 'upsert'), false);
});

test('Settings API: statement timeout ระหว่าง upsert ส่ง 504 + requestId และไม่รายงานว่า synced', async () => {
  const fixture = createFixture({ admin_settings: [
    { key: 'site_content', value: { site_title: 'Persisted old value' }, is_active: true },
  ] });
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  fixture.db.failNext('admin_settings', 'upsert', {
    code: '57014', message: 'canceling statement due to statement timeout',
  });

  const result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: { site_title: 'This write times out' },
  })));
  assert.equal(result.status, 504);
  assert.equal(result.body.success, false);
  assert.equal(result.body.code, 'DB_STATEMENT_TIMEOUT');
  assert.equal(result.body.operation, 'write');
  assert.match(result.body.requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(mockSettingValue(fixture, 'site_content').site_title, 'Persisted old value');
});

test('Settings API: timeout ระหว่างอ่าน contact patch ระบุ operation=read และไม่เริ่ม upsert', async () => {
  const fixture = createFixture();
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  fixture.db.failNext('admin_settings', 'select', {
    code: '57014', message: 'canceling statement due to statement timeout',
  });

  const result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    contactSettings: { phone_number: '0800000000' },
  })));
  assert.equal(result.status, 504);
  assert.equal(result.body.code, 'DB_STATEMENT_TIMEOUT');
  assert.equal(result.body.operation, 'read');
  assert.equal(fixture.db.operations.some((operation) => operation.action === 'upsert'), false);
});

test('Settings API: ต้องมี session และ patch ที่รองรับก่อนเขียน', async () => {
  const fixture = createFixture();
  let result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: { site_title: 'No session' },
  })));
  assert.equal(result.status, 401);
  fixture.authState.user = { id: randomUUID() };
  result = await jsonResponse(await fixture.routes.settings.POST(jsonRequest('POST', '/api/settings', {
    siteSettings: { not_a_real_setting: 'ignored' },
  })));
  assert.equal(result.status, 400);
});

test('Articles Admin DB contract: upsert by slug, update by UUID, verify read-back, delete and confirm missing row', async () => {
  const db = new LocalMockSupabase();
  const created = await db.from('articles').upsert({
    slug: 'local-article', title: 'Local article', status: 'draft', content_blocks: [], tags: ['mock'],
  }, { onConflict: 'slug' }).select().single();
  assert.equal(created.error, null);
  const updated = await db.from('articles').update({
    slug: 'local-article-edited', title: 'Edited article', status: 'published',
  }).eq('id', created.data.id).select().maybeSingle();
  assert.equal(updated.data.title, 'Edited article');
  const reloaded = await db.from('articles').select('*').eq('id', created.data.id);
  assert.equal(reloaded.data[0].slug, 'local-article-edited');
  const deleted = await db.from('articles').delete().eq('id', created.data.id).select('id');
  assert.equal(deleted.data.length, 1);
  const missing = await db.from('articles').delete().eq('id', created.data.id).select('id');
  assert.equal(missing.data.length, 0);
});

test('Museum Admin DB contract: halls และ exhibits create/update/delete พร้อมตรวจ FK ของ hall_id', async () => {
  const db = new LocalMockSupabase();
  const hall = await db.from('museum_halls').upsert({ slug: 'local-hall', title: 'Local hall', status: 'draft' }, { onConflict: 'slug' }).select('*').single();
  assert.equal(hall.error, null);
  const exhibit = await db.from('museum_exhibits').upsert({
    hall_id: hall.data.id, slug: 'local-exhibit', title: 'Local exhibit', content_blocks: [], status: 'published',
  }, { onConflict: 'slug' }).select('*').single();
  assert.equal(exhibit.error, null);
  const invalidFk = await db.from('museum_exhibits').insert({
    hall_id: randomUUID(), slug: 'invalid-exhibit', title: 'Invalid', content_blocks: [],
  }).select().single();
  assert.equal(invalidFk.error.code, '23503');

  const updatedHall = await db.from('museum_halls').update({ title: 'Renamed hall' }).eq('id', hall.data.id).select('*').maybeSingle();
  const updatedExhibit = await db.from('museum_exhibits').update({ title: 'Renamed exhibit' }).eq('id', exhibit.data.id).select('*').maybeSingle();
  assert.equal(updatedHall.data.title, 'Renamed hall');
  assert.equal(updatedExhibit.data.title, 'Renamed exhibit');
  assert.equal((await db.from('museum_exhibits').select('*').eq('hall_id', hall.data.id)).data.length, 1);
  assert.equal((await db.from('museum_exhibits').delete().eq('id', exhibit.data.id).select('id')).data.length, 1);
  assert.equal((await db.from('museum_halls').delete().eq('id', hall.data.id).select('id')).data.length, 1);
});

test('Orders Admin DB contract: เปลี่ยนสถานะแล้วอ่านค่ากลับ และลบเฉพาะ order id ที่ระบุ', async () => {
  const orderId = randomUUID();
  const db = new LocalMockSupabase({ orders: [{
    id: orderId, order_number: 'AMN-LOCAL-0001', customer_name: 'Local customer', customer_phone: '000',
    shipping_address: 'Mock address', product_name: 'Mock item', total_price: 390, status: 'pending',
  }] });
  const updated = await db.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', orderId).select('id, status').maybeSingle();
  assert.equal(updated.data.status, 'paid');
  assert.equal((await db.from('orders').select('*').eq('id', orderId)).data[0].status, 'paid');
  const deleted = await db.from('orders').delete().eq('id', orderId).select('id');
  assert.equal(deleted.data.length, 1);
  assert.equal((await db.from('orders').select('*').eq('id', orderId)).data.length, 0);
});

test('Media Admin DB contract: upload + metadata create/read/delete และชดเชย object เมื่อ metadata insert ล้มเหลว', async () => {
  const db = new LocalMockSupabase();
  const bucket = db.storage.from('museum-media');
  const storagePath = `admin/local-${randomUUID()}.png`;
  const file = { name: 'local.png', type: 'image/png', size: 128 };
  const uploaded = await bucket.upload(storagePath, file, { upsert: false, contentType: file.type });
  assert.equal(uploaded.error, null);
  const publicUrl = bucket.getPublicUrl(storagePath).data.publicUrl;
  const metadata = await db.from('media_assets').insert({
    file_name: file.name, storage_path: storagePath, public_url: publicUrl, mime_type: file.type, file_size_bytes: file.size,
  }).select('*').single();
  assert.equal(metadata.error, null);
  assert.equal((await db.from('media_assets').select('*').eq('storage_path', storagePath)).data[0].public_url, publicUrl);
  assert.equal((await bucket.remove([storagePath])).error, null);
  assert.equal((await db.from('media_assets').delete().eq('id', metadata.data.id).select('id')).data.length, 1);
  assert.equal(db.storageObjects.size, 0);

  const rollbackPath = `admin/rollback-${randomUUID()}.png`;
  await bucket.upload(rollbackPath, file, { upsert: false, contentType: file.type });
  db.failNext('media_assets', 'insert', { code: 'MOCK_WRITE_FAILED', message: 'simulated metadata failure' });
  const failedMetadata = await db.from('media_assets').insert({
    file_name: file.name, storage_path: rollbackPath, public_url: bucket.getPublicUrl(rollbackPath).data.publicUrl,
    mime_type: file.type, file_size_bytes: file.size,
  }).select('*').single();
  assert.equal(failedMetadata.error.code, 'MOCK_WRITE_FAILED');
  await bucket.remove([rollbackPath]);
  assert.equal(db.storageObjects.size, 0);
});

test('Pixels Admin + public Pixels API: upsert ทุก provider และ anonymous เห็นเฉพาะ active', async () => {
  const fixture = createFixture();
  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  const providers = ['ga4', 'meta', 'tiktok', 'gtm', 'clarity'];
  for (const [index, provider] of providers.entries()) {
    const saved = await fixture.db.from('pixel_configs').upsert({
      provider, pixel_id: `LOCAL-${index}`, is_active: index % 2 === 0, updated_at: new Date().toISOString(),
    }, { onConflict: 'provider' }).select('provider, pixel_id, is_active').single();
    assert.equal(saved.data.provider, provider);
    assert.equal(saved.error, null);
  }
  const adminRead = await fixture.routes.pixels.GET();
  assert.equal((await adminRead.json()).pixels.length, 5);
  fixture.authState.user = null;
  const publicRead = await fixture.routes.pixels.GET();
  const publicBody = await publicRead.json();
  assert.equal(publicBody.pixels.length, 3);
  assert.ok(publicBody.pixels.every((pixel) => pixel.is_active));
});

test('Contact API: validation ปฏิเสธข้อมูลไม่ครบ และ valid inquiry ต้องถูก persist ก่อนตอบสำเร็จ', async () => {
  const fixture = createFixture();
  let result = await jsonResponse(await fixture.routes.contact.POST(jsonRequest('POST', '/api/contact', {
    name: 'Only a name', email: 'invalid', message: '',
  })));
  assert.equal(result.status, 400);
  assert.equal(fixture.db.tables.analytics_events, undefined);

  result = await jsonResponse(await fixture.routes.contact.POST(jsonRequest('POST', '/api/contact', {
    name: 'Local visitor', email: 'visitor@example.test', phone_or_line: 'line-local',
    message: 'Mock inquiry; no real person data', product_slug: 'local-specimen',
  })));
  assert.equal(result.status, 201);
  assert.equal(result.body.success, true);
  assert.equal(result.body.persisted, true);
  assert.equal(fixture.db.tables.analytics_events.length, 1);
  assert.equal(fixture.db.tables.analytics_events[0].event_type, 'contact_submit');
  assert.deepEqual(fixture.db.tables.analytics_events[0].payload, {
    name: 'Local visitor', email: 'visitor@example.test', phone_or_line: 'line-local',
    message: 'Mock inquiry; no real person data', product_slug: 'local-specimen',
  });
  assert.equal(Object.hasOwn(fixture.db.tables.analytics_events[0], 'metadata'), false);
  assert.equal(result.body.notificationStatus, 'unavailable');
  assert.equal(networkCalls.length, 0);
});

test('Analytics tracker: event data uses the live payload column', async () => {
  const db = new LocalMockSupabase();
  const tracker = loadTypeScriptModule(path.join(ROOT, 'lib', 'analytics', 'tracker.ts'), {
    '@/lib/supabase/client': { createClient: () => db },
  });

  await tracker.trackEvent('page_view', 'local-page', { source: 'mock' });
  assert.equal(db.tables.analytics_events.length, 1);
  assert.deepEqual(db.tables.analytics_events[0].payload, { source: 'mock' });
  assert.equal(Object.hasOwn(db.tables.analytics_events[0], 'metadata'), false);
});

test('LINE settings API: admin only, token is masked on read and blank token preserves stored secret', async () => {
  const fixture = createFixture({ admin_settings: [
    { key: 'line_channel_access_token', value: 'MOCK-SECRET-TOKEN', is_active: true },
  ] });
  let response = await fixture.routes.line.GET();
  let result = await jsonResponse(response);
  assert.equal(result.status, 401);

  fixture.authState.user = { id: randomUUID(), role: 'super_admin' };
  result = await jsonResponse(await fixture.routes.line.GET());
  assert.equal(result.status, 200);
  assert.equal(result.body.hasAccessToken, true);
  assert.equal(result.body.settings.find((row) => row.key === 'line_channel_access_token').value, '');
  assert.equal(result.body.settings.find((row) => row.key === 'line_channel_access_token').is_configured, true);

  result = await jsonResponse(await fixture.routes.line.PUT(jsonRequest('PUT', '/api/line-notify', {
    settingsToSave: [
      { key: 'line_channel_access_token', value: '', is_active: true },
      { key: 'line_channel_id', value: 'local-channel-id', is_active: true },
    ],
  })));
  assert.equal(result.status, 200);
  assert.equal(fixture.db.tables.admin_settings.find((row) => row.key === 'line_channel_access_token').value, 'MOCK-SECRET-TOKEN');
  assert.equal(fixture.db.tables.admin_settings.find((row) => row.key === 'line_channel_id').value, 'local-channel-id');
  assert.equal(networkCalls.length, 0);
});

test('Local simulation guard: no external network calls were attempted', () => {
  assert.equal(networkCalls.length, 0, 'unexpected external network call was attempted');
});


test('3D portal touch activation waits for a single tap release and guards the compatibility click', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', '3d', 'MuseumSceneCanvas.tsx'), 'utf8');

  assert.match(source, /activeTouchPointers\.size === 1/);
  assert.match(source, /!touchGestureMoved/);
  assert.match(source, /!touchGestureHadMultiplePointers/);
  assert.match(source, /!touchGestureCancelled/);
  assert.match(source, /pointerup', handleTouchPointerUp/);
  assert.match(source, /document\.addEventListener\('click', handleCaptureClick, true\)/);
  assert.match(source, /ignoreCompatibilityClickUntil/);
  assert.doesNotMatch(source, /addEventListener\('touchstart'/);
});

test('Public portal menu fetches fresh settings whenever it opens', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', 'navigation', 'RadialPortalMenu.tsx'), 'utf8');

  assert.match(source, /if \(!isPortalOpen\) return;/);
  assert.match(source, /fetch\('\/api\/settings', \{ cache: 'no-store' \}\)/);
  assert.match(source, /\}, \[isPortalOpen\]\);/);
});

test('Public portal menu renders uploaded images on mobile and desktop with an icon fallback', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', 'navigation', 'RadialPortalMenu.tsx'), 'utf8');
  const adminSource = fs.readFileSync(path.join(ROOT, 'app', '(admin)', 'admin', 'site-content', 'page.tsx'), 'utf8');

  assert.equal((source.match(/src=\{item\.image_url\}/g) || []).length, 2);
  assert.match(source, /w-12 h-12/);
  assert.match(source, /w-16 h-16/);
  assert.equal((source.match(/onError=\{\(event\) => event\.currentTarget\.remove\(\)\}/g) || []).length, 2);
  assert.match(source, /item\.icon_key === 'none' \? null/);
  assert.match(adminSource, /<option value="none">ไม่มี icon<\/option>/);
  assert.match(adminSource, /item\.icon_key === 'none'/);
});
