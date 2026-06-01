/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PeanutBatch } from '../types';
import { Search, ScanLine, ShieldCheck, HelpCircle, Leaf, Sparkles, BookOpen, Warehouse, Heart } from 'lucide-react';
import BatchDetails from './BatchDetails';

interface TraceabilityViewProps {
  batches: PeanutBatch[];
  qrQueryId: string | null;
  onClearQueryId: () => void;
  onOpenScanner: () => void;
}

export default function TraceabilityView({
  batches,
  qrQueryId,
  onClearQueryId,
  onOpenScanner,
}: TraceabilityViewProps) {
  const [inputId, setInputId] = useState('');
  const [searchedBatch, setSearchedBatch] = useState<PeanutBatch | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto trigger search if id is present in the URL querystring (e.g., from scanning package QR code)
  useEffect(() => {
    if (qrQueryId) {
      setInputId(qrQueryId);
      const match = batches.find(b => b.id.trim() === qrQueryId.trim());
      if (match) {
        setSearchedBatch(match);
      } else {
        setSearchedBatch(null);
      }
      setHasSearched(true);
    }
  }, [qrQueryId, batches]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onClearQueryId(); // Override previous url-based id
    
    if (!inputId.trim()) return;

    const match = batches.find(
      b => b.id.trim().toLowerCase() === inputId.trim().toLowerCase()
    );

    if (match) {
      setSearchedBatch(match);
    } else {
      setSearchedBatch(null);
    }
    setHasSearched(true);
  };

  const clearSearch = () => {
    setInputId('');
    setSearchedBatch(null);
    setHasSearched(false);
    onClearQueryId();
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto my-6 animate-fade-in">
      
      {/* Search Bar section (Header) */}
      {!searchedBatch && (
        <div id="search-bar-bento" className="bg-white p-6 md:p-10 rounded-3xl border border-bento-cream shadow-[0_4px_20px_rgba(74,55,40,0.05)] text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="inline-flex p-3 bg-bento-cream text-bento-dark rounded-2xl animate-bounce" style={{ animationDuration: '3s' }}>
              <ShieldCheck className="w-8 h-8 text-bento-dark" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-bento-dark">台灣安心花生．履歷溯源查詢專區</h2>
            <p className="text-xs text-bento-mid leading-relaxed">
              為了讓您吃得安心，我們提供每袋花生完整的種植來源、採收日期、水分含油及黃麴毒素實驗合格報告。您可以手動輸入包裝貼紙上的「溯源編號」或啟動相機進行條碼掃描查詢。
            </p>
          </div>

          {/* Search Box Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-bento-mid" />
              <input
                type="text"
                id="trace-id-input"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="請輸入履歷溯源編號 (例: PN-...)"
                className="w-full pl-11 pr-4 py-3 bg-[#FDFBF7] border border-bento-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-dark text-bento-dark text-sm font-mono placeholder-bento-mid font-bold shadow-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onOpenScanner}
                className="p-3 bg-bento-sand hover:bg-bento-cream border border-bento-cream text-bento-dark rounded-xl transition-all shrink-0 cursor-pointer"
                title="啟動相機掃描 QR Code"
              >
                <ScanLine className="w-5 h-5 text-bento-dark" />
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-initial px-6 py-3 bg-bento-dark hover:opacity-90 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all text-sm whitespace-nowrap"
              >
                履歷追溯
              </button>
            </div>
          </form>

          {/* If search query failed */}
          {hasSearched && !searchedBatch && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs text-left max-w-md mx-auto flex items-start space-x-2">
              <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5 fill-red-100" />
              <div>
                <strong className="block font-semibold">查無此履歷編號</strong>
                <span className="leading-relaxed">
                  系統庫存中無「{inputId}」的任何登錄記錄。請檢查拼寫（注意英文字母大小寫與連字號），或點擊左上方相機進行實體貼紙掃描。
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Searched Batch Certificate Details */}
      {searchedBatch && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-bento-sand border border-bento-cream p-4 rounded-2xl text-bento-dark text-xs gap-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                驗證成功：此為 <strong className="text-bento-dark">{searchedBatch.farmer}</strong> 在 <strong className="text-bento-dark">{searchedBatch.harvestDate}</strong> 採收的黃金花生，安全數據確實登錄。
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="px-4 py-1.5 bg-white hover:bg-bento-sand border border-bento-cream text-bento-dark rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
            >
              查詢其他批次
            </button>
          </div>

          <BatchDetails
            batch={searchedBatch}
            onBack={clearSearch}
            isAdminMode={false}
          />
        </div>
      )}

      {/* Consumer Education Card (visible when not viewing details) */}
      {!searchedBatch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1 */}
          <div className="bg-white border border-bento-cream p-6 rounded-3xl shadow-[0_4px_20px_rgba(74,55,40,0.05)] space-y-3">
            <div className="p-2.5 bg-bento-sand rounded-xl inline-block text-bento-dark">
              <Leaf className="w-5 h-5 text-bento-dark" />
            </div>
            <h4 className="font-extrabold text-bento-dark text-base">嚴格的品種履歷</h4>
            <span className="block text-bento-mid text-[10px] uppercase font-mono tracking-wider">1. Local Seed Varieties</span>
            <p className="text-bento-mid text-xs leading-relaxed">
              對口農有著世代傳承的耕作經驗。主要收購飽滿細密的大粒台南 14 號，及適合榨取優油、芳香濃郁的台南 9 號、黑金剛等台灣在地瑰寶品種。
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-bento-cream p-6 rounded-3xl shadow-[0_4px_20px_rgba(74,55,40,0.05)] space-y-3">
            <div className="p-2.5 bg-bento-sand rounded-xl inline-block text-bento-dark">
              <Warehouse className="w-5 h-5 text-bento-dark" />
            </div>
            <h4 className="font-extrabold text-bento-dark text-base">控溫控濕智能存放</h4>
            <span className="block text-bento-mid text-[10px] uppercase font-mono tracking-wider">2. Strict Grain Silos</span>
            <p className="text-bento-mid text-xs leading-relaxed">
              採購回廠後立即進行精準科學檢測。每一批顆粒均確保維持在含水 10% 以下的安全水位，存放於避光乾燥之通風倉裡，免受外部潮濕污染。
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-bento-cream p-6 rounded-3xl shadow-[0_4px_20px_rgba(74,55,40,0.05)] space-y-3">
            <div className="p-2.5 bg-bento-sand rounded-xl inline-block text-bento-dark">
              <ShieldCheck className="w-5 h-5 text-bento-dark" />
            </div>
            <h4 className="font-extrabold text-bento-dark text-base">黃麴毒素安全監控</h4>
            <span className="block text-bento-mid text-[10px] uppercase font-mono tracking-wider">3. Aflatoxin Free Guarantee</span>
            <p className="text-bento-mid text-xs leading-relaxed">
              黃麴毒素是花生的隱形殺手。我們於進倉與出倉前後，皆對批次樣本採點分析，確保有毒物質達到國家法規並維持「未檢出」之最高安全規範。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
