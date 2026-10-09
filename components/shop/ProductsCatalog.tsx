'use client';

import React, { useState } from 'react';
import { Product, SiteContentSettings } from '@/types';
import { OrderModal } from '@/components/shop/OrderModal';
import Link from 'next/link';
import { 
  ShoppingBag, 
  MessageCircle, 
  ArrowRight, 
  Sparkles, 
  QrCode, 
  CreditCard,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ProductsCatalogProps {
  products: Product[];
  siteContent: SiteContentSettings;
}

export function ProductsCatalog({ products, siteContent }: ProductsCatalogProps) {
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);

  const promptpayNumber = siteContent.promptpay_number || '0909964514';
  const promptpayName = siteContent.promptpay_name || 'นายวันชนะ';
  const promptpayBank = siteContent.promptpay_bank || 'ธนาคารกสิกรไทย (K-Bank)';

  return (
    <div>
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((prod: Product) => {
          const startingPrice = prod.variants?.[0]?.price || prod.price || 390;

          return (
            <div 
              key={prod.id}
              className="rounded-3xl border border-crimson-950/80 bg-obsidian-950/70 overflow-hidden shadow-2xl flex flex-col justify-between hover:border-amberGold-500/60 transition-all duration-300"
            >
              {/* Product Hero Image */}
              <div className="relative h-72 overflow-hidden bg-neutral-900">
                <img 
                  src={prod.hero_image_url || 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop'} 
                  alt={prod.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                
                {/* Botanical Badge */}
                <div className="absolute top-4 left-4 bg-obsidian-950/90 border border-amberGold-500/40 px-3 py-1 rounded-full text-[11px] font-mono text-amberGold-300 backdrop-blur-md shadow-lg">
                  {prod.botanical_name}
                </div>

                {/* Price Tag Badge */}
                <div className="absolute bottom-4 right-4 bg-crimson-950/90 border border-amberGold-500/60 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-amberGold-300 shadow-xl backdrop-blur-md">
                  เริ่มต้น ฿{startingPrice.toLocaleString()}.-
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block mb-1">
                    แหล่งกำเนิด: {prod.origin_region}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-mushroomWhite mb-2">
                    {prod.name}
                  </h2>
                  <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-4">
                    {prod.description}
                  </p>

                  {/* Variants with Prices */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-mono text-neutral-400 block font-bold">
                      ขนาดตัวอย่างและราคา:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {prod.variants?.map((v, i) => (
                        <div 
                          key={i} 
                          className="px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/70 text-xs font-mono text-neutral-200 flex items-center gap-1.5"
                        >
                          <span className="text-amberGold-400 font-bold">{v.size}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">฿{v.price ? v.price.toLocaleString() : startingPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Instant Order with Slip, Shopee, and LINE */}
                <div className="pt-4 border-t border-neutral-800/80 space-y-2.5">
                  {/* Primary Direct Order Button (PromptPay QR + Slip) */}
                  <button
                    onClick={() => setSelectedProductForOrder(prod)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amberGold-600 to-amberGold-500 hover:from-amberGold-500 hover:to-amberGold-400 text-obsidian-950 text-xs font-serif font-bold transition shadow-xl"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>สั่งซื้อทันที (สแกน PromptPay QR & แนบสลิป)</span>
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Shopee Button */}
                    {prod.shopee_url ? (
                      <a
                        href={prod.shopee_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#EE4D2D] hover:bg-[#d63d1e] text-white font-mono font-bold transition shadow-md"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>สั่งผ่าน Shopee</span>
                      </a>
                    ) : (
                      <div />
                    )}

                    {/* LINE OA Button */}
                    <a
                      href={prod.line_oa_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#06C755]/50 bg-[#06C755]/15 text-emerald-300 hover:bg-[#06C755]/30 font-mono font-semibold transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>สอบถาม LINE</span>
                    </a>

                    {/* Details Link */}
                    <Link
                      href={`/products/${prod.slug}`}
                      className="p-2 text-neutral-400 hover:text-amberGold-300 transition"
                      title="ดูรายละเอียดเชิงลึก"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout & PromptPay Slip Upload Modal */}
      {selectedProductForOrder && (
        <OrderModal
          product={selectedProductForOrder}
          onClose={() => setSelectedProductForOrder(null)}
          promptpayNumber={promptpayNumber}
          promptpayName={promptpayName}
          promptpayBank={promptpayBank}
        />
      )}
    </div>
  );
}
