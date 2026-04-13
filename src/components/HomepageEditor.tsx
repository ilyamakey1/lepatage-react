import React, { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '../utils/trpc';
import { authHeaders } from '../utils/authHeaders';
import {
  Upload, X, Check, RotateCcw, ArrowLeftRight, Image, Film,
  ChevronRight, MousePointerClick, Save, AlertCircle
} from 'lucide-react';

type CellId =
  | 'hero_image'
  | 'grid_top_left'
  | 'grid_top_right'
  | 'grid_bottom_left'
  | 'grid_bottom_right'
  | 'bottom_photo'
  | 'bottom_video';

interface CellMeta {
  id: CellId;
  label: string;
  accepts: 'image' | 'video' | 'both';
  hasPlaque?: boolean;
  plaqueProductKey?: string;
  plaqueImageKey?: string;
}

const CELLS: CellMeta[] = [
  { id: 'hero_image', label: 'Hero баннер', accepts: 'image' },
  { id: 'grid_top_left', label: 'Верхняя левая', accepts: 'both' },
  {
    id: 'grid_top_right', label: 'Верхняя правая', accepts: 'image',
    hasPlaque: true, plaqueProductKey: 'hero_product_id', plaqueImageKey: 'hero_plaque_image',
  },
  { id: 'grid_bottom_left', label: 'Средняя левая', accepts: 'image' },
  { id: 'grid_bottom_right', label: 'Средняя правая', accepts: 'image' },
  {
    id: 'bottom_photo', label: 'Нижняя левая', accepts: 'image',
    hasPlaque: true, plaqueProductKey: 'bottom_product_id', plaqueImageKey: 'bottom_plaque_image',
  },
  { id: 'bottom_video', label: 'Нижняя правая', accepts: 'both' },
];

const isVideoUrl = (url: string) => /\.(mov|mp4|webm)$/i.test(url);

const DEFAULTS: Record<string, string> = {
  hero_image: '/assets/hero-woman-corset.jpg',
  grid_top_left: '/assets/IMG_8424.MOV',
  grid_top_right: '/assets/IMG_2083.JPG',
  grid_bottom_left: "/assets/L'Epatage DSC07578.JPG",
  grid_bottom_right: '/assets/IMG_6013.JPG',
  bottom_photo: '/assets/corset-avegue.jpg',
  bottom_video: '/assets/IMG_8424.MOV',
  hero_product_id: 'corset-armor',
  hero_plaque_image: '',
  bottom_product_id: 'corset-armor',
  bottom_plaque_image: '',
};

export const HomepageEditor: React.FC = () => {
  const { data: savedSettings, refetch } = trpc.homepage.getSettings.useQuery();
  const { data: products } = trpc.products.getAll.useQuery({ limit: 100 });
  const updateMutation = trpc.homepage.updateSettings.useMutation({ onSuccess: () => refetch() });

  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<CellId | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [swapSource, setSwapSource] = useState<CellId | null>(null);

  useEffect(() => {
    if (savedSettings) {
      const merged: Record<string, string> = {};
      for (const [k, v] of Object.entries(DEFAULTS)) {
        merged[k] = savedSettings[k] || v;
      }
      setForm(merged);
      setIsDirty(false);
    }
  }, [savedSettings]);

  const val = useCallback((key: string) => form[key] || DEFAULTS[key] || '', [form]);

  const set = useCallback((key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ settings: form });
      setIsDirty(false);
      showToast('success', 'Настройки сохранены');
    } catch {
      showToast('error', 'Ошибка сохранения');
    }
  };

  const handleReset = () => {
    if (savedSettings) {
      const merged: Record<string, string> = {};
      for (const [k, v] of Object.entries(DEFAULTS)) {
        merged[k] = savedSettings[k] || v;
      }
      setForm(merged);
      setIsDirty(false);
      setSelectedCell(null);
    }
  };

  const handleSwap = (target: CellId) => {
    if (!swapSource || swapSource === target) { setSwapSource(null); return; }
    setForm(prev => {
      const copy = { ...prev };
      const tmp = copy[swapSource] || '';
      copy[swapSource] = copy[target] || '';
      copy[target] = tmp;
      return copy;
    });
    setIsDirty(true);
    setSwapSource(null);
    showToast('success', 'Ячейки поменялись местами');
  };

  const selectedMeta = CELLS.find(c => c.id === selectedCell);

  const gridCells = CELLS.filter(c => c.id !== 'hero_image');

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-luxury-950">Конструктор главной страницы</h2>
          <p className="text-sm text-luxury-500 mt-1">Нажмите на ячейку, чтобы изменить её содержимое</p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
              <AlertCircle size={14} />
              Есть несохранённые изменения
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!isDirty}
            className="flex items-center gap-1.5 px-4 py-2 border border-luxury-300 text-luxury-700 rounded-lg hover:bg-luxury-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <RotateCcw size={14} /> Сбросить
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="flex items-center gap-1.5 px-5 py-2 bg-luxury-950 text-white rounded-lg hover:bg-luxury-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Save size={14} />
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left: Interactive preview */}
        <div className="space-y-3">
          {/* Hero */}
          <PreviewCell
            cellId="hero_image"
            label="Hero баннер"
            url={val('hero_image')}
            isSelected={selectedCell === 'hero_image'}
            onClick={() => setSelectedCell('hero_image')}
            className="w-full h-40 md:h-52 rounded-xl"
            swapSource={swapSource}
            onSwap={handleSwap}
          />

          {/* 3x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            {gridCells.map(cell => (
              <PreviewCell
                key={cell.id}
                cellId={cell.id}
                label={cell.label}
                url={val(cell.id)}
                isSelected={selectedCell === cell.id}
                onClick={() => setSelectedCell(cell.id)}
                className="w-full aspect-[3/4] rounded-xl"
                hasPlaque={cell.hasPlaque}
                plaqueLabel={
                  cell.hasPlaque && cell.plaqueProductKey
                    ? products?.find(p => p.slug === val(cell.plaqueProductKey!))?.name
                    : undefined
                }
                swapSource={swapSource}
                onSwap={handleSwap}
              />
            ))}
          </div>

          <p className="text-xs text-luxury-400 text-center">
            Рекомендуемые товары загружаются автоматически из отмеченных товаров
          </p>
        </div>

        {/* Right: Edit panel */}
        <div className="xl:sticky xl:top-28 xl:self-start">
          {selectedCell && selectedMeta ? (
            <EditPanel
              key={selectedCell}
              meta={selectedMeta}
              value={val(selectedCell)}
              onChange={(v) => set(selectedCell, v)}
              set={set}
              val={val}
              products={products || []}
              swapSource={swapSource}
              onSwapStart={() => setSwapSource(selectedCell)}
              onSwapCancel={() => setSwapSource(null)}
            />
          ) : (
            <div className="border-2 border-dashed border-luxury-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
              <MousePointerClick size={40} className="text-luxury-300 mb-4" />
              <p className="text-luxury-500 font-medium">Выберите ячейку</p>
              <p className="text-luxury-400 text-sm mt-1">Нажмите на любой блок слева, чтобы изменить его</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-fade-in-up ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}
    </div>
  );
};

