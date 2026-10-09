import React from 'react';
import { getPublicSettings } from '@/lib/data/getPublicSettings';
import ContactClient from './ContactClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'ติดต่อผู้ดูแลและภัณฑารักษ์พิพิธภัณฑ์ | Amanita Thailand',
  description: 'ช่องทางติดต่อและข้อมูลการสนับสนุน Amanita Thailand Digital Museum',
};

export default async function ContactPage() {
  try {
    const { contact } = await getPublicSettings();
    return <ContactClient initialSettings={contact} />;
  } catch (error) {
    console.error('Contact server settings query failed:', error);
    return (
      <div className="min-h-[100dvh] pt-32 px-4 flex items-start justify-center text-center">
        <p className="rounded-2xl border border-[#d90429]/30 bg-white px-5 py-4 text-sm text-[#2b2d42] shadow-sm">
          ไม่สามารถอ่านข้อมูลติดต่อปัจจุบันจากฐานข้อมูลได้ กรุณารีเฟรชหน้าเว็บอีกครั้ง
        </p>
      </div>
    );
  }
}
