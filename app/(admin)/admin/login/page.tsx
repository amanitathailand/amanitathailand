'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-crimson-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amberGold-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-crimson-900/60 bg-obsidian-900/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full border border-amberGold-500/50 bg-crimson-950 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Sparkles className="w-6 h-6 text-amberGold-400" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400 font-bold block">
            Amanita Thailand Platform
          </span>
          <h1 className="text-2xl font-serif font-bold text-mushroomWhite mt-1">
            เข้าสู่ระบบผู้ดูแล (Admin CMS)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            เชื่อมต่อกับ Supabase Database จริง
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl border border-crimson-800 bg-crimson-950/60 text-crimson-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-neutral-300 block mb-1.5">อีเมล (Admin Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@amanitathailand.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-neutral-300 block mb-1.5">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-mushroomWhite focus:outline-none focus:border-amberGold-500 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite font-serif text-sm font-semibold tracking-wide transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-neutral-500 hover:text-amberGold-400 font-mono transition">
            ← กลับสู่หน้าหลักพิพิธภัณฑ์ 3D
          </Link>
        </div>
      </div>
    </div>
  );
}
