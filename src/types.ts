/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PeanutBatch {
  id: string; // Unique traceability ID (e.g., PN-20260601-XXXX)
  breed: string; // 品種 (e.g. 台南14號, 黑金剛, etc.)
  farmer: string; // 農民姓名
  harvestDate: string; // 採收日期 (YYYY-MM-DD)
  entryDate: string; // 入庫日期 (YYYY-MM-DD)
  weight: number; // 重量 (公斤)
  moisture: number; // 水分含量 (%)
  oilContent: number; // 含油量 (%)
  toxinStatus: string; // 黃麴毒素檢驗狀態 (e.g. 未檢出, 合格, etc.)
  grade: string; // 級別/等級 (e.g. 特級, 優等, etc.)
  warehouseLocation: string; // 倉庫儲位 (e.g., A-3, B-1)
  status: '在庫' | '已出庫'; // 庫存狀態
  remarks?: string; // 備註
  createdAt: string; // 建立日期時間 (ISO String)
  customFields?: { label: string; value: string }[]; // 自訂額外履歷項目
}

export interface FieldConfig {
  key: string;
  defaultLabel: string;
  customLabel: string;
  options?: string[];
}

export interface AppTemplate {
  id: FieldConfig;
  breed: FieldConfig;
  farmer: FieldConfig;
  harvestDate: FieldConfig;
  entryDate: FieldConfig;
  warehouseLocation: FieldConfig;
  weight: FieldConfig;
  moisture: FieldConfig;
  oilContent: FieldConfig;
  toxinStatus: FieldConfig;
  grade: FieldConfig;
  status: FieldConfig;
  remarks: FieldConfig;
}

export const DEFAULT_TEMPLATE: AppTemplate = {
  id: { key: 'id', defaultLabel: '履歷編號', customLabel: '履歷編號' },
  breed: { 
    key: 'breed', 
    defaultLabel: '農作網物品種/種類', 
    customLabel: '農作物種類/品種',
    options: [
      '台南14號 (主要食用/大粒)',
      '台南9號 (大仁豆/傳統油豆)',
      '黑金剛 (黑皮/高花青素)',
      '花沙 (紅白雙色/口感細緻)',
      '台南16號',
      '澎湖油豆',
      '其他品種'
    ]
  },
  farmer: { key: 'farmer', defaultLabel: '栽種農民姓名', customLabel: '栽種農作農民' },
  harvestDate: { key: 'harvestDate', defaultLabel: '採收日期', customLabel: '採收日期' },
  entryDate: { key: 'entryDate', defaultLabel: '倉庫入庫日期', customLabel: '入庫日期' },
  warehouseLocation: { key: 'warehouseLocation', defaultLabel: '倉庫存放儲位', customLabel: '倉庫儲位編號' },
  weight: { key: 'weight', defaultLabel: '進庫重量 (公斤)', customLabel: '進庫淨重量(公斤)' },
  moisture: { key: 'moisture', defaultLabel: '水分比率測量 (%)', customLabel: '平均含水量(%)' },
  oilContent: { key: 'oilContent', defaultLabel: '含油率質測量 (%)', customLabel: '平均含油量(%)' },
  toxinStatus: { 
    key: 'toxinStatus', 
    defaultLabel: '黃麴毒素檢測結果', 
    customLabel: '黃麴毒素檢定結果',
    options: ['未檢出', '合格', '超標', '未檢']
  },
  grade: { 
    key: 'grade', 
    defaultLabel: '核定品質級別', 
    customLabel: '核定品質級別',
    options: ['特級', '優等', '合格', '淘汰']
  },
  status: { 
    key: 'status', 
    defaultLabel: '庫存存放狀態', 
    customLabel: '庫存保管狀態',
    options: ['在庫', '已出庫']
  },
  remarks: { key: 'remarks', defaultLabel: '補充記錄備註', customLabel: '附加說明與備註' }
};

export interface AdminConfig {
  passwordHash: string; // SHA-256 hashed password
  createdAt: string; // Timestamp
}

export type AppTab = 'trace' | 'admin';
