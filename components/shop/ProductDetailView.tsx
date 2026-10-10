'use client';

import React, { useState } from 'react';
import { Product, SiteContentSettings } from '@/types';
import { OrderModal } from '@/components/shop/OrderModal';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, ShoppingBag, ShieldAlert, QrCode, ExternalLink } from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  siteContent: SiteContentSettings;
}

export function ProductDetailView({ product, siteContent }: ProductDetailViewProps) {
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  const promptpayNumber = siteContent.promptpay_number || '0909964514';
  const promptpayName = siteContent.promptpay_name || 'นายวันชนะ';
  const promptpayBank = siteContent.promptpay_bank || 'ธนาคารกสิกรไทย (K-Bank)';

  return (
    <div>
      <Link 
        href="/products" 
        className="btn-link inline-flex items-center gap-2 text-xs mb-8 font-mono"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับไปยังคลังตัวอย่างทางพฤกษศาสตร์
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-[#8d99ae]/55 shadow-[0_12px_30px_rgba(43,45,66,0.12)]">
        <div className="relative rounded-2xl overflow-hidden bg-neutral-900 h-96">
          <img 
            src={product.hero_image_url} 
            alt={product.name}
                className="w-full h-full object-cover"
          />
          {product.shopee_url && (
            <div className="absolute top-4 right-4 bg-[#EE4D2D] text-white px-3.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl">
              <ShoppingBag className="w-4 h-4" />
              <span>สั่งซื้อผ่าน Shopee ได้</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-mono text-amberGold-400 uppercase tracking-widest block mb-1">
              {product.botanical_name}
            </span>
            <h1 className="text-3xl font-serif font-bold text-mushroomWhite mb-3">
              {product.name}
            </h1>
            <p className="text-neutral-400 text-xs font-mono mb-4">
              ถิ่นกำเนิด: {product.origin_region}
            </p>
            <p className="text-neutral-300 text-sm leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Variants */}
            <div className="space-y-2 mb-6">
              <span className="text-xs font-mono text-neutral-400 block font-bold">
                ขนาดตัวอย่างและราคาจำหน่าย:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {product.variants?.map((v, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-xl border border-neutral-800 bg-obsidian-900 text-xs font-mono text-neutral-200 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amberGold-300">{v.size}</span>
                      <span className="text-[#d90429] font-bold">฿{v.price ? v.price.toLocaleString() : (product.price || 590).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-neutral-800">
            <div className="p-4 rounded-xl border border-amberGold-900/40 bg-amberGold-950/10 text-amberGold-300/80 text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amberGold-400 shrink-0 mt-0.5" />
              <span>{product.disclaimer}</span>
            </div>

            {/* Direct Order Button */}
            <button
              onClick={() => setIsOrderOpen(true)}
              className="btn-primary w-full py-3.5 rounded-xl font-serif font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>สั่งซื้อทันที (สแกน PromptPay QR ยอดจริง & แนบสลิป)</span>
            </button>

            {/* Shopee & LINE Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.shopee_url && (
                <a
                  href={product.shopee_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-shopee flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>สั่งซื้อผ่าน Shopee</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              <a
                href={product.line_oa_url}
                target="_blank"
                rel="noreferrer"
                className="btn-line flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>สอบถาม LINE OA</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {isOrderOpen && (
        <OrderModal
          product={product}
          onClose={() => setIsOrderOpen(false)}
          promptpayNumber={promptpayNumber}
          promptpayName={promptpayName}
          promptpayBank={promptpayBank}
        />
      )}
    </div>
  );
}