/* ─── Preview Cell ─── */

interface PreviewCellProps {
  cellId: CellId;
  label: string;
  url: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  hasPlaque?: boolean;
  plaqueLabel?: string;
  swapSource: CellId | null;
  onSwap: (target: CellId) => void;
}

const PreviewCell: React.FC<PreviewCellProps> = ({
  cellId, label, url, isSelected, onClick, className = '',
  hasPlaque, plaqueLabel, swapSource, onSwap,
}) => {
  const isSwapTarget = swapSource !== null && swapSource !== cellId;
  const video = isVideoUrl(url);

  return (
    <div
      onClick={() => isSwapTarget ? onSwap(cellId) : onClick()}
      className={`relative overflow-hidden cursor-pointer group border-2 transition-all duration-200 ${className} ${
        isSelected
          ? 'border-luxury-950 ring-2 ring-luxury-950/20'
          : isSwapTarget
            ? 'border-blue-400 ring-2 ring-blue-400/20 animate-pulse'
            : 'border-transparent hover:border-luxury-300'
      }`}
    >
      {url ? (
        video ? (
          <video
            src={url}
            muted
            loop
            playsInline
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full bg-luxury-100 flex items-center justify-center">
          <span className="text-luxury-400 text-sm">Пусто</span>
        </div>
      )}

      {/* Label overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1.5">
          {video ? <Film size={12} /> : <Image size={12} />}
          {label}
        </span>
      </div>

      {/* Plaque indicator */}
      {hasPlaque && (
        <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm px-2 py-1.5 text-xs text-luxury-700 truncate pointer-events-none group-hover:opacity-0 transition-opacity">
          {plaqueLabel || 'Плашка товара'}
        </div>
      )}

      {/* Swap target hint */}
      {isSwapTarget && (
        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
          <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            Нажмите для обмена
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Edit Panel ─── */

interface EditPanelProps {
  meta: CellMeta;
  value: string;
  onChange: (v: string) => void;
  set: (key: string, value: string) => void;
  val: (key: string) => string;
  products: any[];
  swapSource: CellId | null;
  onSwapStart: () => void;
  onSwapCancel: () => void;
}

const EditPanel: React.FC<EditPanelProps> = ({
  meta, value, onChange, set, val, products,
  swapSource, onSwapStart, onSwapCancel,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const acceptStr = meta.accepts === 'video' ? 'video/*' : meta.accepts === 'both' ? 'image/*,video/*' : 'image/*';

  const upload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      alert('Файл не должен превышать 50 МБ');
      return;
    }
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('image', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });

      const url: string = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            resolve(res.imageUrl || res.fileUrl || '');
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', '/api/upload');
        Object.entries(authHeaders()).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.send(fd);
      });

      onChange(url);
    } catch {
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) upload(f);
  };

  return (
    <div className="border border-luxury-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-luxury-100 bg-luxury-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-luxury-950">{meta.label}</h3>
            <p className="text-xs text-luxury-500 mt-0.5">
              {meta.accepts === 'both' ? 'Фото или видео' : meta.accepts === 'video' ? 'Видео' : 'Фото'}
            </p>
          </div>
          <button
            onClick={swapSource === meta.id ? onSwapCancel : onSwapStart}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              swapSource === meta.id
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-luxury-300 text-luxury-600 hover:bg-luxury-50'
            }`}
          >
            <ArrowLeftRight size={12} />
            {swapSource === meta.id ? 'Отмена обмена' : 'Обменять'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Current preview */}
        {value && (
          <div className="relative rounded-xl overflow-hidden bg-luxury-100 aspect-[4/3]">
            {isVideoUrl(value) ? (
              <video src={value} muted loop playsInline autoPlay className="w-full h-full object-cover" />
            ) : (
              <img src={value} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => onChange('')}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragOver ? 'border-luxury-950 bg-luxury-50' : 'border-luxury-300 hover:border-luxury-500 hover:bg-luxury-50/50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept={acceptStr}
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-3">
              <div className="w-full h-2 bg-luxury-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-luxury-950 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-luxury-600">{uploadProgress}% загружено</p>
            </div>
          ) : (
            <>
              <Upload size={24} className="mx-auto text-luxury-400 mb-2" />
              <p className="text-sm text-luxury-600">
                {value ? 'Заменить файл' : 'Перетащите файл или нажмите'}
              </p>
              <p className="text-xs text-luxury-400 mt-1">
                {meta.accepts === 'both' ? 'JPG, PNG, MOV, MP4 — до 50 МБ' :
                 meta.accepts === 'video' ? 'MOV, MP4 — до 50 МБ' : 'JPG, PNG — до 50 МБ'}
              </p>
            </>
          )}
        </div>

        {/* URL input */}
        <div>
          <label className="block text-xs font-medium text-luxury-600 mb-1.5">Или укажите URL</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={DEFAULTS[meta.id] || '/assets/...'}
            className="w-full px-3 py-2 border border-luxury-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-luxury-950/20 focus:border-luxury-950"
          />
        </div>

        {/* Plaque settings */}
        {meta.hasPlaque && meta.plaqueProductKey && meta.plaqueImageKey && (
          <PlaqueSettings
            productKey={meta.plaqueProductKey}
            imageKey={meta.plaqueImageKey}
            val={val}
            set={set}
            products={products}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Plaque (product card overlay) Settings ─── */

interface PlaqueSettingsProps {
  productKey: string;
  imageKey: string;
  val: (key: string) => string;
  set: (key: string, value: string) => void;
  products: any[];
}

const PlaqueSettings: React.FC<PlaqueSettingsProps> = ({ productKey, imageKey, val, set, products }) => {
  const selectedProduct = products.find(p => p.slug === val(productKey));
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadPlaqueImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd, headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        set(imageKey, data.imageUrl || '');
      }
    } catch { /* ignore */ } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-luxury-100 pt-4 space-y-4">
      <h4 className="text-sm font-semibold text-luxury-950 flex items-center gap-1.5">
        <ChevronRight size={14} /> Плашка товара
      </h4>

      {/* Product select */}
      <div>
        <label className="block text-xs font-medium text-luxury-600 mb-1.5">Товар</label>
        <select
          value={val(productKey)}
          onChange={(e) => set(productKey, e.target.value)}
          className="w-full px-3 py-2 border border-luxury-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-luxury-950/20 focus:border-luxury-950"
        >
          <option value="">Выберите товар</option>
          {products.map(p => (
            <option key={p.id} value={p.slug}>
              {p.name} — {p.price} ₽
            </option>
          ))}
        </select>
      </div>

      {/* Selected product preview */}
      {selectedProduct && (
        <div className="flex items-center gap-3 p-3 bg-luxury-50 rounded-xl">
          <img
            src={selectedProduct.images?.[0] || '/assets/placeholder.jpg'}
            alt={selectedProduct.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-luxury-950 truncate">{selectedProduct.name}</p>
            <p className="text-xs text-luxury-600">
              {selectedProduct.salePrice ? (
                <>
                  <span className="line-through mr-1">{selectedProduct.price} ₽</span>
                  <span className="text-red-600 font-medium">{selectedProduct.salePrice} ₽</span>
                </>
              ) : (
                `${selectedProduct.price} ₽`
              )}
            </p>
          </div>
        </div>
      )}

      {/* Plaque image override */}
      <div>
        <label className="block text-xs font-medium text-luxury-600 mb-1.5">
          Фото в плашке (по умолчанию из товара)
        </label>
        <div className="flex items-center gap-2">
          {val(imageKey) && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={val(imageKey)} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => set(imageKey, '')}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
          <input
            type="text"
            value={val(imageKey)}
            onChange={(e) => set(imageKey, e.target.value)}
            placeholder="Берётся из товара"
            className="flex-1 px-3 py-2 border border-luxury-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-luxury-950/20 focus:border-luxury-950"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 p-2 border border-luxury-300 rounded-lg hover:bg-luxury-50 transition-colors disabled:opacity-50"
          >
            <Upload size={14} className="text-luxury-600" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPlaqueImage(f);
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
};
