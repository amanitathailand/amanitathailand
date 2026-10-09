# Amanita Thailand Digital Museum Platform

เว็บพิพิธภัณฑ์ดิจิทัลด้วย Next.js 15, React, TypeScript, Three.js และ Supabase ประกอบด้วยหน้า public, ระบบจัดการเนื้อหา Admin, แคตตาล็อก/คำสั่งซื้อ, analytics และ Media Library

> **สถานะ:** source ใน workspace นี้ได้รับการแก้ไขให้ Home อ่าน Site Content จากฐานข้อมูล, จัดการภาพ/โมเดล 3D ผ่าน Admin, แสดง Dashboard จากข้อมูลจริง และปรับการแจ้งเตือนเป็น LINE Messaging API แล้ว การแก้ใน working copy ไม่ได้ deploy ไป production อัตโนมัติ และยังต้องตั้งค่าความปลอดภัย/credentials ของระบบที่ deploy จริงก่อนเปิดใช้งาน
>
> การตรวจ Supabase read-only จากเครื่องนี้ถูกบล็อกด้วย `EACCES`; build ผ่านไม่ได้ยืนยันว่า environment ปัจจุบันเชื่อมฐานข้อมูล live ได้

## ความสามารถ

- หน้า Home มีฉาก Three.js/GLB และโหมดภาพถ่ายแบบ parallax; Site Content Admin สามารถเปลี่ยนข้อความหน้าแรก, โหมดเริ่มต้น, URL ภาพ และ URL โมเดล GLB ได้
- หน้า Museum, Products, Articles และ Contact อ่านข้อมูล/settings จาก Supabase; เนื้อหา Museum/Article ใช้ content blocks
- Admin ใช้ Supabase Auth สำหรับ login และมีหน้า CRUD สำหรับ halls/exhibits, products, articles, orders, contact/payment settings, site content, pixels, media และ LINE settings
- Dashboard นับ event จาก `analytics_events` จริง; query ล้มเหลวหรือหมดเวลาแสดงสถานะ error แทนตัวเลขตัวอย่าง
- Contact API ตอบว่าสำเร็จเมื่อ Supabase ยืนยันการบันทึก event แล้ว; สถานะส่ง LINE แสดงแยกจากสถานะบันทึกข้อความ
- LINE แจ้งเตือนใช้ Messaging API แบบ Push ไปยัง LINE User ID ของผู้ดูแลเท่านั้น ไม่มี Broadcast fallback

## เริ่มรันในเครื่อง

ต้องใช้ Node.js 20 หรือรุ่นที่รองรับ Next.js ที่ติดตั้งอยู่

```bash
npm install
# สร้าง .env.local จาก .env.example แล้วกำหนดค่า Supabase
npm run dev
```

- Public site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

Admin ไม่มี demo login; ใช้บัญชี Supabase Auth ที่ได้รับอนุญาตเท่านั้น

## Environment variables

