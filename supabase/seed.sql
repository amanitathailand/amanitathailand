-- ============================================================================
-- AMANITA THAILAND - COMPLETE DATABASE SCHEMA & SEED SCRIPT (v2.0)
-- รองรับระบบคำสั่งซื้อ (Orders), LINE ID, PromptPay QR, และสิทธิ์ CRUD ครบถ้วน
-- ============================================================================

-- 1. สร้าง EXTENSION ที่จำเป็น
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. สร้าง ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin', 
        'content_admin', 
        'museum_curator', 
        'editor', 
        'analyst', 
        'visitor'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pixel_provider AS ENUM ('meta', 'tiktok', 'ga4', 'gtm', 'clarity');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ตาราง PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'visitor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ตาราง ADMIN_SETTINGS (LINE API & Site Content & PromptPay)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ตาราง MUSEUM_HALLS (ห้องจัดแสดงนิทรรศการ)
CREATE TABLE IF NOT EXISTS public.museum_halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    cover_image_url TEXT,
    ambient_audio_url TEXT,
    scene_config JSONB DEFAULT '{"fogDensity": 0.04, "bloomStrength": 1.2, "fogColor": "#0d0407"}'::jsonb,
    timeline_meta JSONB DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ตาราง MUSEUM_EXHIBITS (วัตถุจัดแสดงย่อย & Content Blocks)
CREATE TABLE IF NOT EXISTS public.museum_exhibits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id UUID REFERENCES public.museum_halls(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    model_3d_url TEXT,
    content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    audio_narrative_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ตาราง ARTICLES (บทความวิชาการ & บล็อก)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    category_id UUID,
    featured_image_url TEXT,
    content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    reading_time_minutes INT NOT NULL DEFAULT 5,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    status content_status NOT NULL DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ตาราง PRODUCTS (ตัวอย่างพฤกษศาสตร์เกรดสะสม)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    botanical_name TEXT DEFAULT 'Amanita Muscaria',
    origin_region TEXT DEFAULT 'Highlands of Chiang Mai & Global Foraged',
    description TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 390,
    hero_image_url TEXT NOT NULL,
    gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    variants JSONB NOT NULL DEFAULT '[
        {"size": "3g", "price": 390, "in_stock": true, "note": "ตัวอย่างขนาดสังเกตผลเบื้องต้น (Intensity 2/5)"},
        {"size": "5g", "price": 590, "in_stock": true, "note": "ตัวอย่างมาตรฐานพฤกษศาสตร์ (Intensity 3/5)"},
        {"size": "10g", "price": 990, "in_stock": true, "note": "ตัวอย่างเกรดสะสมเข้มข้น (Intensity 4/5)"},
        {"size": "15g", "price": 1450, "in_stock": true, "note": "ตัวอย่างดอกสมบูรณ์เกรดสูง (Intensity 5/5)"}
    ]'::jsonb,
    line_oa_url TEXT DEFAULT 'https://line.me/R/ti/p/@amanitathailand',
    facebook_url TEXT DEFAULT 'https://facebook.com/amanitathailand',
    shopee_url TEXT,
    external_url TEXT,
    disclaimer TEXT DEFAULT 'ข้อมูลและตัวอย่างจัดแสดงเพื่อการศึกษาทางพฤกษศาสตร์ มานุษยวิทยา และชีวเคมีเท่านั้น',
    content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- เพิ่มคอลัมน์สำคัญหากมีตารางเดิมอยู่แล้ว
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 390;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shopee_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- 9. ตาราง ORDERS (คำสั่งซื้อ & สลิปโอนเงิน PromptPay พร้อม LINE ID)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_line_id TEXT,
    shipping_address TEXT NOT NULL,
    product_id UUID,
    product_name TEXT NOT NULL,
    variant_size TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC NOT NULL,
    slip_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_line_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS slip_url TEXT;

