/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PeanutBatch, AppTemplate } from '../types';
import { downloadPeanutsCSV } from '../utils';
import { 
  Search, SlidersHorizontal, ArrowDownAZ, LayoutGrid, ListFilter, 
  Trash2, FileDown, Plus, Eye, Edit, Box, RefreshCw, ScanLine, 
  Tag, DownloadCloud, Database, AlertCircle, TrendingUp, Droplets, Scale
} from 'lucide-react';

interface InventoryTableProps {
  batches: PeanutBatch[];
  onSelectBatch: (batch: PeanutBatch) => void;
  onEditBatch: (batch: PeanutBatch) => void;
  onDeleteBatch: (id: string) => Promise<void>;
  onAddNewBatch: () => void;
  onOpenScanner: () => void;
  onChangeStatus: (batch: PeanutBatch, newStatus: PeanutBatch['status']) => Promise<void>;
  template: AppTemplate;
}

export default function InventoryTable({
  batches,
  onSelectBatch,
  onEditBatch,
  onDeleteBatch,
  onAddNewBatch,
  onOpenScanner,
  onChangeStatus,
  template,
}: InventoryTableProps) {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('全部品種');
  const [selectedStatus, setSelectedStatus] = useState('全部狀態');
  const [selectedGrade, setSelectedGrade] = useState('全部等級');
  const [selectedToxin, setSelectedToxin] = useState('全部檢測');
  const [sortBy, setSortBy] = useState<'entryDate' | 'weight' | 'moisture'>('entryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dynamic Breed Options from active batches
  const breedOptions = useMemo(() => {
    const list = new Set(batches.map(b => b.breed));
    return ['全部品種', ...Array.from(list)];
  }, [batches]);

  // Handle deletion confirmation safety
  const confirmDelete = async (batch: PeanutBatch) => {
    const confirmed = window.confirm(`警告：您確定要永久刪除批次「${batch.id}」(${batch.farmer} / ${batch.breed}) 的履歷資料與 QR Code 嗎？此操作將無法還原。`);
    if (confirmed) {
      await onDeleteBatch(batch.id);
    }
  };

  // Filtered & Sorted batches
  const processedBatches = useMemo(() => {
    return batches
      .filter(b => {
        // Search text: match ID, Farmer, warehouse location or remarks
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q || 
          b.id.toLowerCase().includes(q) || 
          b.farmer.toLowerCase().includes(q) || 
          b.warehouseLocation.toLowerCase().includes(q) || 
          (b.remarks && b.remarks.toLowerCase().includes(q));

        // Filters
        const matchesBreed = selectedBreed === '全部品種' || b.breed === selectedBreed;
        const matchesStatus = selectedStatus === '全部狀態' || b.status === selectedStatus;
        const matchesGrade = selectedGrade === '全部等級' || b.grade === selectedGrade;
        const matchesToxin = selectedToxin === '全部檢測' || b.toxinStatus === selectedToxin;

        return matchesSearch && matchesBreed && matchesStatus && matchesGrade && matchesToxin;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'entryDate') {
          valA = new Date(a.entryDate).getTime();
          valB = new Date(b.entryDate).getTime();
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [batches, searchQuery, selectedBreed, selectedStatus, selectedGrade, selectedToxin, sortBy, sortOrder]);

  // Aggregate Metrics over processed batches
  const stats = useMemo(() => {
    const counts = processedBatches.length;
    const inStock = processedBatches.filter(b => b.status === '在庫');
    const totalWeight = inStock.reduce((acc, curr) => acc + curr.weight, 0);
    
    // Average moisture/oil of stored peanuts
    const validMoistures = inStock.filter(b => typeof b.moisture === 'number');
    const avgMoisture = validMoistures.length 
      ? (validMoistures.reduce((acc, curr) => acc + curr.moisture, 0) / validMoistures.length).toFixed(1) 
      : '0';

    const validOils = inStock.filter(b => typeof b.oilContent === 'number');
    const avgOil = validOils.length 
      ? (validOils.reduce((acc, curr) => acc + curr.oilContent, 0) / validOils.length).toFixed(1) 
      : '0';

    return {
      counts,
      totalWeight,
      avgMoisture,
      avgOil,
    };
  }, [processedBatches]);

  const toggleSort = (nextSort: typeof sortBy) => {
    if (sortBy === nextSort) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(nextSort);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ⚠️ Metrics KPI Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
        {/* KPI 1 */}
        <div className="bg-white border-2 border-bento-cream p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-bento-cream text-bento-dark rounded-xl shrink-0">
            <Database className="w-5 h-5 text-bento-dark" />
          </div>
          <div>
            <span className="block text-[10px] text-bento-mid font-bold uppercase tracking-wider">篩選批次總數</span>
            <span className="text-xl font-black text-bento-dark">{stats.counts} <span className="text-xs font-normal text-bento-mid">批</span></span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border-2 border-bento-cream p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-[#FCF5E9] text-bento-dark rounded-xl shrink-0">
            <Scale className="w-5 h-5 text-bento-dark" />
          </div>
          <div>
            <span className="block text-[10px] text-bento-mid font-bold uppercase tracking-wider">在存放{template.breed.customLabel}重量</span>
            <span className="text-xl font-black text-bento-dark">
              {stats.totalWeight.toLocaleString()} <span className="text-xs font-normal text-bento-mid">單位</span>
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border-2 border-bento-cream p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-[#E5F3FE] text-blue-800 rounded-xl shrink-0">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="block text-[10px] text-bento-mid font-bold uppercase tracking-wider">平均{template.moisture.customLabel}</span>
            <span className="text-xl font-black text-bento-dark">{stats.avgMoisture}%</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border-2 border-bento-cream p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-[#FCF9DC] text-[#71611C] rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <span className="block text-[10px] text-bento-mid font-bold uppercase tracking-wider">平均{template.oilContent.customLabel}</span>
            <span className="text-xl font-black text-bento-dark">{stats.avgOil}%</span>
          </div>
        </div>
      </div>

      {/* Control Actions & Advanced Filter section */}
      <div className="bg-white border-2 border-bento-cream rounded-3xl shadow-[0_4px_20px_rgba(74,55,40,0.04)] overflow-hidden p-6 space-y-5">
        
        {/* Row 1: Direct Actions */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-bento-mid" />
            <input
              type="text"
              id="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋農民、批次編號、儲位或備註資訊..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-bento-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-dark text-sm placeholder-bento-mid text-bento-dark font-medium shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Camera scanner trigger */}
            <button
              id="trigger-scan"
              onClick={onOpenScanner}
              className="py-2.5 px-4 bg-bento-sand hover:bg-bento-cream border border-bento-cream rounded-xl text-xs font-bold text-bento-dark flex items-center space-x-1.5 transition-all cursor-pointer"
              title="使用相機掃描條碼以快速查詢定位"
            >
              <ScanLine className="w-4 h-4 text-bento-dark" />
              <span>條碼掃描查詢</span>
            </button>

            {/* Export */}
            <button
              id="export-csv"
              disabled={processedBatches.length === 0}
              onClick={() => downloadPeanutsCSV(processedBatches, template)}
              className="py-2.5 px-4 bg-white hover:bg-bento-sand border border-bento-cream text-bento-dark rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-bento-dark" />
              <span>匯出篩選數據 (CSV)</span>
            </button>

            {/* Create */}
            <button
              id="add-new-batch"
              onClick={onAddNewBatch}
              className="py-2.5 px-4 bg-bento-dark hover:opacity-90 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>手動錄入新批次</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filtering Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-bento-sand/40 p-4 rounded-2xl border border-bento-cream/60">
          
          {/* Breed */}
          <div>
            <label className="block text-[10px] text-bento-dark font-extrabold mb-1.5 uppercase tracking-wider">{template.breed.customLabel}</label>
            <select
              id="filter-breed"
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="w-full bg-white border border-bento-cream rounded-xl px-3 py-2 text-xs text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark font-semibold shadow-sm"
            >
              {breedOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] text-bento-dark font-extrabold mb-1.5 uppercase tracking-wider">{template.status.customLabel}</label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-bento-cream rounded-xl px-3 py-2 text-xs text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark font-semibold shadow-sm"
            >
              <option value="全部狀態">全部狀態</option>
              <option value="在庫">在庫 (保管中)</option>
              <option value="已出庫">已出庫 (已發貨)</option>
            </select>
          </div>

          {/* Quality Grade */}
          <div>
            <label className="block text-[10px] text-bento-dark font-extrabold mb-1.5 uppercase tracking-wider">{template.grade.customLabel}</label>
            <select
              id="filter-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-white border border-bento-cream rounded-xl px-3 py-2 text-xs text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark font-semibold shadow-sm"
            >
              <option value="全部等級">全部等級</option>
              {template.grade.options?.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              )) || (
                <>
                  <option value="特級">特級 (優選)</option>
                  <option value="優等">優等</option>
                  <option value="合格">合格</option>
                  <option value="淘汰">淘汰</option>
                </>
              )}
            </select>
          </div>

          {/* Toxin status */}
          <div>
            <label className="block text-[10px] text-bento-dark font-extrabold mb-1.5 uppercase tracking-wider">{template.toxinStatus.customLabel}</label>
            <select
              id="filter-toxin"
              value={selectedToxin}
              onChange={(e) => setSelectedToxin(e.target.value)}
              className="w-full bg-[#FCFBF7] border border-bento-cream rounded-xl px-3 py-2 text-xs text-bento-dark focus:outline-none focus:ring-2 focus:ring-bento-dark font-semibold shadow-sm"
            >
              <option value="全部檢測">全部檢測</option>
              {template.toxinStatus.options?.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              )) || (
                <>
                  <option value="未檢出">未檢出 (安全)</option>
                  <option value="合格">合格</option>
                  <option value="超標">超標 (高風險)</option>
                  <option value="未檢">未檢 (報告中)</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white border-2 border-bento-cream rounded-3xl shadow-[0_4px_24px_rgba(74,55,40,0.05)] overflow-hidden">
        {processedBatches.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 bg-bento-sand rounded-full flex items-center justify-center text-bento-dark mx-auto">
              <Box className="w-6 h-6" />
            </div>
            <p className="text-bento-dark text-sm font-extrabold">此篩選條件下，無任何{template.breed.customLabel}履歷資料。</p>
            <p className="text-bento-mid text-xs">您可以嘗試調整篩選條件或點擊「手動錄入新批次」建立一筆新履歷。</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-bento-cream bg-bento-sand/30 text-bento-dark text-[11px] font-black tracking-wider uppercase">
                  <th className="py-4 px-5">{template.id.customLabel}</th>
                  <th className="py-4 px-4 font-sans">{template.breed.customLabel}</th>
                  <th className="py-4 px-4">{template.farmer.customLabel}</th>
                  <th 
                    className="py-4 px-4 cursor-pointer hover:text-bento-dark transition-colors"
                    onClick={() => toggleSort('entryDate')}
                  >
                    <span>{template.entryDate.customLabel}</span>
                    {sortBy === 'entryDate' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </th>
                  <th 
                    className="py-4 px-4 text-right cursor-pointer hover:text-bento-dark transition-colors"
                    onClick={() => toggleSort('weight')}
                  >
                    <span>{template.weight.customLabel}</span>
                    {sortBy === 'weight' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </th>
                  <th 
                    className="py-4 px-4 text-right cursor-pointer hover:text-bento-dark transition-colors"
                    onClick={() => toggleSort('moisture')}
                  >
                    <span>{template.moisture.customLabel}</span>
                    {sortBy === 'moisture' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </th>
                  <th className="py-4 px-4 text-center">{template.toxinStatus.customLabel}</th>
                  <th className="py-4 px-4 text-center">{template.grade.customLabel}</th>
                  <th className="py-4 px-4">{template.warehouseLocation.customLabel}</th>
                  <th className="py-4 px-4 text-center">{template.status.customLabel}</th>
                  <th className="py-4 px-5 text-right font-black">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bento-cream text-bento-dark text-xs">
                {processedBatches.map((batch) => {
                  return (
                    <tr 
                      key={batch.id} 
                      className="hover:bg-bento-sand/20 active:bg-bento-sand/40 transition-colors cursor-pointer"
                      onClick={() => onSelectBatch(batch)}
                    >
                      {/* ID */}
                      <td className="py-4 px-5 font-mono font-bold text-[#5c4021]" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => onSelectBatch(batch)}
                          className="hover:underline text-[11px] tracking-tight bg-[#FDFBF7] px-2 py-1 border border-bento-cream rounded-lg text-left font-mono cursor-pointer shadow-sm"
                        >
                          {batch.id}
                        </button>
                      </td>

                      {/* breed */}
                      <td className="py-4 px-4 font-bold text-bento-dark">{batch.breed}</td>

                      {/* Farmer */}
                      <td className="py-4 px-4 font-medium">{batch.farmer}</td>

                      {/* EntryDate */}
                      <td className="py-4 px-4 whitespace-nowrap font-medium">{batch.entryDate}</td>

                      {/* Weight */}
                      <td className="py-4 px-4 text-right font-bold text-bento-dark">
                        {batch.weight.toLocaleString()} 公斤
                      </td>

                      {/* Moisture */}
                      <td className="py-4 px-4 text-right font-medium">{batch.moisture}%</td>

                      {/* Toxin Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          batch.toxinStatus === '未檢出' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : batch.toxinStatus === '合格'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : batch.toxinStatus === '超擺' || batch.toxinStatus === '超標'
                                ? 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold'
                                : 'bg-stone-50 text-stone-500 border-stone-200'
                        }`}>
                          {batch.toxinStatus}
                        </span>
                      </td>

                      {/* Grade */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          batch.grade === '特級'
                            ? 'bg-[#E3D5C1] text-[#4A3728] border-[#D3C5B1]'
                            : batch.grade === '優等'
                              ? 'bg-bento-sand/50 text-bento-dark border-bento-cream'
                              : batch.grade === '合格'
                                ? 'bg-stone-50 text-stone-600 border-stone-200'
                                : 'bg-red-50 text-red-750 border-red-200'
                        }`}>
                          {batch.grade}
                        </span>
                      </td>

                      {/* Warehouse Location */}
                      <td className="py-4 px-4 font-medium text-[#5c4a3c]">{batch.warehouseLocation}</td>

                      {/* Status quick toggle */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={batch.status}
                          onChange={async (e) => {
                            await onChangeStatus(batch, e.target.value as PeanutBatch['status']);
                          }}
                          className={`text-[10px] font-bold rounded-lg px-2 py-1 select-none focus:outline-none border cursor-pointer ${
                            batch.status === '在庫'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}
                        >
                          <option value="在庫">在庫中</option>
                          <option value="已出庫">已出庫</option>
                        </select>
                      </td>

                      {/* Row actions */}
                      <td className="py-4 px-5 text-right w-[110px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            title="檢視履歷證書"
                            onClick={() => onSelectBatch(batch)}
                            className="p-1 px-1.5 hover:bg-bento-sand/60 text-bento-mid hover:text-bento-dark rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            title="編輯"
                            onClick={() => onEditBatch(batch)}
                            className="p-1 px-1.5 hover:bg-bento-sand/60 text-[#8B5A2B] hover:text-[#5c4021] rounded-lg transition-all cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            title="刪除"
                            onClick={() => confirmDelete(batch)}
                            className="p-1 px-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
