'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  ExternalLink, 
  Eye, 
  Trash2, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const supabase = createClient();

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      setOrders([]);
      showToast('error', `โหลดคำสั่งซื้อจาก Supabase ไม่สำเร็จ: ${err.message || 'ตรวจสอบสิทธิ์และการเชื่อมต่อ'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id, status')
        .maybeSingle();

      if (error) {
        showToast('error', `อัปเดตไม่สำเร็จ: ${error.message}`);
        return;
      }
      if (!data) {
        showToast('error', 'Supabase ไม่พบคำสั่งซื้อนี้ จึงไม่ได้เปลี่ยนสถานะ');
        await fetchOrders();
        return;
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      showToast('success', `อัปเดตสถานะเป็น "${getStatusBadge(newStatus).text}" สำเร็จแล้ว`);
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกสถานะ');
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const target = orderToDelete;
    setOrderToDelete(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', target.id)
        .select('id');

      if (error) {
        showToast('error', `ลบไม่สำเร็จ: ${error.message}`);
        return;
      }
      if (!data?.length) {
        showToast('error', 'Supabase ไม่พบคำสั่งซื้อที่ต้องการลบ');
        await fetchOrders();
        return;
      }

      setOrders(prev => prev.filter(o => o.id !== target.id));
      if (selectedOrder?.id === target.id) setSelectedOrder(null);
      showToast('success', `ลบคำสั่งซื้อ ${target.order_number} เรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ');
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return { text: 'ชำระเงินแล้ว', bg: 'bg-emerald-950/60 border-emerald-800 text-emerald-300', icon: CheckCircle2 };
      case 'shipped':
        return { text: 'จัดส่งแล้ว', bg: 'bg-blue-950/60 border-blue-800 text-blue-300', icon: Truck };
      case 'cancelled':
        return { text: 'ยกเลิก', bg: 'bg-neutral-900 border-neutral-700 text-neutral-400', icon: XCircle };
      default:
        return { text: 'รอตรวจสอบสลิป', bg: 'bg-amber-950/60 border-amber-800 text-amber-300', icon: Clock };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm) ||
      order.customer_line_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter(o => o.status === 'paid' || o.status === 'shipped')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-2xl animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200' 
            : 'bg-crimson-950/90 border-crimson-700 text-crimson-200'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amberGold-400 font-bold block">
            Amanita E-Commerce CMS
          </span>
          <h1 className="text-2xl font-serif font-bold text-mushroomWhite">
            จัดการคำสั่งซื้อ & ตรวจสอบสลิป (Orders)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            ดูข้อมูลที่อยู่จัดส่ง, LINE ID ลูกค้าสำหรับติดต่อกลับ, สลิปโอนเงิน PromptPay พร้อมปรับสถานะ
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-neutral-700 bg-obsidian-900 hover:border-amberGold-500 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-neutral-800 bg-obsidian-900/60">
          <span className="text-xs text-neutral-400 block">คำสั่งซื้อทั้งหมด</span>
          <span className="text-2xl font-bold font-mono text-mushroomWhite mt-1 block">
            {orders.length}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20">
          <span className="text-xs text-amber-400 block">รอตรวจสอบสลิป</span>
          <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block">
            {pendingCount}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20">
          <span className="text-xs text-emerald-400 block">ชำระแล้ว / รอจัดส่ง</span>
          <span className="text-2xl font-bold font-mono text-emerald-300 mt-1 block">
            {paidCount}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-amberGold-900/40 bg-obsidian-900/80">
          <span className="text-xs text-amberGold-400 block">ยอดรวมชำระแล้ว</span>
          <span className="text-2xl font-bold font-mono text-amberGold-300 mt-1 block">
            ฿{totalRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาด้วย เลขออเดอร์, ชื่อลูกค้า, เบอร์โทร, LINE ID หรือชื่อสินค้า..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-obsidian-900 border border-neutral-800 text-xs text-mushroomWhite focus:border-amberGold-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'pending', label: 'รอตรวจสลิป' },
            { id: 'paid', label: 'ชำระแล้ว' },
            { id: 'shipped', label: 'จัดส่งแล้ว' },
            { id: 'cancelled', label: 'ยกเลิก' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border transition ${
                statusFilter === f.id
                  ? 'border-amberGold-500 bg-amberGold-500/10 text-amberGold-300 font-semibold'
                  : 'border-neutral-800 bg-obsidian-900 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-neutral-800 rounded-2xl bg-obsidian-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-obsidian-950/80 border-b border-neutral-800 text-neutral-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-3.5">รหัสคำสั่งซื้อ</th>
                <th className="p-3.5">ผู้สั่งซื้อ & ข้อมูลติดต่อ</th>
                <th className="p-3.5">สินค้า / ขนาด</th>
                <th className="p-3.5">ยอดเงิน</th>
                <th className="p-3.5">สลิป</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการคำสั่งซื้อตามเงื่อนไข'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const statusInfo = getStatusBadge(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={order.id} className="hover:bg-obsidian-800/40 transition">
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-amberGold-300 block">
                          {order.order_number}
                        </span>
                        <span className="text-[11px] text-neutral-500 block">
                          {new Date(order.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-mushroomWhite">{order.customer_name}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{order.customer_phone}</span>
                        </div>
                        {order.customer_line_id && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#06C755]/10 border border-[#06C755]/30 text-[#06C755] text-[10px] font-mono">
                            <span className="font-bold">LINE:</span>
                            <span>{order.customer_line_id}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-neutral-200 line-clamp-1">{order.product_name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          ขนาด {order.variant_size || '-'} | จำนวน {order.quantity || 1} ชิ้น
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-mushroomWhite">
                        ฿{(order.total_price || 0).toLocaleString()}
                      </td>

                      <td className="p-3.5">
                        {order.slip_url ? (
                          <button
                            type="button"
                            onClick={() => setViewingSlipUrl(order.slip_url || null)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-700 bg-obsidian-950 text-cyan-400 hover:border-cyan-500 text-[11px]"
                          >
                            <Eye className="w-3 h-3" />
                            <span>ดูสลิป</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">ไม่มีสลิป</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium ${statusInfo.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.text}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg border border-neutral-700 bg-obsidian-950 text-neutral-300 hover:text-amberGold-400 hover:border-amberGold-500"
                            title="ดูรายละเอียดและที่อยู่จัดส่ง"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 rounded-lg border border-neutral-800 bg-obsidian-950 text-crimson-400 hover:text-crimson-300 hover:border-crimson-800"
                            title="ลบคำสั่งซื้อ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-obsidian-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amberGold-400 font-bold block">
                  รายละเอียดคำสั่งซื้อ
                </span>
                <h3 className="text-xl font-serif font-bold text-mushroomWhite">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-neutral-400 block">สถานะปัจจุบัน:</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStatusBadge(selectedOrder.status).bg}`}>
                    {getStatusBadge(selectedOrder.status).text}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-neutral-400 mr-1">เปลี่ยนเป็น:</span>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'paid')}
                  className="px-2.5 py-1 rounded-lg border border-emerald-800 bg-emerald-950/60 text-emerald-300 text-xs hover:bg-emerald-900"
                >
                  ✓ ชำระแล้ว
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                  className="px-2.5 py-1 rounded-lg border border-blue-800 bg-blue-950/60 text-blue-300 text-xs hover:bg-blue-900"
                >
                  🚚 จัดส่งแล้ว
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  className="px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-300 text-xs hover:bg-neutral-800"
                >
                  ✕ ยกเลิก
                </button>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
                <h4 className="text-xs font-mono uppercase text-amberGold-400 font-bold">ข้อมูลลูกค้า</h4>
                <div className="space-y-1.5 text-xs text-neutral-300">
                  <p><span className="text-neutral-500">ชื่อ:</span> <span className="font-semibold text-white">{selectedOrder.customer_name}</span></p>
                  <p className="flex items-center gap-2">
                    <span className="text-neutral-500">เบอร์โทร:</span> 
                    <span className="font-mono">{selectedOrder.customer_phone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedOrder.customer_phone, 'phone')}
                      className="text-neutral-400 hover:text-white"
                      title="คัดลอกเบอร์โทร"
                    >
                      {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </p>
                  {selectedOrder.customer_email && (
                    <p><span className="text-neutral-500">อีเมล:</span> <span>{selectedOrder.customer_email}</span></p>
                  )}
                  {selectedOrder.customer_line_id ? (
                    <div className="pt-2 border-t border-neutral-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[#06C755] font-bold flex items-center gap-1">
                          <span>💬 LINE ID:</span>
                          <span className="font-mono text-white">{selectedOrder.customer_line_id}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedOrder.customer_line_id || '', 'line')}
                            className="p-1 rounded text-neutral-400 hover:text-white"
                            title="คัดลอก LINE ID"
                          >
                            {copiedField === 'line' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`https://line.me/ti/p/~${selectedOrder.customer_line_id.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded bg-[#06C755] text-white text-[10px] font-bold hover:bg-[#05b34c]"
                          >
                            เปิด LINE
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-500 italic text-[11px]">ไม่ได้ระบุ LINE ID</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-amberGold-400 font-bold">ที่อยู่จัดส่งพัสดุ</h4>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedOrder.shipping_address, 'addr')}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amberGold-300"
                  >
                    {copiedField === 'addr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>คัดลอกที่อยู่</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed bg-obsidian-900 p-3 rounded-xl border border-neutral-800 font-mono">
                  {selectedOrder.shipping_address}
                </p>
              </div>
            </div>

            {/* Product & Payment Summary */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-obsidian-950/60 space-y-3">
              <h4 className="text-xs font-mono uppercase text-amberGold-400 font-bold">รายการสินค้า & ยอดเงิน</h4>
              <div className="flex items-center justify-between text-xs py-2 border-b border-neutral-800">
                <div>
                  <span className="font-semibold text-white">{selectedOrder.product_name}</span>
                  <span className="text-neutral-400 block">ขนาด: {selectedOrder.variant_size || 'มาตรฐาน'} (จำนวน: {selectedOrder.quantity || 1})</span>
                </div>
                <span className="font-mono text-base font-bold text-amberGold-300">
                  ฿{(selectedOrder.total_price || 0).toLocaleString()}
                </span>
              </div>

              {selectedOrder.slip_url && (
                <div className="pt-2">
                  <span className="text-xs text-neutral-400 block mb-2">หลักฐานการโอนเงิน (สลิป):</span>
                  <div 
                    onClick={() => setViewingSlipUrl(selectedOrder.slip_url || null)}
                    className="relative cursor-pointer group max-w-xs rounded-xl overflow-hidden border border-neutral-700 bg-obsidian-900"
                  >
                    <img 
                      src={selectedOrder.slip_url} 
                      alt="สลิปโอนเงิน" 
                      className="w-full h-48 object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>คลิกเพื่อดูภาพเต็ม</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-semibold hover:bg-neutral-700"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Custom Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-crimson-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-crimson-400">
              <div className="p-2.5 rounded-2xl bg-crimson-950/80 border border-crimson-800">
                <Trash2 className="w-6 h-6 text-crimson-400" />
              </div>
              <div>
                <h4 className="text-base font-serif font-bold text-mushroomWhite">ยืนยันการลบคำสั่งซื้อ</h4>
                <span className="text-xs font-mono text-crimson-400">{orderToDelete.order_number}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-neutral-800 text-xs text-neutral-300 space-y-1 font-sans">
              <p><span className="text-neutral-500">ลูกค้า:</span> {orderToDelete.customer_name} ({orderToDelete.customer_phone})</p>
              <p><span className="text-neutral-500">สินค้า:</span> {orderToDelete.product_name} (ยอด ฿{(orderToDelete.total_price || 0).toLocaleString()})</p>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              คำสั่งซื้อนี้และประวัติการชำระเงินจะถูกลบออกจากฐานข้อมูลอย่างถาวร คุณแน่ใจหรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                className="px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold shadow-lg shadow-crimson-900/40"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Fullscreen Viewer Lightbox */}
      {viewingSlipUrl && (
        <div 
          onClick={() => setViewingSlipUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-obsidian-950 p-3 rounded-2xl border border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-neutral-800">
              <span className="text-xs font-mono text-neutral-400">หลักฐานการชำระเงิน (สลิปโอน)</span>
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={viewingSlipUrl} 
              alt="Slip" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
