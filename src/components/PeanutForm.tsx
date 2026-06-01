/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PeanutBatch } from '../types';
import { generateTraceabilityId } from '../utils';
import { Save, X, RotateCcw, Box, User, Calendar, FileSpreadsheet, Percent, Beaker, HelpCircle } from 'lucide-react';

interface PeanutFormProps {
  initialData: PeanutBatch | null;
  onSubmit: (batch: PeanutBatch) => Promise<void>;
  onCancel: () => void;
}

const BREED_PRESETS = [
  '台南14號 (主要食用/大粒)',
  '台南9號 (大仁豆/傳統油豆)',
  '黑金剛 (黑皮/高花青素)',
  '花沙 (紅白雙色/口感細緻)',
  '台南16號',
  '澎湖油豆',
  '其他品種'
];

const GRADE_PRESETS = [
  { value: '特級', label: '特級 (水分<8%, 籽粒飽滿無疵)' },
  { value: '優等', label: '優等 (水分8-10%, 品質良好)' },
  { value: '合格', label: '合格 (水分10-12%, 達標準)' },
  { value: '淘汰', label: '淘汰 (含黃麴毒素或水分>12%過高)' }
];

const TOXIN_PRESETS = [
  { value: '未檢出', label: '未檢出 (安全無檢出)' },
  { value: '合格', label: '合格 (微量符合法規標準)' },
  { value: '超標', label: '超標 (超出國家法規安全範圍)' },
  { value: '未檢', label: '未檢 (等待檢體報告中)' }
];

