/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PeanutBatch, AppTemplate } from './types';

/**
 * Hash a text string using native SHA-256
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a descriptive, unique manual trace ID: PN-YYYYMMDD-XXXX
 */
export function generateTraceabilityId(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // 4 random alphanumeric characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing letters like I, O, 0, 1
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `PN-${year}${month}${day}-${randomPart}`;
}

/**
 * Export peanut batch array to a downloadable Excel-friendly CSV with UTF-8 BOM
 */
export function downloadPeanutsCSV(batches: PeanutBatch[], template?: AppTemplate) {
  const headers = template ? [
    template.id.customLabel,
    template.breed.customLabel,
    template.farmer.customLabel,
    template.harvestDate.customLabel,
    template.entryDate.customLabel,
    template.weight.customLabel,
    template.moisture.customLabel,
    template.oilContent.customLabel,
    template.toxinStatus.customLabel,
    template.grade.customLabel,
    template.warehouseLocation.customLabel,
    template.status.customLabel,
    template.remarks.customLabel,
    '建立時間'
  ] : [
    '履歷溯源編號',
    '品種',
    '農民姓名',
    '採收日期',
    '入庫日期',
    '重量(公斤)',
    '水分含量(%)',
    '含油量(%)',
    '黃麴毒素檢驗',
    '等級級別',
    '倉庫儲位',
    '庫存狀態',
    '備註說明',
    '建立時間'
  ];

  const rows = batches.map(b => [
    b.id,
    b.breed,
    b.farmer,
    b.harvestDate,
    b.entryDate,
    b.weight,
    b.moisture,
    b.oilContent,
    b.toxinStatus,
    b.grade,
    b.warehouseLocation,
    b.status,
    b.remarks || '',
    b.createdAt
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(val => {
      // Escape commas and double-quotes in fields
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(','))
  ].join('\n');

  // Excel needs UTF-8 BOM (\uFEFF) to read Traditional Chinese characters correctly
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filenamePrefix = template?.breed.customLabel || '履歷';
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}在庫履歷盤點表_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
