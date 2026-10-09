'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  BookOpen, 
  Package, 
  Image as ImageIcon, 
  Sliders, 
  BellRing, 
  ArrowLeft, 
  LogOut,
  Menu,
  X,
  Type,
  ShoppingBag,
  PhoneCall
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email || 'Admin');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // If on login page, render clean without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navLinks = [
    { label: 'แดชบอร์ดสถิติ', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'คำสั่งซื้อ & สลิป', href: '/admin/orders', icon: ShoppingBag },
    { label: 'ช่องทางติดต่อ & พร้อมเพย์', href: '/admin/contact', icon: PhoneCall },
    { label: 'แก้ไขหัวข้อหลักเว็บ', href: '/admin/site-content', icon: Type },
    { label: 'จัดการห้องจัดแสดง', href: '/admin/museum', icon: Layers },
    { label: 'จัดการบทความ', href: '/admin/articles', icon: BookOpen },
    { label: 'ตัวอย่างพฤกษศาสตร์', href: '/admin/products', icon: Package },
    { label: 'Tracking Pixels', href: '/admin/pixels', icon: Sliders },
    { label: 'แจ้งเตือนผ่าน LINE', href: '/admin/line-notify', icon: BellRing },
    { label: 'คลังสื่อ (Media)', href: '/admin/media', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-obsidian-950 text-mushroomWhite flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-obsidian-900 sticky top-0 z-30">
        <div>
          <span className="text-xs font-mono uppercase text-amberGold-400 font-bold block">Amanita Thailand</span>
          <span className="text-sm font-serif font-bold text-mushroomWhite">CMS Admin</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-lg border border-neutral-800 text-neutral-300"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Sheet */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-800 bg-obsidian-900/95 p-6 flex flex-col justify-between shrink-0 transition-transform duration-300 md:static md:translate-x-0
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="mb-8 hidden md:block">
            <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400 block font-bold">
              Amanita Thailand
            </span>
            <span className="text-base font-serif font-bold text-mushroomWhite block">CMS & Analytics Portal</span>
            {userEmail && (
              <span className="text-[11px] text-emerald-400 font-mono block mt-1">● {userEmail}</span>
            )}
          </div>

          <nav className="space-y-1 text-sm font-sans">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                    isActive 
                      ? 'bg-crimson-900/80 text-amberGold-200 border border-amberGold-500/40 shadow-md font-semibold' 
                      : 'hover:bg-crimson-950/40 text-neutral-300 hover:text-amberGold-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amberGold-400' : 'text-neutral-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-800 space-y-3">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-amberGold-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับไปหน้าพิพิธภัณฑ์ 3D
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-crimson-950 text-neutral-400 hover:text-crimson-300 text-xs transition border border-neutral-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ (Sign Out)
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