export default function PeanutForm({ initialData, onSubmit, onCancel }: PeanutFormProps) {
  const [id, setId] = useState('');
  const [breed, setBreed] = useState(BREED_PRESETS[0]);
  const [customBreed, setCustomBreed] = useState('');
  const [farmer, setFarmer] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [moisture, setMoisture] = useState<number | ''>('');
  const [oilContent, setOilContent] = useState<number | ''>('');
  const [toxinStatus, setToxinStatus] = useState<PeanutBatch['toxinStatus']>('未檢出');
  const [grade, setGrade] = useState<PeanutBatch['grade']>('優等');
  const [status, setStatus] = useState<PeanutBatch['status']>('在庫');
  const [remarks, setRemarks] = useState('');
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize values
  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      if (BREED_PRESETS.includes(initialData.breed)) {
        setBreed(initialData.breed);
        setCustomBreed('');
      } else {
        setBreed('其他品種');
        setCustomBreed(initialData.breed);
      }
      setFarmer(initialData.farmer);
      setHarvestDate(initialData.harvestDate);
      setEntryDate(initialData.entryDate);
      setWarehouseLocation(initialData.warehouseLocation);
      setWeight(initialData.weight);
      setMoisture(initialData.moisture);
      setOilContent(initialData.oilContent);
      setToxinStatus(initialData.toxinStatus);
      setGrade(initialData.grade);
      setStatus(initialData.status);
      setRemarks(initialData.remarks || '');
      setCustomFields(initialData.customFields || []);
    } else {
      const todayISO = new Date().toISOString().split('T')[0];
      setHarvestDate(todayISO);
      setEntryDate(todayISO);
      setId(generateTraceabilityId(todayISO));
      setBreed(BREED_PRESETS[0]);
      setCustomBreed('');
      setFarmer('');
      setWarehouseLocation('倉庫 A-1');
      setWeight('');
      setMoisture('');
      setOilContent('');
      setToxinStatus('未檢出');
      setGrade('優等');
      setStatus('在庫');
      setRemarks('');
      setCustomFields([]);
    }
  }, [initialData]);

  // Handle automatic or regional id generation
  const handleRegenerateId = () => {
    if (!initialData) {
      setId(generateTraceabilityId(entryDate || undefined));
    }
  };

  // Sync ID date part when entryDate changes (only for new creation)
  const handleEntryDateChange = (val: string) => {
    setEntryDate(val);
    if (!initialData) {
      setId(generateTraceabilityId(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Form validations
    if (!id.trim()) {
      setValidationError('溯源編號不能留空。');
      return;
    }
    const finalBreed = breed === '其他品種' ? customBreed.trim() : breed;
    if (!finalBreed) {
      setValidationError('請指定花生品種。');
      return;
    }
    if (!farmer.trim()) {
      setValidationError('請填寫農民姓名。');
      return;
    }
    if (!harvestDate) {
      setValidationError('請指定採收日期。');
      return;
    }
    if (!entryDate) {
      setValidationError('請指定入庫日期。');
      return;
    }
    if (weight === '' || weight <= 0) {
      setValidationError('請輸入正確的進貨重量 (需大於 0)。');
      return;
    }
    if (moisture === '' || moisture < 0 || moisture > 100) {
      setValidationError('水分含量百分比需在 0 到 100% 之間。');
      return;
    }
    if (oilContent === '' || oilContent < 0 || oilContent > 100) {
      setValidationError('含油量百分比需在 0 到 100% 之間。');
      return;
    }
    if (!warehouseLocation.trim()) {
      setValidationError('請輸入倉庫儲位（方便後續盤點導航）。');
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty custom field entries to be robust and forgiving
      const finalCustomFields = customFields
        .map(f => ({ label: f.label.trim(), value: f.value.trim() }))
        .filter(f => f.label !== '' && f.value !== '');

      const payload: PeanutBatch = {
        id: id.trim(),
        breed: finalBreed,
        farmer: farmer.trim(),
        harvestDate,
        entryDate,
        weight: Number(weight),
        moisture: Number(moisture),
        oilContent: Number(oilContent),
        toxinStatus,
        grade,
        warehouseLocation: warehouseLocation.trim(),
        status,
        remarks: remarks.trim() || undefined,
        createdAt: initialData ? initialData.createdAt : new Date().toISOString(),
        customFields: finalCustomFields.length > 0 ? finalCustomFields : undefined
      };
      await onSubmit(payload);
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || '儲存物料時發生錯誤，請確認資料結構無誤。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="peanut-form-container" className="bg-white rounded-3xl border-2 border-bento-cream shadow-[0_4px_24px_rgba(74,55,40,0.06)] overflow-hidden max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-bento-dark px-6 py-6 text-white flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black font-sans leading-snug">
            {initialData ? '修改花生履歷數據' : '手動錄入花生新批次'}
          </h3>
          <p className="text-bento-cream text-[11px] mt-1 font-medium">請確實鍵入農作物檢驗數據，系統將儲存於雲端資料庫並對應專屬 QR Code。</p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form id="peanut-form-inputs" onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-xs text-left">
            <X className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-extrabold">輸入驗證未通過</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {/* Section 1: 溯源基本資訊 */}
        <div>
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-bento-cream">
            <span className="bg-bento-sand text-bento-dark text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">第一部分</span>
            <h4 className="font-extrabold text-bento-dark text-sm flex items-center"><User className="w-4 h-4 mr-1.5 text-bento-mid" /> 來源溯源與特徵</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ID */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5 flex items-center justify-between">
                <span>溯源批次編號</span>
                {!initialData && (
                  <button
                    type="button"
                    onClick={handleRegenerateId}
                    className="text-[10px] text-[#8B5A2B] hover:text-[#5c4021] font-bold flex items-center space-x-0.5 cursor-pointer"
                    title="重新生成隨機碼"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>刷新</span>
                  </button>
                )}
              </label>
              <input
                type="text"
                required
                disabled={!!initialData}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="例如: PN-20260601-A4B7"
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream disabled:opacity-60 disabled:bg-[#f6f2eb] rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-mono shadow-sm"
              />
            </div>

            {/* Farmer */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5 flex items-center">
                <span>栽種農民姓名</span>
              </label>
              <input
                type="text"
                required
                value={farmer}
                onChange={(e) => setFarmer(e.target.value)}
                placeholder="例如: 林聰明, 張阿土"
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              />
            </div>

            {/* Breed selector */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                花生品種
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              >
                {BREED_PRESETS.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Breed Input */}
          {breed === '其他品種' && (
            <div className="mt-4 max-w-md animate-fade-in">
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center">
                <span>請輸入自訂品種名稱</span>
              </label>
              <input
                type="text"
                required
                value={customBreed}
                onChange={(e) => setCustomBreed(e.target.value)}
                placeholder="例如: 台中九號, 泰國大粒"
                className="w-full px-4 py-2 bg-bento-sand/40 border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Section 2: 時間與入庫管理 */}
        <div>
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-bento-cream">
            <span className="bg-bento-sand text-bento-dark text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">第二部分</span>
            <h4 className="font-extrabold text-bento-dark text-sm flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-bento-mid" /> 時程與庫存儲位</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Harvest Date */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                採收日期
              </label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              />
            </div>

            {/* Entry Date */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                入庫存放日期
              </label>
              <input
                type="date"
                required
                disabled={!!initialData}
                value={entryDate}
                onChange={(e) => handleEntryDateChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream disabled:bg-[#f6f2eb] disabled:opacity-60 rounded-xl text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              />
            </div>

            {/* Warehouse Location */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                倉庫存放儲位
              </label>
              <input
                type="text"
                required
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                placeholder="例如: 倉庫 A-1, B-4 架上"
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: 規格與檢驗數據 */}
        <div>
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-bento-cream">
            <span className="bg-bento-sand text-bento-dark text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">第三部分</span>
            <h4 className="font-extrabold text-bento-dark text-sm flex items-center"><Beaker className="w-4 h-4 mr-1.5 text-bento-mid" /> 重量規格與檢驗測量狀態</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Weight */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5 flex items-center justify-between">
                <span>進庫重量 (Kg)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="例如: 500"
                  className="w-full pl-4 pr-12 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
                />
                <span className="absolute right-4 top-2.5 text-xs text-bento-mid font-extrabold">公斤</span>
              </div>
            </div>

            {/* Moisture */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                水分比率測量 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={moisture}
                  onChange={(e) => setMoisture(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="標準水分約 8-10%"
                  className="w-full pl-4 pr-12 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
                />
                <span className="absolute right-4 top-2.5 text-xs text-bento-mid font-extrabold">%</span>
              </div>
            </div>

            {/* Oil Content */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                含油率質測量 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={oilContent}
                  onChange={(e) => setOilContent(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="油豆合規通常在 45-52%"
                  className="w-full pl-4 pr-12 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
                />
                <span className="absolute right-4 top-2.5 text-xs text-bento-mid font-extrabold">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {/* Toxin status */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                黃麴毒素(Aflatoxin) 檢測結果
              </label>
              <select
                value={toxinStatus}
                onChange={(e) => setToxinStatus(e.target.value as PeanutBatch['toxinStatus'])}
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              >
                {TOXIN_PRESETS.map((t, i) => (
                  <option key={i} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Quality Grade */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                核定品質級別 (Grade)
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as PeanutBatch['grade'])}
                className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              >
                {GRADE_PRESETS.map((g, i) => (
                  <option key={i} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: 庫存與說明 */}
        <div>
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-bento-cream">
            <span className="bg-bento-sand text-bento-dark text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">第四部分</span>
            <h4 className="font-extrabold text-bento-dark text-sm flex items-center"><Box className="w-4 h-4 mr-1.5 text-bento-mid" /> 當前狀態與備註</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                庫存現狀
              </label>
              <div className="flex space-x-3 mt-1">
                <label className={`flex-1 flex items-center justify-center border-2 rounded-xl py-2 px-3 cursor-pointer transition-all text-sm font-bold shadow-sm ${
                  status === '在庫'
                    ? 'border-bento-dark bg-bento-sand/40 text-bento-dark'
                    : 'border-bento-cream bg-[#FDFBF7] text-bento-mid'
                }`}>
                  <input
                    type="radio"
                    name="batch-status"
                    checked={status === '在庫'}
                    onChange={() => setStatus('在庫')}
                    className="mr-2 text-bento-dark focus:ring-bento-dark text-bento-dark"
                  />
                  <span>在庫 (保管中)</span>
                </label>
                <label className={`flex-1 flex items-center justify-center border-2 rounded-xl py-2 px-3 cursor-pointer transition-all text-sm font-bold shadow-sm ${
                  status === '已出庫'
                    ? 'border-bento-dark bg-bento-sand/40 text-bento-dark'
                    : 'border-bento-cream bg-[#FDFBF7] text-bento-mid'
                }`}>
                  <input
                    type="radio"
                    name="batch-status"
                    checked={status === '已出庫'}
                    onChange={() => setStatus('已出庫')}
                    className="mr-2 text-bento-dark focus:ring-bento-dark"
                  />
                  <span>已出庫 (已發貨)</span>
                </label>
              </div>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-bento-dark mb-1.5">
                補充記錄額外備註
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="例如: 包裝箱稍微破損已修復, 濕度控制在 55% 以下存放."
                rows={2}
                className="w-full px-4 py-2 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm font-semibold shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 5: 自訂附加履歷項目 */}
        <div>
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-bento-cream">
            <span className="bg-bento-sand text-bento-dark text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">第五部分</span>
            <h4 className="font-extrabold text-bento-dark text-sm flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-bento-mid" /> 
              <span>客製自訂履歷項目與認證指標</span>
            </h4>
          </div>

          <p className="text-xs text-bento-mid mb-4">
            若本批花生有其他的特殊證明或說明欄位（例如：有機農耕字號、契作契約、烘乾人員、無農藥殘留驗證、SGS檢測編號等），您可在此自行新增並編輯自定義的履歷欄位：
          </p>

          <div className="space-y-3">
            {customFields.map((field, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-[#FDFBF7] p-3 border border-bento-cream/60 rounded-xl animate-fade-in">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="項目名稱 (例：SGS報告號、檢驗員)"
                    value={field.label}
                    onChange={(e) => {
                      const updated = [...customFields];
                      updated[idx].label = e.target.value;
                      setCustomFields(updated);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-bento-cream rounded-lg text-xs font-bold text-bento-dark focus:outline-none focus:ring-1 focus:ring-bento-dark shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="輸入內容值"
                    value={field.value}
                    onChange={(e) => {
                      const updated = [...customFields];
                      updated[idx].value = e.target.value;
                      setCustomFields(updated);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-bento-cream rounded-lg text-xs font-semibold text-bento-dark focus:outline-none focus:ring-1 focus:ring-bento-dark shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomFields(customFields.filter((_, i) => i !== idx));
                  }}
                  className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg text-xs font-bold transition-all cursor-pointer border border-transparent hover:border-red-200 flex items-center justify-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>移除</span>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setCustomFields([...customFields, { label: '', value: '' }]);
              }}
              className="px-4 py-2 bg-bento-sand hover:bg-bento-cream text-bento-dark border border-bento-cream text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1 shadow-sm"
            >
              <span>+ 新增自訂履歷欄位</span>
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-bento-cream flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            id="cancel-batch-form"
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-bento-cream hover:bg-bento-sand bg-white text-bento-dark rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            取消
          </button>
          
          <button
            id="submit-batch-form"
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-bento-dark hover:opacity-90 text-white font-extrabold rounded-xl shadow-md disabled:opacity-50 transition-all text-sm flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>儲存上載中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>儲存此批履歷</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
