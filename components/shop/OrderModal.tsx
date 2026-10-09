'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, Order } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getPromptPayQrImageUrl } from '@/lib/utils/promptpay';
import { safeLocalStorageGet } from '@/lib/utils/storage';
import { 
  X, 
  ShoppingBag, 
  QrCode, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  CreditCard, 
  Truck, 
  Phone, 
  MapPin, 
  User, 
  Mail, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface OrderModalProps {
  product: Product;
  onClose: () => void;
  promptpayNumber?: string;
  promptpayName?: string;
  promptpayBank?: string;
}

export function OrderModal({
  product,
  onClose,
  promptpayNumber = '0909964514',
  promptpayName = 'นายวันชนะ',
  promptpayBank = 'ธนาคารกสิกรไทย (K-Bank)',
}: OrderModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants?.[0] || { size: '5g', price: product.price || 590, in_stock: true }
  );
  const [quantity, setQuantity] = useState(1);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerLineId, setCustomerLineId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Slip Upload State
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [copiedPromptpay, setCopiedPromptpay] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notificationWarning, setNotificationWarning] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showOrderConfirmModal, setShowOrderConfirmModal] = useState(false);
  const [activePromptpayNumber, setActivePromptpayNumber] = useState(promptpayNumber);
  const [activePromptpayName, setActivePromptpayName] = useState(promptpayName);
  const [activePromptpayBank, setActivePromptpayBank] = useState(promptpayBank);

  useEffect(() => {
    const cached = safeLocalStorageGet<any>('amanita_contact_settings');
    if (cached) {
      if (cached.promptpay_number) setActivePromptpayNumber(cached.promptpay_number);
      if (cached.promptpay_name) setActivePromptpayName(cached.promptpay_name);
      if (cached.promptpay_bank) setActivePromptpayBank(cached.promptpay_bank);
    }

    const fetchFreshPromptPay = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          if (json.contact?.promptpay_number) {
            setActivePromptpayNumber(json.contact.promptpay_number);
            if (json.contact.promptpay_name) setActivePromptpayName(json.contact.promptpay_name);
            if (json.contact.promptpay_bank) setActivePromptpayBank(json.contact.promptpay_bank);
          }
        }
      } catch (err) {
        console.warn('Fetch live promptpay notice:', err);
      }
    };
    fetchFreshPromptPay();
  }, []);

  const supabase = createClient();
  const totalPrice = (selectedVariant.price || product.price || 590) * quantity;
  const qrImageUrl = getPromptPayQrImageUrl(activePromptpayNumber, totalPrice);

  const handleCopyPromptpay = () => {
    navigator.clipboard.writeText(activePromptpayNumber);
    setCopiedPromptpay(true);
    setTimeout(() => setCopiedPromptpay(false), 2000);
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const url = URL.createObjectURL(file);
      setSlipPreview(url);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setErrorMsg('กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน');
      return;
    }

    if (!slipFile && !slipPreview) {
      setErrorMsg('กรุณาแนบภาพสลิปหลักฐานการโอนเงินผ่าน PromptPay ก่อนยืนยันคำสั่งซื้อ');
      return;
    }

    setErrorMsg(null);
    setShowOrderConfirmModal(true);
  };

  const executeFinalOrderSubmit = async () => {
    setShowOrderConfirmModal(false);
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const orderNumber = `AMN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      let publicSlipUrl = slipPreview || '';

      // 1. Upload Slip to Supabase Storage if file exists
      if (slipFile) {
        const fileExt = slipFile.name.split('.').pop() || 'jpg';
        const slipPath = `slips/slip_${orderNumber}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('museum-media').upload(slipPath, slipFile, {
          cacheControl: '3600',
          upsert: false
        });

        if (uploadError) {
          throw new Error('อัปโหลดสลิปไม่สำเร็จ กรุณาตรวจสอบไฟล์และลองใหม่อีกครั้ง');
        }

        const { data: urlData } = supabase.storage.from('museum-media').getPublicUrl(slipPath);
        publicSlipUrl = urlData.publicUrl;
      }

      // 2. Insert Order into Supabase
      const newOrderData: Partial<Order> = {
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_line_id: customerLineId.trim() || undefined,
        shipping_address: shippingAddress.trim(),
        product_id: product.id,
        product_name: product.name,
        variant_size: selectedVariant.size,
        quantity: quantity,
        total_price: totalPrice,
        slip_url: publicSlipUrl,
        status: 'pending',
        admin_note: customerNote.trim() || undefined,
        created_at: new Date().toISOString()
      };

      const { error: orderError } = await supabase.from('orders').insert([newOrderData]);
      if (orderError) {
        throw new Error(`บันทึกคำสั่งซื้อไม่สำเร็จ: ${orderError.message}`);
      }

      // 3. Send automated alert to LINE via API
      try {
        const notificationResponse = await fetch('/api/line-notify', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'order',
            orderNumber: orderNumber,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerLineId: customerLineId.trim() || undefined,
            productName: `${product.name} (${selectedVariant.size}) x${quantity}`,
            totalPrice: totalPrice,
            shippingAddress: shippingAddress.trim(),
            slipUrl: publicSlipUrl
          })
        });
        const notificationResult = await notificationResponse.json();
        if (!notificationResponse.ok || !notificationResult.success) {
          setNotificationWarning(notificationResult.error || 'ส่งแจ้งเตือน LINE ไม่สำเร็จ');
        }
      } catch (lineErr) {
        console.warn('LINE notification dispatch failed:', lineErr);
        setNotificationWarning('เชื่อมต่อ LINE เพื่อแจ้งเตือนไม่สำเร็จ');
      }

      setCompletedOrder({
        ...newOrderData,
        id: orderNumber,
      } as Order);

    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ: ' + (err.message || 'โปรดตรวจสอบการเชื่อมต่อ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-crimson-800/80 bg-obsidian-900 p-5 sm:p-8 shadow-2xl max-h-[92dvh] overflow-y-auto space-y-6 text-mushroomWhite">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-crimson-900 border border-amberGold-500/40 flex items-center justify-center text-amberGold-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amberGold-200">
                สั่งซื้อตัวอย่างพฤกษศาสตร์และแจ้งชำระเงิน
              </h2>
              <span className="text-[11px] text-neutral-400 font-mono">
                Direct PromptPay QR Checkout & Shipping Form
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {completedOrder ? (
          <div className="py-8 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-950/90 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                บันทึกคำสั่งซื้อและสลิปเรียบร้อยแล้ว
              </span>
              <h3 className="text-2xl font-serif font-bold text-mushroomWhite">
                ขอบพระคุณสำหรับการสั่งซื้อ
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                {notificationWarning
                  ? `บันทึกคำสั่งซื้อแล้ว แต่ยังส่งแจ้งเตือน LINE ไม่สำเร็จ (${notificationWarning}) ผู้ดูแลควรตรวจรายการในระบบ Orders`
                  : 'ส่งแจ้งเตือนไปยังผู้ดูแลทาง LINE แล้ว เจ้าหน้าที่จะตรวจสอบยอดโอนและดำเนินการจัดส่งต่อไป'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950 max-w-md mx-auto text-left text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">รหัสคำสั่งซื้อ:</span>
                <span className="text-amberGold-300 font-bold">{completedOrder.order_number}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">รายการสินค้า:</span>
                <span className="text-mushroomWhite text-right">{completedOrder.product_name} ({completedOrder.variant_size}) x{completedOrder.quantity}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">ยอดชำระสุทธิ:</span>
                <span className="text-emerald-400 font-bold text-sm">฿{completedOrder.total_price.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">ผู้รับพัสดุ:</span>
                <span className="text-neutral-200">{completedOrder.customer_name} ({completedOrder.customer_phone})</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-amberGold-600 hover:bg-amberGold-500 text-obsidian-950 font-serif font-bold text-xs transition shadow-lg"
            >
              ปิดหน้าต่างนี้
            </button>
          </div>
        ) : (
          /* Main Order & Checkout Form */
          <form onSubmit={handlePreSubmit} className="space-y-6 text-xs font-sans">
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-crimson-700 bg-crimson-950/80 text-crimson-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Product Summary & Variant Picker */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/70 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={product.hero_image_url}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-neutral-800 shrink-0"
                />
                <div>
                  <span className="text-[10px] font-mono text-amberGold-400 block">{product.botanical_name}</span>
                  <h3 className="text-sm font-serif font-bold text-mushroomWhite">{product.name}</h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold block mt-0.5">
                    ราคา: ฿{(selectedVariant.price || product.price || 590).toLocaleString()} บาท
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-neutral-400 font-mono text-xs">จำนวน:</span>
                <div className="flex items-center border border-neutral-700 rounded-lg bg-obsidian-900 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1 text-neutral-300 hover:bg-neutral-800"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 font-mono text-xs font-bold text-amberGold-300">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1 text-neutral-300 hover:bg-neutral-800"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Select Size / Variant */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-neutral-300 font-mono font-bold mb-2">
                  1. เลือกขนาดตัวอย่างพฤกษศาสตร์:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.size}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedVariant.size === v.size
                          ? 'border-amberGold-500 bg-amberGold-950/30 text-amberGold-200 shadow-md font-bold'
                          : 'border-neutral-800 bg-obsidian-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-xs block">{v.size}</span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold block mt-0.5">
                        ฿{v.price ? v.price.toLocaleString() : (product.price || 590).toLocaleString()}
                      </span>
                      {v.note && <span className="text-[9px] text-neutral-500 block truncate">{v.note}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Details & Shipping Address */}
            <div className="space-y-3 pt-2">
              <label className="block text-neutral-300 font-mono font-bold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amberGold-400" />
                <span>2. ข้อมูลติดต่อและที่อยู่จัดส่งพัสดุ:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-neutral-400 mb-1 font-mono text-[11px]">
                    <User className="w-3.5 h-3.5" />
                    <span>ชื่อ-นามสกุล ผู้รับพัสดุ *</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="เช่น คุณวันชนะ มีชัย"
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite focus:border-amberGold-400"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1 text-neutral-400 mb-1 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5" />
                    <span>เบอร์โทรศัพท์ติดต่อ *</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite font-mono focus:border-amberGold-400"
                  />
                </div>
              </div>

              {/* LINE ID Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-neutral-400 mb-1 font-mono text-[11px]">
                    <span className="text-[#06C755] font-bold">💬</span>
                    <span>LINE ID ผู้สั่งซื้อ (ถ้ามี เพื่อรับแจ้งเลขพัสดุ)</span>
                  </div>
                  <input
                    type="text"
                    value={customerLineId}
                    onChange={(e) => setCustomerLineId(e.target.value)}
                    placeholder="เช่น somchai_line หรือ @somchai"
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite font-mono focus:border-[#06C755]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1 text-neutral-400 mb-1 font-mono text-[11px]">
                    <Mail className="w-3.5 h-3.5" />
                    <span>อีเมลติดต่อ (ไม่บังคับ)</span>
                  </div>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="เช่น customer@example.com"
                    className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite focus:border-amberGold-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-neutral-400 mb-1 font-mono text-[11px]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>ที่อยู่จัดส่งครบถ้วน (บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์) *</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="เช่น 123/45 หมู่ 6 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200"
                  className="w-full p-2.5 rounded-xl bg-obsidian-950 border border-neutral-700 text-mushroomWhite focus:border-amberGold-400 resize-none leading-relaxed"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติมถึงผู้จัดส่ง (ถ้ามี)..."
                  className="w-full p-2 rounded-xl bg-obsidian-950 border border-neutral-800 text-neutral-300 text-xs"
                />
              </div>
            </div>

            {/* PromptPay QR Section with Real Calculated Amount */}
            <div className="p-5 rounded-2xl border border-amberGold-600/50 bg-obsidian-950 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amberGold-400" />
                  <span className="font-serif font-bold text-amberGold-200 text-sm">
                    3. สแกนชำระเงินผ่าน PromptPay QR ตามยอดจริง
                  </span>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  ยอดรวม: ฿{totalPrice.toLocaleString()} บาท
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                {/* Dynamic QR Code Image */}
                <div className="p-3 bg-white rounded-2xl shadow-2xl flex flex-col items-center shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="PromptPay QR Code"
                    className="w-48 h-48 object-contain"
                  />
                  <div className="text-[10px] text-neutral-800 font-mono font-bold mt-1 text-center">
                    พร้อมเพย์ยอดจริง: ฿{totalPrice.toLocaleString()}
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-2.5 text-xs font-mono text-neutral-300 w-full sm:w-auto">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">ชื่อบัญชีผู้รับเงิน:</span>
                    <span className="font-serif font-bold text-mushroomWhite text-sm">{activePromptpayName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">ธนาคาร:</span>
                    <span className="text-neutral-200">{activePromptpayBank}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">หมายเลขพร้อมเพย์:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-amberGold-300 text-sm tracking-wider">{activePromptpayNumber}</span>
                      <button
                        type="button"
                        onClick={handleCopyPromptpay}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 flex items-center gap-1 transition"
                      >
                        {copiedPromptpay ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPromptpay ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 text-[11px] text-amberGold-300/80 leading-relaxed font-sans">
                    💡 สแกนผ่านแอปธนาคารใดก็ได้ ยอดเงินจะถูกระบุอัตโนมัติ ฿{totalPrice.toLocaleString()} บาท
                  </div>
                </div>
              </div>
            </div>

            {/* Slip Upload & Attachment */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/70 space-y-3">
              <label className="block text-neutral-300 font-mono font-bold flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>4. แนบสลิปหลักฐานการโอนเงิน (Payment Slip) *</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  id="slip-upload-input"
                  accept="image/*"
                  required
                  onChange={handleSlipChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('slip-upload-input')?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-dashed border-amberGold-500/60 bg-crimson-950/40 hover:bg-crimson-900/60 text-amberGold-200 text-xs font-serif font-bold transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-amberGold-400" />
                  <span>{slipFile ? 'เปลี่ยนรูปภาพสลิป' : 'เลือกภาพสลิปจากอุปกรณ์ (Choose Slip)'}</span>
                </button>

                {slipFile && (
                  <span className="text-xs text-neutral-400 font-mono truncate max-w-xs">
                    {slipFile.name} ({(slipFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>

              {/* Slip Preview Thumbnail */}
              {slipPreview && (
                <div className="relative w-32 h-44 rounded-xl overflow-hidden border border-emerald-500/60 shadow-lg mt-2">
                  <img src={slipPreview} alt="Slip Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 inset-x-1 text-center bg-obsidian-950/80 text-[9px] text-emerald-300 font-mono rounded py-0.5">
                    สลิปพร้อมส่ง
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-crimson-800 to-amberGold-600 hover:from-crimson-700 hover:to-amberGold-500 text-white font-serif font-bold text-sm tracking-wide transition-all shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-amberGold-200" />
                <span>
                  {submitting ? 'กำลังส่งข้อมูลและอัปโหลดสลิป...' : `ยืนยันการสั่งซื้อและส่งหลักฐาน (฿${totalPrice.toLocaleString()})`}
                </span>
              </button>
            </div>
          </form>
        )}

      {/* Confirmation Modal to Prevent Misclick */}
      {showOrderConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-obsidian-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amberGold-500/10 text-amberGold-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-mushroomWhite">
                  ตรวจสอบคำสั่งซื้อก่อนส่งข้อมูล
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderConfirmModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-obsidian-950 p-4 rounded-2xl border border-neutral-800 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                <span className="text-neutral-400">รายการตัวอย่าง:</span>
                <span className="font-serif font-bold text-white text-sm">{product.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ขนาดตัวอย่าง & จำนวน:</span>
                <span className="font-mono font-bold text-amberGold-300">ขนาด {selectedVariant.size} ({quantity} ชิ้น)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ยอดชำระ PromptPay:</span>
                <span className="font-mono text-base font-bold text-emerald-400">฿{totalPrice.toLocaleString()} บาท</span>
              </div>
              <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">ผู้สั่ง:</span>
                  <span className="text-white font-medium">{customerName} (โทร: {customerPhone})</span>
                </div>
                {customerLineId && (
                  <div className="flex items-center justify-between text-[#06C755]">
                    <span>LINE ID:</span>
                    <span className="font-mono font-bold">{customerLineId}</span>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-neutral-400 block mb-0.5">ที่อยู่จัดส่ง:</span>
                  <p className="text-neutral-300 font-mono bg-obsidian-900 p-2 rounded-xl border border-neutral-800/80 leading-relaxed">
                    {shippingAddress}
                  </p>
                </div>
              </div>

              {slipPreview && (
                <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-3">
                  <div className="w-14 h-18 rounded-lg overflow-hidden border border-neutral-700 shrink-0">
                    <img src={slipPreview} alt="สลิป" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold block text-[11px]">✓ แนบสลิปโอนเงินเรียบร้อย</span>
                    <span className="text-[10px] text-neutral-400">ยอดเงินจะถูกตรวจสอบโดยผู้ดูแลระบบ</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
              เมื่อกดยืนยัน ข้อมูลคำสั่งซื้อและสลิปจะถูกบันทึกลงระบบ และแจ้งเตือนไปยังเจ้าหน้าที่เพื่อเริ่มจัดเตรียมพัสดุ
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowOrderConfirmModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                กลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={executeFinalOrderSubmit}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-obsidian-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'กำลังส่ง...' : 'ยืนยันส่งข้อมูลจริง'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