-- 10. ตาราง PIXEL_CONFIGS (TRACKING PIXELS)
CREATE TABLE IF NOT EXISTS public.pixel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider pixel_provider NOT NULL UNIQUE,
    pixel_id TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    custom_script_head TEXT,
    custom_script_body TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ตาราง MEDIA_ASSETS (คลังไฟล์สื่อ & รูปภาพ)
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    public_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ตาราง ANALYTICS_EVENTS (กิจกรรมผู้ใช้งาน & แดชบอร์ดสถิติ)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    resource_id TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Row Level Security: public อ่านเฉพาะข้อมูลที่เผยแพร่, authenticated จัดการ CMS ได้
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.museum_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.museum_exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.admin_settings, public.museum_halls, public.museum_exhibits, public.articles, public.products, public.pixel_configs TO anon, authenticated;
GRANT INSERT ON public.orders, public.analytics_events TO anon, authenticated;
GRANT ALL ON public.profiles, public.admin_settings, public.museum_halls, public.museum_exhibits, public.articles, public.products, public.orders, public.pixel_configs, public.media_assets, public.analytics_events TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "public read safe settings" ON public.admin_settings;
CREATE POLICY "public read safe settings" ON public.admin_settings FOR SELECT TO anon, authenticated USING (key IN ('site_content', 'contact_settings') OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated manage settings" ON public.admin_settings;
CREATE POLICY "authenticated manage settings" ON public.admin_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public read published halls" ON public.museum_halls;
CREATE POLICY "public read published halls" ON public.museum_halls FOR SELECT TO anon, authenticated USING (status = 'published' OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated manage halls" ON public.museum_halls;
CREATE POLICY "authenticated manage halls" ON public.museum_halls FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public read published exhibits" ON public.museum_exhibits;
CREATE POLICY "public read published exhibits" ON public.museum_exhibits FOR SELECT TO anon, authenticated USING (status = 'published' OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated manage exhibits" ON public.museum_exhibits;
CREATE POLICY "authenticated manage exhibits" ON public.museum_exhibits FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public read published articles" ON public.articles;
CREATE POLICY "public read published articles" ON public.articles FOR SELECT TO anon, authenticated USING (status = 'published' OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated manage articles" ON public.articles;
CREATE POLICY "authenticated manage articles" ON public.articles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public read published products" ON public.products;
CREATE POLICY "public read published products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published' OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated manage products" ON public.products;
CREATE POLICY "authenticated manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public read active pixels" ON public.pixel_configs;
CREATE POLICY "public read active pixels" ON public.pixel_configs FOR SELECT TO anon, authenticated USING (is_active = true OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated manage pixels" ON public.pixel_configs;
CREATE POLICY "authenticated manage pixels" ON public.pixel_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public create orders" ON public.orders;
CREATE POLICY "public create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated read orders" ON public.orders;
CREATE POLICY "authenticated read orders" ON public.orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated update orders" ON public.orders;
CREATE POLICY "authenticated update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated delete orders" ON public.orders;
CREATE POLICY "authenticated delete orders" ON public.orders FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "public create analytics events" ON public.analytics_events;
CREATE POLICY "public create analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated read analytics events" ON public.analytics_events;
CREATE POLICY "authenticated read analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (true);

-- Supabase Storage: public อัปโหลดได้เฉพาะสลิป, authenticated จัดการสื่อได้
INSERT INTO storage.buckets (id, name, public)
VALUES ('museum-media', 'museum-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public read museum media" ON storage.objects;
CREATE POLICY "public read museum media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'museum-media');
DROP POLICY IF EXISTS "public upload museum slips" ON storage.objects;
CREATE POLICY "public upload museum slips" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'museum-media' AND name LIKE 'slips/%');
DROP POLICY IF EXISTS "authenticated manage museum media" ON storage.objects;
CREATE POLICY "authenticated manage museum media" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'museum-media') WITH CHECK (bucket_id = 'museum-media');

-- ============================================================================
-- 14. ใส่ชุดข้อมูลเริ่มต้นจริง (SEED DATA)
-- ============================================================================

-- A. การตั้งค่า LINE Messaging API & LINE Notify
INSERT INTO public.admin_settings (key, value, is_active, description)
VALUES 
    ('line_channel_id', '"2006789012"'::jsonb, true, 'LINE Channel ID จาก LINE Developers Console'),
    ('line_channel_access_token', '""'::jsonb, true, 'Channel Access Token (Token ID) สำหรับ LINE Messaging API'),
    ('line_channel_secret', '""'::jsonb, true, 'LINE Channel Secret'),
    ('line_admin_user_id', '""'::jsonb, true, 'LINE User ID ของผู้ดูแลที่ต้องการรับข้อความส่วนตัว (เช่น Uxxxxxxxx...)'),
    ('line_notify_token', '""'::jsonb, true, 'LINE Notify Token (โหมดสำรอง)'),
    ('line_notifications_enabled', 'true'::jsonb, true, 'สถานะเปิด/ปิดการแจ้งเตือนอัตโนมัติ')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description;

-- B. การตั้งค่าข้อความหลักเว็บไซต์ และบัญชีรับเงิน PromptPay QR (0909964514 นายวันชนะ K-Bank)
INSERT INTO public.admin_settings (key, value, is_active, description)
VALUES 
    ('site_content', '{
      "site_title": "Amanita Muscaria Digital Museum",
      "site_subtitle": "แพลตฟอร์มพิพิธภัณฑ์ดิจิทัลและแหล่งรวบรวมตัวอย่างพฤกษศาสตร์ Amanita Muscaria แห่งแรกในประเทศไทย",
      "portal_button_text": "เข้าสู่หอพิพิธภัณฑ์ดิจิทัล",
      "museum_title": "หอนิทรรศการเสมือนจริง",
      "museum_subtitle": "สำรวจชีววิทยา ประวัติศาสตร์ชาติพันธุ์ และแบบจำลอง 3 มิติ",
      "museum_description": "ดื่มด่ำกับประสบการณ์นิทรรศการเห็ดอมฤต ผ่านระบบเสียงบรรยายและแบบจำลองชีวภาพ",
      "products_title": "ตัวอย่างพฤกษศาสตร์เพื่อการสะสมและการศึกษา",
      "products_subtitle": "Botanical Herbarium Specimens & Collector Editions",
      "products_description": "ตัวอย่างเห็ด Amanita Muscaria แท้เกรดคัดสรร นำเข้าถูกกฎหมายเพื่อการศึกษาวิจัยอนุกรมวิธานและงานสะสมพฤกษศาสตร์",
      "articles_title": "คลังบทความวิชาการ & ประวัติศาสตร์ชาติพันธุ์",
      "articles_subtitle": "Ethnobotany, Science & Cultural Studies",
      "articles_description": "องค์ความรู้ทางวิทยาศาสตร์ สารประกอบทางชีวเคมี และบทบาททางวัฒนธรรมของเห็ดหมวกแดง",
      "footer_disclaimer": "คำเตือน: วัตถุประสงค์เพื่อการศึกษา อนุกรมวิธานพืช และการสะสมทางพฤกษศาสตร์เท่านั้น ห้ามนำไปบริโภคโดยเด็ดขาด",
      "promptpay_number": "0909964514",
      "promptpay_name": "นายวันชนะ",
      "promptpay_bank": "ธนาคารกสิกรไทย (K-Bank)"
    }'::jsonb, true, 'การตั้งค่าข้อความหลักของเว็บไซต์ และบัญชีพร้อมเพย์รับชำระเงิน')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    is_active = EXCLUDED.is_active;


-- B.2 การตั้งค่าช่องทางติดต่อหลัก และบัญชีรับชำระเงิน PromptPay QR (Contact & Payment Settings)
INSERT INTO public.admin_settings (key, value, is_active, description)
VALUES 
    ('contact_settings', '{
      "contact_title": "ติดต่อผู้ดูแลและภัณฑารักษ์พิพิธภัณฑ์",
      "contact_subtitle": "Curator & Botanical Archive Contact",
      "contact_description": "สำหรับการสอบถามข้อมูลเชิงวิชาการ ตัวอย่างพืชพรรณ หรือแจ้งความร่วมมือ",
      "line_oa_url": "https://line.me/R/ti/p/@amanitathailand",
      "line_oa_id": "@amanitathailand",
      "facebook_url": "https://facebook.com/amanitathailand",
      "facebook_name": "Amanita Thailand Digital Museum",
      "phone_number": "090-996-4514",
      "email": "contact@amanitathailand.com",
      "address": "ศูนย์ศึกษาและอนุรักษ์พืชพรรณ Amanita Thailand อ.แม่ริม จ.เชียงใหม่ 50180",
      "business_hours": "ทุกวัน เวลา 09:00 - 18:00 น.",
      "shopee_url": "https://shopee.co.th/amanitathailand",
      "promptpay_number": "0909964514",
      "promptpay_name": "นายวันชนะ",
      "promptpay_bank": "ธนาคารกสิกรไทย (K-Bank)",
      "payment_instructions": "สแกน QR Code เพื่อชำระเงินตามยอดจริง แล้วแนบสลิปเพื่อยืนยันคำสั่งซื้อ ระบบจะส่งข้อความแจ้งเตือนเข้า LINE อัตโนมัติ"
    }'::jsonb, true, 'การตั้งค่าช่องทางติดต่อหลักและบัญชีรับชำระเงิน PromptPay QR')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    is_active = EXCLUDED.is_active;

-- C. การตั้งค่า Tracking Pixels
INSERT INTO public.pixel_configs (provider, pixel_id, is_active)
VALUES 
    ('ga4', 'G-AMANITATHAI', true),
    ('meta', '987654321098765', false),
    ('tiktok', 'C9876543210AMANITA', false),
    ('gtm', 'GTM-AMANITATHAI', false),
    ('clarity', 'clr_amanitathai99', false)
ON CONFLICT (provider) DO UPDATE SET 
    pixel_id = EXCLUDED.pixel_id,
    is_active = EXCLUDED.is_active;

-- D. ห้องจัดแสดง 4 ห้องหลัก
INSERT INTO public.museum_halls (slug, title, subtitle, description, cover_image_url, sort_order, status)
VALUES 
(
  'legend-hall',
  'ห้องตำนานและเทพปกรณัมแห่งผืนป่า',
  'Amanita Muscaria: The World Legendary Mushroom',
  'เห็ดสีแดงที่มีจุดสีขาว หนึ่งในเห็ดที่มีชื่อเสียงที่สุดในโลก มักขึ้นตามธรรมชาติเคียงข้างต้นสนและต้นเบิร์ช เป็นสัญลักษณ์แห่งเวทมนตร์และนิทานพื้นบ้าน',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  1,
  'published'
),
(
  'science-hall',
  'ห้องวิทยาศาสตร์และพฤกษเคมี',
  'Phytochemistry & Neurobiology Insights',
  'เจาะลึกโครงสร้างสารเคมีธรรมชาติ Muscimol, Ibotenic Acid, Muscarine และ Muscaflavin พร้อมปฏิกิริยาทางสรีรวิทยาในระดับชีวโมเลกุล',
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
  2,
  'published'
),
(
  'dream-hall',
  'ห้องผ่อนคลายและสภาวะเคลิ้มฝัน',
  'Lucid Dreaming, Somatosensory & Sleep Studies',
  'สำรวจมิติทางประสาทสัมผัส บันทึกความฝันอันแจ่มชัด (Lucid Dream) คลื่นสมอง Delta/Theta และงานวิจัยด้านการนอนหลับระดับสากล',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
  3,
  'published'
),
(
  'ethnology-hall',
  'ห้องมานุษยวิทยาและวัฒนธรรมชนเผ่า',
  'Siberian Shamanism, Reindeer & Northern Lore',
  'สืบสานเรื่องราวความผูกพันนับพันปีระหว่างชาวพื้นเมืองไซบีเรีย กวางเรนเดียร์ พิธีกรรมศักดิ์สิทธิ์ และต้นกำเนิดแห่งเทศกาลฤดูหนาว',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
  4,
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  sort_order = EXCLUDED.sort_order;

-- E. วัตถุจัดแสดง (Exhibits)
INSERT INTO public.museum_exhibits (hall_id, slug, title, summary, content_blocks, sort_order, status)
SELECT 
  id,
  'siberian-shaman-and-raven',
  'ตำนานของชาแมนไซบีเรียและอีกายักษ์ (Siberian Shaman & Giant Raven)',
  'เรื่องราวของผู้นำทางจิตวิญญาณแห่งทุ่งหิมะ และตำนานอีกายักษ์ผู้สร้างโลกแห่งชนเผ่าคอร์ยัค',
  '[
    {"id": "b1", "type": "heading", "data": {"level": 2, "text": "ใครคือหมอผีในวัฒนธรรมไซบีเรีย?"}},
    {"id": "b2", "type": "text", "data": {"content": "ในไซบีเรีย หมอผี (Shaman) คือบุคคลสำคัญของชุมชน เป็นทั้งผู้นำทางจิตวิญญาณ ผู้รักษา และผู้ประกอบพิธีกรรมตามความเชื่อดั้งเดิมในการเชื่อมต่อระหว่างโลกมนุษย์และพลังธรรมชาติอันยิ่งใหญ่"}},
    {"id": "b3", "type": "heading", "data": {"level": 3, "text": "ตำนานอีกายักษ์ (The Legend of the Giant Raven)"}},
    {"id": "b4", "type": "text", "data": {"content": "ชนเผ่าคอร์ยัค (Koryak) พื้นเมืองมีเรื่องเล่าสืบทอดกันมาเกี่ยวกับอีกายักษ์ผู้สร้างโลก ซึ่งเป็นหนึ่งในนิทานปรัมปราที่มีชื่อเสียงที่สุดที่มีความเชื่อมโยงกับ Amanita Muscaria ที่เติบโตอย่างโดดเด่นท่ามกลางหิมะขาวโพลน"}},
    {"id": "b5", "type": "quote", "data": {"quote": "หนึ่งในเห็ดที่มีความเชื่อมโยงมากที่สุดกับวัฒนธรรมชาแมนและเทพนิยายโบราณ", "author": "บันทึกคติชนวิทยาไซบีเรีย"}},
    {"id": "b6", "type": "callout", "data": {"variant": "info", "title": "เส้นทางแห่งตำนาน (The Legend Path)", "message": "Ancient Era → Siberian Legend → European Folk Tales → Victorian Era → Fantasy Literature → Modern Games & Anime"}}
  ]'::jsonb,
  1,
  'published'
FROM public.museum_halls WHERE slug = 'legend-hall'
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_blocks = EXCLUDED.content_blocks;

INSERT INTO public.museum_exhibits (hall_id, slug, title, summary, content_blocks, sort_order, status)
SELECT 
  id,
  'muscimol-vs-ibotenic-science',
  'สองสารสำคัญใน Amanita Muscaria: Muscimol และ Ibotenic Acid',
  'เปรียบเทียบคุณสมบัติทางชีววิทยาและการออกฤทธิ์ระหว่าง Muscimol (Calm/Relax) และ Ibotenic Acid (Stimulation)',
  '[
    {"id": "c1", "type": "heading", "data": {"level": 2, "text": "มีอะไรอยู่ใน Amanita Muscaria?"}},
    {"id": "c2", "type": "text", "data": {"content": "เห็ดชนิดนี้ประกอบด้วยสารออกฤทธิ์ที่เกิดขึ้นตามธรรมชาติหลายชนิด โดยสารที่ถูกกล่าวถึงบ่อยที่สุดคือ Muscimol และ Ibotenic Acid ซึ่งมีคุณสมบัติตรงข้ามกันในหลายมิติ"}},
    {"id": "c3", "type": "text", "data": {"content": "• Muscimol (Calm, Relax, Dreamlike): สารที่เกี่ยวข้องกับความรู้สึกผ่อนคลาย สภาวะเคลิ้มหลับ การรับรู้เวลาที่เปลี่ยนไป และความฝันที่แจ่มชัด (Vivid Dreams)\n• Ibotenic Acid (Energy, Stimulation): สารที่ส่งผลต่อการตื่นตัวทางสรีรวิทยา และอาจทำให้เกิดอาการไม่สบายตัวในบางบุคคล"}},
    {"id": "c4", "type": "heading", "data": {"level": 3, "text": "กระบวนการ Decarboxylation"}},
    {"id": "c5", "type": "text", "data": {"content": "ดีคาร์บอกซิเลชันคือกระบวนการเปลี่ยนแปลงทางเคมี โดยเมื่อกรดอิโบเทนิก (Ibotenic Acid) ได้รับความร้อนและเวลาที่เหมาะสม โมเลกุลจะสูญเสียคาร์บอกซิลและเปลี่ยนสภาพกลายเป็นมัสซิโมล (Muscimol)"}},
    {"id": "c6", "type": "callout", "data": {"variant": "warning", "title": "ข้อควรทราบสำคัญ", "message": "ปริมาณสารอาจแตกต่างกันมากในแต่ละดอก และวิธีการแปรสภาพมีผลต่อสัดส่วนของสาร ข้อมูลนี้มีไว้เพื่อวัตถุประสงค์ทางการศึกษาทางพฤกษเคมีเท่านั้น"}}
  ]'::jsonb,
  1,
  'published'
FROM public.museum_halls WHERE slug = 'science-hall'
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_blocks = EXCLUDED.content_blocks;

-- F. ตัวอย่างพฤกษศาสตร์เกรดสะสม 4 รายการ (พร้อมราคาและตัวเลือกขนาด)
INSERT INTO public.products (slug, name, botanical_name, origin_region, description, price, hero_image_url, sort_order, status, variants)
VALUES 
(
  'amanita-dried-caps-grade-a',
  'ดอกเห็ด Amanita Muscaria อบแห้งคัดพิเศษ (Closed Cap Specimen)',
  'Amanita Muscaria (L.) Lam. Specimen',
  'ป่าสนบนภูเขาสูงทางตอนเหนือ และตัวอย่างนำเข้ายุโรปคัดเกรด',
  'ตัวอย่างดอกเห็ดอบแห้งทั้งดอกระยะหมวกตูม ควบคุมอุณหภูมิ 40°C เพื่อคงสภาพโครงสร้างทางสัณฐานวิทยา สีแดงสดตามธรรมชาติ และเกล็ดสีขาวอย่างสมบูรณ์ เหมาะสำหรับพิพิธภัณฑ์ คลังสะสมทางพฤกษศาสตร์ และการศึกษาทางชีววิทยา',
  590,
  'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop',
  1,
  'published',
  '[
    {"size": "3g", "price": 390, "in_stock": true, "note": "ตัวอย่างขนาดสังเกตผลเบื้องต้น (Intensity 2/5)"},
    {"size": "5g", "price": 590, "in_stock": true, "note": "ตัวอย่างมาตรฐานพฤกษศาสตร์ (Intensity 3/5)"},
    {"size": "10g", "price": 990, "in_stock": true, "note": "ตัวอย่างเกรดสะสมเข้มข้น (Intensity 4/5)"},
    {"size": "15g", "price": 1450, "in_stock": true, "note": "ตัวอย่างดอกสมบูรณ์เกรดสูง (Intensity 5/5)"}
  ]'::jsonb
),
(
  'amanita-open-cap-specimen',
  'ดอกเห็ด Amanita Muscaria หมวกเปิดสมบูรณ์ (Open Cap Specimen)',
  'Amanita Muscaria var. Guessowii',
  'เขตป่าเบิร์ชแถบซับอัลไพน์',
  'ตัวอย่างสัณฐานวิทยาดอกบานเต็มที่ เผยให้เห็นครีบใต้หมวก (Gills) และวงแหวนบนก้าน (Annulus) อย่างประณีต นิยมนำไปจัดแสดงในตู้โชว์พิพิธภัณฑ์ธรรมชาติวิทยา',
  690,
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  2,
  'published',
  '[
    {"size": "5g", "price": 690, "in_stock": true, "note": "ตัวอย่างดอกบานเกรดพรีเมียม"},
    {"size": "10g", "price": 1190, "in_stock": true, "note": "ชุดคู่ดอกบานและหมวกตูม"}
  ]'::jsonb
),
(
  'amanita-crushed-herbarium',
  'ตัวอย่างเกล็ดเห็ดบดสำหรับศึกษาใต้กล้องจุลทรรศน์ (Lab Crushed)',
  'Amanita Muscaria var. Formosa',
  'Highland Coniferous Forests',
  'ชิ้นส่วนหมวกเห็ดบดหยาบเกรดห้องปฏิบัติการ สำหรับการเตรียมสไลด์ตัวอย่างพฤกษศาสตร์และการสกัดรงควัตถุธรรมชาติ Muscaflavin เพื่อการวิจัยทางเคมีชีววิทยา',
  450,
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
  3,
  'published',
  '[
    {"size": "5g", "price": 450, "in_stock": true, "note": "เกล็ดบดหยาบ 1-2mm"},
    {"size": "10g", "price": 790, "in_stock": true, "note": "ชุดหลอดทดลองคู่"}
  ]'::jsonb
),
(
  'amanita-resin-display-cube',
  'ตัวอย่างดอกเห็ดสตาฟแห้งในบล็อกเรซินใส (Botanical Resin Cube)',
  'Amanita Muscaria Encased in Optical Resin',
  'Chiang Mai Botanical Workshop',
  'ชิ้นงานตัวอย่างพฤกษศาสตร์ถาวร หล่อขึ้นรูปในบล็อกเรซินใสพิเศษความโปร่งแสงสูง ป้องกันความชื้นและอากาศคงสภาพสีสันและโครงสร้างได้ยาวนานหลายสิบปี',
  1890,
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
  4,
  'published',
  '[
    {"size": "Cube 6cm", "price": 1890, "in_stock": true, "note": "บล็อกเรซินขนาด 6x6x6 cm พร้อมฐานไม้แท้"}
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  botanical_name = EXCLUDED.botanical_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  hero_image_url = EXCLUDED.hero_image_url,
  sort_order = EXCLUDED.sort_order,
  variants = EXCLUDED.variants;

-- G. บทความวิชาการจริง 3 บทความ
INSERT INTO public.articles (slug, title, excerpt, featured_image_url, reading_time_minutes, tags, content_blocks, status)
VALUES 
(
  'muscimol-and-ibotenic-acid-guide',
  'สองสารสำคัญใน Amanita Muscaria: Muscimol และ Ibotenic Acid',
  'เจาะลึกความแตกต่างระหว่างสารแห่งความผ่อนคลาย (Calm/Dreamlike) และสารกระตุ้น (Stimulation) พร้อมปฏิกิริยา Decarboxylation',
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
  5,
  ARRAY['วิทยาศาสตร์', 'ชีวเคมี', 'ระบบประสาท'],
  '[
    {"id": "a1", "type": "heading", "data": {"level": 2, "text": "กลไกทางเคมีของ Muscimol และ Ibotenic Acid"}},
    {"id": "a2", "type": "text", "data": {"content": "สารประกอบสองชนิดนี้พบได้ตามธรรมชาติในดอกเห็ด Amanita Muscaria โดย Muscimol จัดเป็น GABA-A Receptor Agonist ที่ช่วยให้ระบบประสาทเข้าสู่โหมดผ่อนคลาย สงบ และฝันแจ่มชัด ขณะที่ Ibotenic Acid เป็นสารตั้งต้นที่มีฤทธิ์กระตุ้นระบบประสาท"}},
    {"id": "a3", "type": "quote", "data": {"quote": "ปฏิกิริยา Decarboxylation คือกุญแจสำคัญที่เปลี่ยนสภาพ Ibotenic Acid ไปเป็น Muscimol โดยอาศัยความร้อนและเวลา", "author": "รายงานวิจัยทางพฤกษเคมี"}},
    {"id": "a4", "type": "callout", "data": {"variant": "warning", "title": "ข้อควรทราบทางวิชาการ", "message": "สารทั้งสองชนิดมีสัดส่วนแปรผันตามแหล่งกำเนิดและอายุของดอกเห็ด การศึกษาทางวิทยาศาสตร์จำเป็นต้องควบคุมอุณหภูมิอย่างเข้มงวด"}}
  ]'::jsonb,
  'published'
),
(
  'amanita-vs-psilocybin-neuroscience',
  'Amanita Muscaria VS Psilocybin: สองสิ่งนี้ไม่เหมือนกันอย่างไร?',
  'บทวิเคราะห์ความแตกต่างระดับตัวรับประสาท GABA-A กับ Serotonin 5-HT2A และทำลายความเชื่อผิดๆ เกี่ยวกับเห็ด',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  6,
  ARRAY['มานุษยวิทยา', 'ประสาทวิทยา', 'ข้อเท็จจริง'],
  '[
    {"id": "a1", "type": "heading", "data": {"level": 2, "text": "เคมีและกลไกทางประสาทวิทยาที่แตกต่างอย่างสิ้นเชิง"}},
    {"id": "a2", "type": "text", "data": {"content": "แม้ภายนอกอาจถูกเรียกว่าเห็ดเหมือนกัน แต่กลไกชีวเคมีภายในร่างกายทำงานคนละระบบอย่างสิ้นเชิง Amanita ทำงานกับระบบ GABA ซึ่งควบคุมความสงบและการนอนหลับ ส่วน Psilocybin ทำงานกับระบบ Serotonin 5-HT2A ซึ่งควบคุมอารมณ์และการมองเห็น"}},
    {"id": "a3", "type": "callout", "data": {"variant": "info", "title": "Myth vs Fact", "message": "ไม่ควรนำประสบการณ์หรือการคาดเดาจากสารกลุ่มหนึ่งไปเทียบกับอีกกลุ่มหนึ่ง"}}
  ]'::jsonb,
  'published'
),
(
  'siberian-shaman-mythology-and-santa',
  'ตำนานหมอผีไซบีเรียและเส้นทางแห่งเห็ดแดงในประวัติศาสตร์โลก',
  'ย้อนรอยความเชื่อของชนเผ่าคอร์ยัค ชนเผ่าเอเวนคี อีกายักษ์ และจุดกำเนิดของสัญลักษณ์ซานตาคลอส',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
  6,
  ARRAY['ประวัติศาสตร์', 'คติชนวิทยา', 'ไซบีเรีย'],
  '[
    {"id": "a1", "type": "heading", "data": {"level": 2, "text": "ความเชื่อดั้งเดิมใต้แสงเหนือแห่งไซบีเรีย"}},
    {"id": "a2", "type": "text", "data": {"content": "ในดินแดนที่หนาวเย็นที่สุดในโลก หมอผีทำหน้าที่เป็นสื่อกลางระหว่างมนุษย์และวิญญาณแห่งธรรมชาติ สีแดงและขาวของเห็ดที่เติบโตใต้ต้นสนกลายเป็นแรงบันดาลใจในนิทานพื้นบ้าน กวางเรนเดียร์ และการเดินทางข้ามภพภูมิ"}},
    {"id": "a3", "type": "quote", "data": {"quote": "จากพิธีกรรมโบราณ สู่เทพนิยายวิกตอเรีย และกลายเป็นสัญลักษณ์สากลในวรรณกรรมแฟนตาซีปัจจุบัน", "author": "เส้นทางแห่งตำนาน Amanita"}}
  ]'::jsonb,
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  featured_image_url = EXCLUDED.featured_image_url,
  content_blocks = EXCLUDED.content_blocks;