ตั้งค่าใน `.env.local` สำหรับ local และตั้งค่าซ้ำใน Environment Variables ของ hosting provider สำหรับ deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` จำเป็นสำหรับ server-side LINE notifications ของคำสั่งซื้อ/แบบฟอร์มสาธารณะ ซึ่งต้องอ่าน token ที่ถูกป้องกันโดย RLS คีย์นี้ต้องอยู่บน server เท่านั้น ห้าม prefix ด้วย `NEXT_PUBLIC_`, ห้ามแสดงใน browser, log, screenshot หรือ commit ลง Git หากไม่ตั้งค่านี้ ระบบยังบันทึกข้อมูลที่ public RLS อนุญาตได้ แต่การแจ้งเตือน LINE จาก request สาธารณะจะถูกส่งกลับเป็นสถานะ unavailable และไม่แสดงว่าส่งสำเร็จ

## ฐานข้อมูล Supabase

สำหรับฐานข้อมูลใหม่ให้รัน migration ตามลำดับใน `supabase/migrations/`:

1. `001_init.sql` สร้าง schema, seed และ policy เริ่มต้น
2. `002_admin_persistence_and_rls.sql` ใช้แทน policy เดิมและกำหนด Storage policy ของ `museum-media`

การแก้ migration ในไฟล์ local ไม่ได้เปลี่ยนฐานข้อมูล remote เอง ให้สำรอง/ตรวจ project ที่เลือกก่อนรัน SQL และยืนยันผลจาก Supabase Dashboard ห้ามรัน migration กับ production โดยไม่ตรวจ project ให้ถูกต้อง

> **ข้อจำกัดด้านสิทธิ์ที่ยังต้องปิดก่อน production แบบมีผู้ใช้หลายประเภท:** migration 002 ใช้ role `authenticated` เป็นขอบเขตการเขียน/อ่านฝั่งผู้ดูแล ไม่ได้กำหนด custom admin role หรือ allowlist ในฐานข้อมูล ดังนั้นต้องจำกัดบัญชีที่สร้าง/คงอยู่ใน Supabase Auth ให้เป็นบัญชีผู้ดูแลเท่านั้น หรือเตรียม migration สำหรับ role claims โดยเฉพาะก่อนเปิด signup/มีผู้ใช้อื่นที่ไม่ใช่ผู้ดูแล

## หากบันทึกแจ้ง `statement timeout`

ข้อความ `canceling statement due to statement timeout` จาก Site Content หรือ Contact/PromptPay หมายถึง PostgreSQL ยกเลิกคำสั่งเขียนที่ใช้เวลานานเกินกำหนด ไม่ใช่หลักฐานว่าหน้าจอ cache ข้อมูลเก่า ใน source ปัจจุบันหน้า Admin จะปิดปุ่มบันทึกหลัง error และให้กด **รีเฟรช** เพื่ออ่านค่าจริงจาก Supabase ก่อนลองใหม่; ไม่มี auto-retry เพื่อป้องกันการส่งคำขอซ้ำ ตรวจ Supabase Dashboard → Logs/Database/Query Insights ณ เวลาที่เกิดเหตุ แล้วหา query `admin_settings` ที่ถูก cancel หรือรอ lock หากเกิดซ้ำต้องแก้สาเหตุฝั่งฐานข้อมูล/lock/load ไม่ควรเพิ่ม timeout โดยไม่ตรวจต้นเหตุ

## วิธีจัดการ Home/3D ผ่าน Admin

1. เข้า `/admin/media` แล้วอัปโหลดภาพหรือโมเดล `.glb` ไปยัง Supabase Storage
2. คัดลอก public URL ที่ได้จาก Media Library
3. เข้า `/admin/site-content` แล้วกำหนดโหมดเริ่มต้น, URL ภาพ, alt text/คำบรรยาย และ URL โมเดล GLB
4. กดบันทึก ระบบจะตรวจผล Supabase ก่อนแสดง success; เปิดหน้า Home ใหม่เพื่อโหลดค่าล่าสุด

สามารถใช้ `/models/amanita.glb` ที่รวมอยู่ใน `public/models` ได้เป็นค่าเริ่มต้น โมเดลบนโดเมนภายนอกต้องตั้ง CORS ให้ loader เข้าถึงได้

## การตั้งค่า LINE Messaging API

LINE Notify ยุติบริการเมื่อ **31 มีนาคม 2025** จึงไม่มีการตั้งค่า/ส่งผ่าน LINE Notify ในระบบนี้แล้ว ดูประกาศทางการได้ที่ [LINE Developers: LINE Notify service has been terminated](https://developers.line.biz/en/news/2025/04/01/line-notify/)

1. สร้าง/เลือก Messaging API channel ใน LINE Developers Console
2. กำหนด Channel Access Token และ LINE User ID ของผู้ดูแลใน `/admin/line-notify`
3. บันทึกก่อนกดส่งข้อความทดสอบ
4. ระบบส่ง Push ไปยังผู้ดูแลที่กำหนดเท่านั้น; ไม่ Broadcast ไปยังผู้ติดตาม

หน้า Admin ไม่ดึง Channel Access Token เดิมกลับไปยัง browser; เว้น input ว่างเพื่อเก็บค่าที่บันทึกไว้ หรือใช้ checkbox ลบ token อย่างชัดเจน

## ตรวจคุณภาพก่อนส่งมอบ

```bash
npx tsc --noEmit
npm run build
```

`npm run lint` ใน workspace ปัจจุบันยังไม่พร้อมสำหรับ CI: คำสั่งเปิด ESLint setup prompt เพราะไม่มี `eslint`, `eslint-config-next` และ config ที่จำเป็น อย่าถือว่าคำสั่ง lint ผ่าน; TypeScript check และ production build แยกกันและผ่านในรอบแก้ล่าสุด

## ขั้นตอนก่อน deploy

1. ตั้ง Environment Variables ครบใน hosting provider รวม `SUPABASE_SERVICE_ROLE_KEY` ฝั่ง server
2. ใช้ Supabase project และ URL ที่ถูกต้อง; ตรวจ migration/RLS และจำกัดบัญชี Auth เป็นผู้ดูแลตามข้อจำกัดด้านบน
3. รัน TypeScript check และ production build
4. deploy ผ่าน workflow ของเจ้าของเว็บไซต์ และตรวจหน้า Home, Admin login, CRUD, Storage, form submission และ LINE test บน URL จริง

ขณะนี้ workspace เป็น local working copy ไม่มี `.git`, Vercel link หรือ Manus WebDev declaration จึงไม่มีการ deploy/publish จากคำสั่งแก้ source ในเครื่อง และยังยืนยันสถานะ live domain ไม่ได้
# amanitathailand
