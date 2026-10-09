'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Upload, 
  Image as ImageIcon, 
  Music, 
  Video, 
  FileText, 
  Layers, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface MediaAsset {
  id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  file_size_bytes?: number;
  created_at: string;
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio' | 'video' | 'model' | 'document'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      console.error('Fetch media error:', err);
      setAssets([]);
      setStatusMsg({ type: 'error', text: `โหลด Media จาก Supabase ไม่สำเร็จ: ${err.message || 'ตรวจสอบสิทธิ์และการเชื่อมต่อ'}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setStatusMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `media/${Date.now()}_${cleanName}`;

        // 1. Upload to Supabase Storage Bucket 'museum-media'
        const { error: uploadError } = await supabase
          .storage
          .from('museum-media')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }
        const { data: urlData } = supabase.storage.from('museum-media').getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // 2. Save metadata to Supabase 'media_assets' table
        const newAsset: Partial<MediaAsset> = {
          file_name: file.name,
          storage_path: storagePath,
          public_url: publicUrl,
          mime_type: file.type || 'application/octet-stream',
          file_size_bytes: file.size,
        };

        const { data: dbData, error: dbError } = await supabase
          .from('media_assets')
          .insert([newAsset])
          .select()
          .single();

        if (dbError || !dbData) {
          await supabase.storage.from('museum-media').remove([storagePath]);
          throw dbError || new Error('Supabase ไม่ได้ยืนยัน metadata ของไฟล์');
        }
        setAssets(prev => [dbData, ...prev]);
      }

      setStatusMsg({ type: 'success', text: `อัปโหลดไฟล์สำเร็จเรียบร้อย (${files.length} รายการ)` });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการอัปโหลด: ' + err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`คุณต้องการลบไฟล์ "${asset.file_name}" ใช่หรือไม่?`)) return;

    try {
      if (asset.id.startsWith('sample-') || asset.id.startsWith('temp-')) {
        throw new Error('รายการนี้ไม่ใช่ asset ที่บันทึกในฐานข้อมูลจริง กรุณารีเฟรชรายการ');
      }

      // Delete the stored object, then verify the corresponding metadata row.
      const { error: storageError } = await supabase.storage.from('museum-media').remove([asset.storage_path]);
      if (storageError) throw storageError;

      const { data, error } = await supabase.from('media_assets').delete().eq('id', asset.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Supabase ไม่พบ metadata ที่ต้องการลบ');

      setAssets(prev => prev.filter(a => a.id !== asset.id));
      setStatusMsg({ type: 'success', text: `ลบไฟล์ "${asset.file_name}" สำเร็จเรียบร้อย` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert('ลบไฟล์ไม่สำเร็จ: ' + err.message);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'ไม่ระบุ';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'image') return a.mime_type.startsWith('image/');
    if (filterType === 'audio') return a.mime_type.startsWith('audio/');
    if (filterType === 'video') return a.mime_type.startsWith('video/');
    if (filterType === 'model') return a.mime_type.includes('gltf') || a.file_name.endsWith('.glb');
    if (filterType === 'document') return a.mime_type.includes('pdf');
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amberGold-200">
            คลังสื่อมัลติมีเดีย (Media Library)
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            อัปโหลดรูปภาพ วิดีโอ เสียง และโมเดล 3D เข้าสู่ Supabase Storage พร้อมปุ่มคัดลอกลิงก์ไปใช้งานได้ทันที
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,video/mp4,audio/mp3,audio/mpeg,application/pdf,.glb,.gltf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-mushroomWhite text-xs font-serif font-bold transition shadow-lg disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
            {uploading ? 'กำลังอัปโหลดขึ้น Supabase...' : 'อัปโหลดไฟล์ใหม่ (Upload Media)'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 shadow-lg animate-fadeIn ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
            : 'bg-crimson-950/80 border-crimson-700 text-crimson-300'
        }`}>
          {statusMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-crimson-400" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-neutral-800 bg-obsidian-900/80">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-obsidian-950 border border-neutral-800 text-xs text-mushroomWhite focus:border-amberGold-500 font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-mono">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'image', label: 'รูปภาพ' },
            { key: 'audio', label: 'เสียง' },
            { key: 'video', label: 'วิดีโอ' },
            { key: 'model', label: '3D โมเดล' },
            { key: 'document', label: 'PDF' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                filterType === tab.key 
                  ? 'bg-crimson-900 text-amberGold-200 border border-amberGold-500/40 font-bold' 
                  : 'bg-obsidian-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchAssets}
            className="p-1.5 rounded-lg border border-neutral-800 bg-obsidian-950 text-neutral-400 hover:text-white ml-2"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-400 font-mono">
          กำลังโหลดไฟล์จากคลังสื่อ Supabase...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-obsidian-900/30">
          <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm font-serif text-neutral-300">ไม่พบไฟล์สื่อที่ตรงกับการค้นหา</p>
          <span className="text-xs text-neutral-500 font-mono mt-1 block">กดปุ่ม "อัปโหลดไฟล์ใหม่" ด้านบนเพื่อเพิ่มภาพหรือไฟล์เข้าสู่ระบบ</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const isImage = asset.mime_type.startsWith('image/');
            const isAudio = asset.mime_type.startsWith('audio/');
            const isVideo = asset.mime_type.startsWith('video/');
            const is3D = asset.mime_type.includes('gltf') || asset.file_name.endsWith('.glb');
            const isPDF = asset.mime_type.includes('pdf');

            return (
              <div 
                key={asset.id}
                className="group rounded-2xl border border-neutral-800 bg-obsidian-900/90 overflow-hidden shadow-lg flex flex-col justify-between hover:border-amberGold-500/50 transition duration-300"
              >
                {/* Media Preview Box */}
                <div className="relative h-44 bg-obsidian-950 flex items-center justify-center overflow-hidden border-b border-neutral-800/80">
                  {isImage ? (
                    <img 
                      src={asset.public_url} 
                      alt={asset.file_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : isAudio ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <Music className="w-12 h-12 text-amberGold-400" />
                      <audio controls className="w-full mt-2 h-7">
                        <source src={asset.public_url} type={asset.mime_type} />
                      </audio>
                    </div>
                  ) : isVideo ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <Video className="w-12 h-12 text-crimson-400" />
                      <span className="text-[10px] text-neutral-400 font-mono">Video MP4 File</span>
                    </div>
                  ) : is3D ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <Layers className="w-12 h-12 text-amberGold-400 animate-pulse" />
                      <span className="text-[10px] text-amberGold-300 font-mono">3D Model (GLB/GLTF)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileText className="w-12 h-12 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 font-mono">Document PDF</span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-obsidian-950/80 backdrop-blur-sm border border-neutral-700/80 text-[10px] font-mono font-bold text-amberGold-300 uppercase">
                    {isImage ? 'IMAGE' : isAudio ? 'AUDIO' : isVideo ? 'VIDEO' : is3D ? '3D GLB' : 'DOC'}
                  </span>
                </div>

                {/* File Information */}
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-mushroomWhite truncate" title={asset.file_name}>
                    {asset.file_name}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                    <span>{formatFileSize(asset.file_size_bytes)}</span>
                    <span>{new Date(asset.created_at).toLocaleDateString('th-TH')}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-1 border-t border-neutral-800/80">
                    <button
                      onClick={() => handleCopyUrl(asset.public_url, asset.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition ${
                        copiedId === asset.id 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                          : 'bg-obsidian-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                      }`}
                      title="คัดลอก Public URL ไปใส่ในห้องจัดแสดงหรือสินค้า"
                    >
                      {copiedId === asset.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amberGold-400" />
                          <span>คัดลอกลิงก์</span>
                        </>
                      )}
                    </button>

                    <a
                      href={asset.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-obsidian-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition"
                      title="เปิดไฟล์ในแท็บใหม่"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-1.5 rounded-lg bg-crimson-950/60 hover:bg-crimson-900 text-crimson-300 border border-crimson-900/60 transition"
                      title="ลบไฟล์ออกจาก Storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
