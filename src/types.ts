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
  toxinStatus: '合格' | '未檢出' | '微量合格' | '超標' | '未檢'; // 黃麴毒素檢驗狀態
  grade: '特級' | '優等' | '合格' | '淘汰'; // 級別/等級
  warehouseLocation: string; // 倉庫儲位 (e.g., A-3, B-1)
  status: '在庫' | '已出庫'; // 庫存狀態
  remarks?: string; // 備註
  createdAt: string; // 建立日期時間 (ISO String)
  customFields?: { label: string; value: string }[]; // 自訂額外履歷項目
}

export interface AdminConfig {
  passwordHash: string; // SHA-256 hashed password
  createdAt: string; // Timestamp
}

export type AppTab = 'trace' | 'admin';
