/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { PeanutBatch } from '../types';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  Printer, ArrowLeft, Calendar, User, ShoppingBag, 
  Database, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, MapPin, Sparkles, Check, Download
} from 'lucide-react';

interface BatchDetailsProps {
  batch: PeanutBatch;
  onBack: () => void;
  isAdminMode: boolean;
  onEdit?: (batch: PeanutBatch) => void;
  onChangeStatus?: (batch: PeanutBatch, newStatus: PeanutBatch['status']) => Promise<void>;
}

export default function BatchDetails({
  batch,
  onBack,
  isAdminMode,
  onEdit,
  onChangeStatus,
}: BatchDetailsProps) {
  // Build self-referential URL containing the batch's QR lookup link
  const qrUrl = `${window.location.origin}?id=${batch.id}`;
  
  // Print certificate or tag
  const handlePrint = () => {
    window.print();
  };

  // Download QR Code as PNG image
  const handleDownloadQR = () => {
    const canvas = document.getElementById(`qr-canvas-download-${batch.id}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR_Code_${batch.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Status tag styles
  const getToxinBadgeStyle = (status: PeanutBatch['toxinStatus']) => {
    switch (status) {
      case '未檢出':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '合格':
      case '微量合格':
        return 'bg-green-50 text-green-700 border-green-200';
      case '超標':
        return 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-200';
    }
  };

  const getGradeBadgeStyle = (grade: PeanutBatch['grade']) => {
    switch (grade) {
      case '特級':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold shadow-sm';
      case '優等':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '合格':
        return 'bg-stone-100 text-stone-800 border-stone-300';
      case '淘汰':
        return 'bg-red-100 text-red-800 border-red-300 font-semibold';
      default:
        return 'bg-stone-50 text-stone-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back navigation - hidden on print */}
      <div className="flex justify-between items-center print:hidden">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-bento-cream hover:bg-bento-sand bg-white text-bento-dark rounded-xl transition-all flex items-center space-x-2 text-sm font-bold shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-bento-dark" />
          <span>返回列表</span>
        </button>

        <div className="flex space-x-2">
          {isAdminMode && onEdit && (
            <button
              onClick={() => onEdit(batch)}
              className="px-4 py-2 border border-bento-cream text-bento-dark bg-white hover:bg-bento-sand rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              編輯資料
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-bento-dark hover:opacity-90 text-white rounded-xl shadow-md flex items-center space-x-1.5 text-sm font-extrabold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>列印履歷卡 / 包裝標籤</span>
          </button>
        </div>
      </div>

      {/* Main card design */}
      <div id="print-area-tag" className="bg-white border-2 border-bento-cream rounded-3xl shadow-[0_4px_24px_rgba(74,55,40,0.06)] overflow-hidden print:border-0 print:shadow-none">
        
        {/* Certificate Watermark Header banner */}
        <div id="print-cert-banner" className="bg-bento-dark text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 print:bg-stone-50 print:text-black print:border-b print:border-stone-400">
          <div className="text-center md:text-left flex items-center space-x-3.5">
            <div className="p-2.5 bg-white/10 rounded-xl hidden md:block">
              <Sparkles className="w-8 h-8 text-bento-cream animate-pulse" />
            </div>
            <div>
              <span className="bg-white/15 border border-white/20 text-bento-cream text-[10px] tracking-wide font-extrabold px-2.5 py-1 rounded-full uppercase">
                TAIWAN PEANUT ORIGINAL
              </span>
              <h2 className="text-2xl font-black font-sans tracking-tight mt-2.5">安心花生生產履歷與檢驗證明</h2>
              <p className="text-bento-cream/90 text-xs mt-1">
                此憑證經手動錄入防竄改儲存，可透過右側 QR 行動溯源碼核實本批物料真偽。
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center p-2 bg-white rounded-xl shadow-md border border-amber-200/50">
            {batch.status === '在庫' ? (
              <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs tracking-wider flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>在庫中</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-stone-500 text-white font-bold rounded-lg text-xs tracking-wider flex items-center space-x-1">
                <span>已出庫</span>
              </span>
            )}
          </div>
        </div>

        {/* Certificate structure */}
        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns - Batch details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Group 1: 基礎溯源 */}
            <div className="bg-[#FDFBF7] border border-bento-cream p-5 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-bento-dark mb-4 flex items-center">
                <User className="w-4 h-4 mr-1.5 text-bento-mid" />
                <span>1. 來源與植物品種資訊</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-xs text-bento-mid">履歷溯源編號</span>
                  <span className="font-mono text-sm font-bold text-bento-dark">{batch.id}</span>
                </div>
                <div>
                  <span className="block text-xs text-bento-mid">花生品種 / 種類</span>
                  <span className="text-sm font-black text-amber-900">{batch.breed}</span>
                </div>
                <div>
                  <span className="block text-xs text-bento-mid">農民姓名</span>
                  <span className="text-sm font-bold text-bento-dark">{batch.farmer}</span>
                </div>
                <div>
                  <span className="block text-xs text-bento-mid">入庫淨重量</span>
                  <span className="text-sm font-bold text-bento-dark">{batch.weight.toLocaleString()} 公斤 (Kg)</span>
                </div>
              </div>
            </div>

            {/* Group 2: 時間與位置 */}
            <div className="bg-[#FDFBF7] border border-bento-cream p-5 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-bento-dark mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-bento-mid" />
                <span>2. 歷史時程與儲位資訊</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-y-4 gap-x-4">
                <div>
                  <span className="block text-xs text-bento-mid">農田採收日期</span>
                  <span className="text-sm font-bold text-bento-dark">{batch.harvestDate}</span>
                </div>
                <div>
                  <span className="block text-xs text-bento-mid">入庫儲存日期</span>
                  <span className="text-sm font-bold text-bento-dark">{batch.entryDate}</span>
                </div>
                <div>
                  <span className="block text-xs text-bento-mid">指定倉庫存放儲位</span>
                  <span className="text-sm font-bold text-amber-800 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-amber-700" />
                    <span>{batch.warehouseLocation}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Group 3: 國家法規指標與品質 */}
            <div className="bg-[#FDFBF7] border border-bento-cream p-5 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-bento-dark mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-1.5 text-bento-mid" />
                <span>3. 物理與生物安全檢驗數據</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-xl border border-bento-cream/60 text-center shadow-sm">
                  <span className="block text-[10px] text-bento-mid font-semibold mb-0.5">水分比率 (Moisture)</span>
                  <span className="text-lg font-extrabold text-bento-dark">{batch.moisture}%</span>
                  <span className="block text-[9px] text-[#8C7A6B] font-medium mt-0.5">合格標準 &lt;10%</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-bento-cream/60 text-center shadow-sm">
                  <span className="block text-[10px] text-bento-mid font-semibold mb-0.5">含油率比 (Oil Ratio)</span>
                  <span className="text-lg font-extrabold text-bento-dark">{batch.oilContent}%</span>
                  <span className="block text-[9px] text-[#8C7A6B] font-medium mt-0.5">正常油質 45-52%</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-bento-cream/60 text-center flex flex-col justify-between shadow-sm">
                  <span className="block text-[10px] text-bento-mid font-semibold mb-1">黃麴毒素測試</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border rounded-md ${getToxinBadgeStyle(batch.toxinStatus)}`}>
                      {batch.toxinStatus}
                    </span>
                  </div>
                  <span className="block text-[8px] text-bento-mid mt-1">CNS 安全標準</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-bento-cream/60 text-center flex flex-col justify-between shadow-sm">
                  <span className="block text-[10px] text-bento-mid font-semibold mb-1">核定品質等級</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 border text-[10px] font-bold rounded-md ${getGradeBadgeStyle(batch.grade)}`}>
                      {batch.grade}
                    </span>
                  </div>
                  <span className="block text-[8px] text-bento-mid mt-1">入庫品管判定</span>
                </div>
              </div>
            </div>

            {/* Group 4: Dynamic Custom Traceability Items */}
            {batch.customFields && batch.customFields.length > 0 && (
              <div className="bg-[#FDFBF7] border border-bento-cream p-5 rounded-2xl animate-fade-in">
                <h3 className="text-xs font-bold uppercase tracking-wider text-bento-dark mb-4 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-bento-mid" />
                  <span>4. 附加履歷項目與自主核定認證</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-left">
                  {batch.customFields.map((field, idx) => (
                    <div key={idx} className="border-b border-bento-cream/40 pb-1.5">
                      <span className="block text-[11px] text-bento-mid font-semibold">{field.label}</span>
                      <span className="text-sm font-bold text-bento-dark break-words">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            {batch.remarks && (
              <div className="bg-bento-sand/40 border border-bento-cream p-4 rounded-xl text-bento-dark text-xs">
                <strong className="block text-bento-dark mb-1">入庫管理員備註</strong>
                <p className="leading-relaxed text-[#5c4a3c]">{batch.remarks}</p>
              </div>
            )}
          </div>

          {/* Right Column - QR Code & Direct Print Template */}
          <div className="flex flex-col items-center bg-[#FDFBF7] p-6 rounded-2xl border border-bento-cream text-center md:h-full justify-between shadow-sm">
            
            <div className="w-full">
              <h4 className="font-extrabold text-bento-dark text-sm mb-1 uppercase tracking-wider">
                批次專屬溯源 QR Code
              </h4>
              <p className="text-bento-mid text-[10px] leading-relaxed max-w-[200px] mx-auto mb-6">
                使用智慧型手機或盤點槍直接掃描此條碼，即可線上立即查詢本批庫存履歷與現況。
              </p>
            </div>

            {/* QR display wrapper */}
            <div className="flex flex-col items-center space-y-3.5 w-full">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-bento-cream inline-block animate-fade-in">
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#4A3728" // Bento Dark Warm Brown for peanut-themes
                  level="Q"
                  includeMargin={true}
                />
                
                {/* Hidden Canvas specifically for downloading high-quality PNG */}
                <div style={{ display: 'none' }}>
                  <QRCodeCanvas
                    id={`qr-canvas-download-${batch.id}`}
                    value={qrUrl}
                    size={512} // larger size for professional high-quality download!
                    bgColor="#ffffff"
                    fgColor="#4A3728"
                    level="H" // higher error correction level for reliable physical scanning
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Download Button - hidden on print */}
              <button
                type="button"
                onClick={handleDownloadQR}
                className="px-4 py-2 border border-bento-cream hover:bg-bento-sand text-bento-dark rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer print:hidden w-full justify-center bg-white"
                title="下載高解析度 QR Code 圖片供隨包裝貼標"
              >
                <Download className="w-4 h-4 text-bento-dark" />
                <span>下載 QR Code 圖片 (PNG)</span>
              </button>
            </div>

            <div className="mt-6 w-full">
              <span className="block text-bento-mid text-[10px] uppercase font-mono tracking-wider">
                Scan ID Address
              </span>
              <span className="block text-bento-dark font-mono text-[11px] select-all bg-white px-2 py-1.5 border border-bento-cream rounded mt-1 overflow-x-auto whitespace-pre no-scrollbar">
                {batch.id}
              </span>
            </div>

            {/* Quick action buttons within admin details */}
            {isAdminMode && onChangeStatus && (
              <div className="mt-8 pt-4 border-t border-bento-cream w-full text-left print:hidden">
                <span className="block text-xs font-bold text-bento-dark mb-2.5">
                  快速更新狀態：
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onChangeStatus(batch, '在庫')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                      batch.status === '在庫'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white border-bento-cream text-bento-dark hover:bg-bento-sand'
                    }`}
                  >
                    標記 在庫
                  </button>
                  <button
                    onClick={() => onChangeStatus(batch, '已出庫')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                      batch.status === '已出庫'
                        ? 'bg-bento-dark border-bento-dark text-white shadow-sm'
                        : 'bg-white border-bento-cream text-bento-dark hover:bg-bento-sand'
                    }`}
                  >
                    標記 已出庫
                  </button>
                </div>
              </div>
            )}
            
            <div className="hidden print:block mt-8 text-center text-[10px] text-stone-400 border-t border-dashed border-stone-300 pt-4 w-full">
              <p>落實生產履歷，保障消費者健康益處</p>
              <p className="font-mono mt-0.5">{window.location.origin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Printer styles inject (only applied when printing is triggered) */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          /* Hide navigation, background controls, margins */
          .print\\:hidden, #admin-login-wrapper, header, footer, button, .navbar, .tab-buttons {
            display: none !important;
          }
          #print-area-tag {
            border: 2px solid #57534e !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          #print-cert-banner {
            background: #fafaf9 !important;
            border-bottom: 2px solid #57534e !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
