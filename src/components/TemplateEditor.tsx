/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppTemplate, DEFAULT_TEMPLATE } from '../types';
import { Save, RefreshCw, Plus, Trash2, ArrowLeft, Settings, Info } from 'lucide-react';

interface TemplateEditorProps {
  currentTemplate: AppTemplate;
  onSave: (template: AppTemplate) => Promise<void>;
  onBack: () => void;
}

export default function TemplateEditor({ currentTemplate, onSave, onBack }: TemplateEditorProps) {
  // Deep-copy template settings so edits are local before clicking Save
  const [template, setTemplate] = useState<AppTemplate>(() => JSON.parse(JSON.stringify(currentTemplate)));
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States to hold the text of new option fields about to be added
  const [newOptions, setNewOptions] = useState<Record<string, string>>({
    breed: '',
    toxinStatus: '',
    grade: '',
    status: ''
  });

  const handleLabelChange = (fieldKey: keyof AppTemplate, value: string) => {
    setTemplate(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        customLabel: value
      }
    }));
  };

  const handleAddOption = (fieldKey: keyof AppTemplate) => {
    const rawVal = newOptions[fieldKey]?.trim();
    if (!rawVal) return;

    const currentOptions = template[fieldKey].options || [];
    if (currentOptions.includes(rawVal)) {
      alert('該選項已存在，不需重複新增。');
      return;
    }

    setTemplate(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        options: [...currentOptions, rawVal]
      }
    }));

    setNewOptions(prev => ({
      ...prev,
      [fieldKey]: ''
    }));
  };

  const handleRemoveOption = (fieldKey: keyof AppTemplate, optIndex: number) => {
    const currentOptions = template[fieldKey].options || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== optIndex);

    setTemplate(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        options: updatedOptions
      }
    }));
  };

  const handleResetDefaults = () => {
    if (confirm('您確定要將所有自訂欄位標題與選項，重設回系統預設的「花生履歷」設定嗎？')) {
      setTemplate(JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)));
      setSuccessMsg('已回復預設設定，請點擊下方的「儲存設定」以寫入雲端。');
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await onSave(template);
      setSuccessMsg('🎉 欄位與範本自訂設定已成功儲存至雲端資料庫，前台/後台將會即時套用新標題與自訂選項！');
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(`儲存範本設定失敗：${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="template-editor-container" className="bg-white rounded-3xl border-2 border-bento-cream shadow-[0_4px_24px_rgba(74,55,40,0.06)] overflow-hidden max-w-4xl mx-auto text-left animate-fade-in">
      
      {/* Banner */}
      <div className="bg-bento-dark px-6 py-6 text-white flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black font-sans leading-snug flex items-center space-x-2">
            <Settings className="w-5 h-5 text-bento-cream" />
            <span>自訂履歷欄位與對應標籤 (範本編輯器)</span>
          </h3>
          <p className="text-bento-cream text-[11px] mt-1 font-medium">
            全欄位自訂系統，能將花生生產履歷一鍵修改為草莓、茶葉、稻米等任何農作物的專屬溯源系統。
          </p>
        </div>
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-emerald-800 text-xs text-left animate-fade-in">
            <Info className="w-4.5 h-4.5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-extrabold">{successMsg}</p>
            </div>
          </div>
        )}

        <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-bento-cream/70 flex items-start space-x-3 text-bento-dark text-xs leading-relaxed shadow-sm">
          <Info className="w-5 h-5 text-bento-mid shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black">💡 欄位自訂工作說明：</p>
            <p>1. <b>自訂專屬名稱</b>：可將預設的「花生品種」修改為「茶葉品種」或「肉品來源」，下方為目前所有的核心系統欄位，您可以隨時覆寫。</p>
            <p>2. <b>選項管理</b>：針對可選下拉清單欄位（如：品種、等級、檢驗結果），能自定義預設選單。請自行點擊【新增】或【移除】來維護預置選項值。</p>
          </div>
        </div>

        {/* Categories of Field Config */}
        <div className="space-y-6 divide-y divide-bento-cream/60">
          
          {/* Section A: 來源與特徵 */}
          <div className="pt-2">
            <h4 className="text-xs font-black text-[#5c4021] uppercase tracking-wider mb-4 flex items-center bg-bento-sand/40 px-3 py-1.5 rounded-lg w-max">
              第一分類：來源特徵與批次 (A)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark flex justify-between">
                  <span>履歷 ID 標籤名稱 ({template.id.defaultLabel})</span>
                  <span className="text-[10px] text-bento-mid font-mono">PN-YYYYMMDD-XXXX</span>
                </label>
                <input
                  type="text"
                  required
                  value={template.id.customLabel}
                  onChange={(e) => handleLabelChange('id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

              {/* Farmer */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  農民欄位名稱 ({template.farmer.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.farmer.customLabel}
                  onChange={(e) => handleLabelChange('farmer', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

              {/* Breed with custom options selection */}
              <div className="space-y-2 md:col-span-2 border border-bento-cream p-4 rounded-2xl bg-white shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-bento-dark">
                      品種/種類標籤名稱 ({template.breed.defaultLabel})
                    </label>
                    <p className="text-[10px] text-bento-mid">自訂下拉選單時，最後保留「其他品種」將會自動開啟讓用戶自訂輸入額外品種的功能。</p>
                  </div>
                  <input
                    type="text"
                    required
                    value={template.breed.customLabel}
                    onChange={(e) => handleLabelChange('breed', e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 bg-[#FDFBF7] border border-bento-cream rounded-lg text-bento-dark font-bold text-xs shadow-sm"
                  />
                </div>

                {/* Option editor for Breed */}
                <div className="mt-4 pt-4 border-t border-bento-cream/60">
                  <span className="block text-[11px] font-bold text-bento-dark mb-2">管理品種/種類下拉選項：</span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {template.breed.options?.map((opt, i) => (
                      <span key={i} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-bento-sand/50 text-bento-dark font-bold text-xs rounded-xl border border-bento-cream">
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption('breed', i)}
                          className="hover:text-red-650 text-bento-mid font-black cursor-pointer bg-transparent border-none text-xs ml-1 focus:outline-none"
                          title="移除選項"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="新增種類名稱 (例：台農71號)"
                      value={newOptions.breed}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, breed: e.target.value }))}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddOption('breed'); } }}
                      className="flex-1 px-3 py-1.5 bg-[#FDFBF7] border border-bento-cream rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOption('breed')}
                      className="px-3 bg-bento-dark text-white text-xs font-black rounded-lg hover:opacity-90 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section B: 時程管理與儲料儲位 */}
          <div className="pt-6">
            <h4 className="text-xs font-black text-[#5c4021] uppercase tracking-wider mb-4 flex items-center bg-bento-sand/40 px-3 py-1.5 rounded-lg w-max">
              第二分類：收穫時程與儲位 (B)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Harvest Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  採收日期標題 ({template.harvestDate.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.harvestDate.customLabel}
                  onChange={(e) => handleLabelChange('harvestDate', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

              {/* Entry Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  入庫日期標題 ({template.entryDate.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.entryDate.customLabel}
                  onChange={(e) => handleLabelChange('entryDate', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

              {/* Warehouse Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  儲位標題 ({template.warehouseLocation.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.warehouseLocation.customLabel}
                  onChange={(e) => handleLabelChange('warehouseLocation', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Section C: 重量、水分、與測量數值自訂 */}
          <div className="pt-6">
            <h4 className="text-xs font-black text-[#5c4021] uppercase tracking-wider mb-4 flex items-center bg-bento-sand/40 px-3 py-1.5 rounded-lg w-max">
              第三分類：進貨重量與科學檢驗數值 (C)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Weight */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  重量欄位標題 ({template.weight.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.weight.customLabel}
                  onChange={(e) => handleLabelChange('weight', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

              {/* Moisture */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  水分欄位標題 ({template.moisture.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.moisture.customLabel}
                  onChange={(e) => handleLabelChange('moisture', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

              {/* OilContent */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  含油率/第二特徵標題 ({template.oilContent.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.oilContent.customLabel}
                  onChange={(e) => handleLabelChange('oilContent', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Section D: 品質、檢定證書認證、與庫存存放 */}
          <div className="pt-6">
            <h4 className="text-xs font-black text-[#5c4021] uppercase tracking-wider mb-4 flex items-center bg-bento-sand/40 px-3 py-1.5 rounded-lg w-max">
              第四分類：核定證書、認證等級與狀態 (D)
            </h4>

            <div className="space-y-6">
              {/* Toxin Status Dropdown preset list */}
              <div className="space-y-2 border border-bento-cream p-4 rounded-2xl bg-white shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-bento-dark">
                      檢驗認證項目名稱1 ({template.toxinStatus.defaultLabel})
                    </label>
                    <p className="text-[10px] text-bento-mid">例如：多氯聯苯、無殘毒、重金屬檢測、或 SGS 認證結果。</p>
                  </div>
                  <input
                    type="text"
                    required
                    value={template.toxinStatus.customLabel}
                    onChange={(e) => handleLabelChange('toxinStatus', e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 bg-[#FDFBF7] border border-bento-cream rounded-lg text-bento-dark font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-bento-cream/60">
                  <span className="block text-[11px] font-bold text-bento-dark mb-2">自訂此檢測項目選單選項：</span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {template.toxinStatus.options?.map((opt, i) => (
                      <span key={i} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-bento-sand/50 text-bento-dark font-bold text-xs rounded-xl border border-bento-cream">
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption('toxinStatus', i)}
                          className="hover:text-red-650 text-bento-mid font-black cursor-pointer bg-transparent border-none text-xs ml-1 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="新增檢測狀態選項"
                      value={newOptions.toxinStatus}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, toxinStatus: e.target.value }))}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddOption('toxinStatus'); } }}
                      className="flex-1 px-3 py-1.5 bg-[#FDFBF7] border border-bento-cream rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOption('toxinStatus')}
                      className="px-3 bg-bento-dark text-white text-xs font-black rounded-lg hover:opacity-90 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quality Grade Dropdown presets */}
              <div className="space-y-2 border border-bento-cream p-4 rounded-2xl bg-white shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-bento-dark">
                      核定級別項目名稱2 ({template.grade.defaultLabel})
                    </label>
                    <p className="text-[10px] text-bento-mid">產品、產出、作物或茶葉的核定分級，例如：特級、一等品、外銷專供.</p>
                  </div>
                  <input
                    type="text"
                    required
                    value={template.grade.customLabel}
                    onChange={(e) => handleLabelChange('grade', e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 bg-[#FDFBF7] border border-bento-cream rounded-lg text-bento-dark font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-bento-cream/60">
                  <span className="block text-[11px] font-bold text-bento-dark mb-2">自訂此核定級別清單：</span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {template.grade.options?.map((opt, i) => (
                      <span key={i} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-bento-sand/50 text-bento-dark font-bold text-xs rounded-xl border border-bento-cream">
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption('grade', i)}
                          className="hover:text-red-650 text-bento-mid font-black cursor-pointer bg-transparent border-none text-xs ml-1 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="新增級別名稱"
                      value={newOptions.grade}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, grade: e.target.value }))}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddOption('grade'); } }}
                      className="flex-1 px-3 py-1.5 bg-[#FDFBF7] border border-bento-cream rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOption('grade')}
                      className="px-3 bg-bento-dark text-white text-xs font-black rounded-lg hover:opacity-90 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Remarks label */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-bento-dark">
                  備註與報告欄題標題 ({template.remarks.defaultLabel})
                </label>
                <input
                  type="text"
                  required
                  value={template.remarks.customLabel}
                  onChange={(e) => handleLabelChange('remarks', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark font-semibold text-sm shadow-sm"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Buttons / Actions */}
        <div className="pt-6 border-t border-bento-cream flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1 mx-auto sm:mx-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>還原預設花生範本</span>
          </button>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-bento-cream hover:bg-bento-sand bg-white text-bento-dark rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              取消返回
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-bento-dark hover:opacity-90 text-white font-extrabold rounded-xl shadow-md disabled:opacity-50 transition-all text-sm flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>正在儲存...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>儲存設定 (即時生效)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