-- H. ตัวอย่างคำสั่งซื้อเริ่มต้น (Orders Seed พร้อม LINE ID และสถานะการชำระเงิน)
INSERT INTO public.orders (order_number, customer_name, customer_phone, customer_email, customer_line_id, shipping_address, product_name, variant_size, quantity, total_price, slip_url, status)
VALUES 
(
  'AMN-SEED-8001',
  'คุณวิชัย เจริญกิจ',
  '0812345678',
  'wichai@example.com',
  'wichai_amanita',
  '123/45 ซอยสุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  'ดอกเห็ด Amanita Muscaria อบแห้งคัดพิเศษ (Closed Cap Specimen)',
  '5g',
  1,
  590,
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800',
  'paid'
),
(
  'AMN-SEED-8002',
  'คุณสมชาย มุ่งมั่น',
  '0899887766',
  'somchai.m@gmail.com',
  'somchai_line99',
  '88/9 หมู่ 2 ตำบลแม่ริม อำเภอแม่ริม จังหวัดเชียงใหม่ 50180',
  'ดอกเห็ด Amanita Muscaria หมวกเปิดสมบูรณ์ (Open Cap Specimen)',
  '5g',
  1,
  690,
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800',
  'pending'
)
ON CONFLICT (order_number) DO NOTHING;

-- I. กิจกรรมสถิติสำหรับ Dashboard
INSERT INTO public.analytics_events (event_type, resource_id, session_id, created_at)
VALUES 
    ('page_view', '/', 'sess_seed_01', NOW() - INTERVAL '6 days'),
    ('page_view', '/museum', 'sess_seed_01', NOW() - INTERVAL '6 days'),
    ('museum_entry', 'portal_mushroom', 'sess_seed_01', NOW() - INTERVAL '6 days'),
    ('hall_open', '/museum/legend-hall', 'sess_seed_01', NOW() - INTERVAL '6 days'),
    ('page_view', '/products', 'sess_seed_02', NOW() - INTERVAL '5 days'),
    ('order_submit', 'AMN-SEED-8001', 'sess_seed_02', NOW() - INTERVAL '5 days'),
    ('page_view', '/products', 'sess_seed_03', NOW() - INTERVAL '2 days'),
    ('order_submit', 'AMN-SEED-8002', 'sess_seed_03', NOW() - INTERVAL '2 days');
