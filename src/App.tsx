/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { PeanutBatch, AppTemplate, DEFAULT_TEMPLATE } from './types';

// Components
import TraceabilityView from './components/TraceabilityView';
import AdminLogin from './components/AdminLogin';
import InventoryTable from './components/InventoryTable';
import PeanutForm from './components/PeanutForm';
import BatchDetails from './components/BatchDetails';
import QRScanner from './components/QRScanner';
import TemplateEditor from './components/TemplateEditor';

// Utilities
import { 
  Database, ShieldCheck, Search, LogOut, KeyRound, 
  HelpCircle, Sparkles, Loader, AlertCircle, RefreshCw, Eye, Settings
} from 'lucide-react';

export default function App() {
  // DB states
  const [batches, setBatches] = useState<PeanutBatch[]>([]);
  const [storedHash, setStoredHash] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  
  // Custom Dynamic Template fields configuration state
  const [template, setTemplate] = useState<AppTemplate>(DEFAULT_TEMPLATE);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // App routing and sessions
  const [activeTab, setActiveTab] = useState<'trace' | 'admin'>('trace');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  
  // Admin inner views
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<PeanutBatch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<PeanutBatch | null>(null);

  // QR scanning modal state
  const [showScanner, setShowScanner] = useState(false);
  
  // URL parameters query (instant trace ID on boot)
  const [qrQueryId, setQrQueryId] = useState<string | null>(null);

  // Check URL parameters for direct tracing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      setQrQueryId(idParam);
      setActiveTab('trace');
    }
  }, []);

  // Sync check session storage for admin login
  useEffect(() => {
    const cachedLoggedIn = sessionStorage.getItem('peanut_admin_auth');
    if (cachedLoggedIn === 'true') {
      setAdminLoggedIn(true);
    }
  }, []);

  // Fetch Admin config
  useEffect(() => {
    const configRef = doc(db, 'system', 'config');
    getDoc(configRef).then((docSnap) => {
      if (docSnap.exists()) {
        setStoredHash(docSnap.data().passwordHash);
      } else {
        setStoredHash(null);
      }
      setIsLoadingConfig(false);
    }).catch((err) => {
      console.error('Failed to load admin config:', err);
      setIsLoadingConfig(false);
    });
  }, []);

  // Realtime subscription for layout template
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'template'),
      (docSnap) => {
        if (docSnap.exists()) {
          setTemplate(docSnap.data() as AppTemplate);
        } else {
          setTemplate(DEFAULT_TEMPLATE);
        }
      },
      (error) => {
        console.error('Failed to load template layout:', error);
      }
    );
    return () => unsub();
  }, []);

  // Realtime subscription for peanut batches
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'peanut_batches'), 
      (snapshot) => {
        const items: PeanutBatch[] = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data() } as PeanutBatch);
        });
        setBatches(items);
        setIsLoadingBatches(false);
      },
      (error) => {
        // Log formatted exception
        handleFirestoreError(error, OperationType.LIST, 'peanut_batches');
        setIsLoadingBatches(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Write handlers with error logs
  const handleRegisterPassword = async (hash: string) => {
    try {
      await setDoc(doc(db, 'system', 'config'), {
        passwordHash: hash,
        createdAt: new Date().toISOString()
      });
      setStoredHash(hash);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system/config');
    }
  };

  const handleAdminLoginSuccess = () => {
    setAdminLoggedIn(true);
    sessionStorage.setItem('peanut_admin_auth', 'true');
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    sessionStorage.removeItem('peanut_admin_auth');
    setSelectedBatch(null);
    setShowForm(false);
  };

  const handleSubmitBatch = async (batch: PeanutBatch) => {
    try {
      await setDoc(doc(db, 'peanut_batches', batch.id), batch);
      setShowForm(false);
      setEditingBatch(null);
      // Select the newly added or edited batch to view certificate instantly!
      setSelectedBatch(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `peanut_batches/${batch.id}`);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'peanut_batches', id));
      if (selectedBatch?.id === id) {
        setSelectedBatch(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `peanut_batches/${id}`);
    }
  };

  const handleChangeStatus = async (batch: PeanutBatch, newStatus: PeanutBatch['status']) => {
    try {
      await updateDoc(doc(db, 'peanut_batches', batch.id), {
        status: newStatus
      });
      // also sync local active detail selection
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch({ ...selectedBatch, status: newStatus });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `peanut_batches/${batch.id}`);
    }
  };

  const handleSaveTemplate = async (newTemplate: AppTemplate) => {
    try {
      await setDoc(doc(db, 'system', 'template'), newTemplate);
      setTemplate(newTemplate);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system/template');
      throw error;
    }
  };

  // Helper: auto-generate demo mock peanuts if database is brand new and empty to save manual entries!
  const handleInjectSampleData = async () => {
    const samples: PeanutBatch[] = [
      {
        id: 'PN-20260601-A201',
        breed: '台南14號 (主要食用/大粒)',
        farmer: '林土豆',
        harvestDate: '2026-05-18',
        entryDate: '2026-06-01',
        weight: 1250,
        moisture: 7.8,
        oilContent: 46.2,
        toxinStatus: '未檢出',
        grade: '特級',
        warehouseLocation: '倉庫 A區-D3排',
        status: '在庫',
        remarks: '土豆伯精選好豆，整批經通風乾燥，大粒完好符合外回最高水分低標，存放情況極佳。',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PN-20260528-B479',
        breed: '黑金剛 (黑皮/高花青素)',
        farmer: '張阿水',
        harvestDate: '2026-05-12',
        entryDate: '2026-05-28',
        weight: 850,
        moisture: 9.2,
        oilContent: 50.1,
        toxinStatus: '合格',
        grade: '優等',
        warehouseLocation: '倉庫 B區-F2隔板',
        status: '在庫',
        remarks: '黑金剛花生黑紫色外皮，高天然花青素。含油稍微偏高，需持續維持乾燥存放。',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PN-20260525-C103',
        breed: '台南9號 (大仁豆/傳統油豆)',
        farmer: '陳茂松',
        harvestDate: '2026-05-05',
        entryDate: '2026-05-25',
        weight: 2000,
        moisture: 11.5,
        oilContent: 51.5,
        toxinStatus: '未檢',
        grade: '合格',
        warehouseLocation: '倉庫 C區-油豆架',
        status: '已出庫',
        remarks: '大仁傳統油豆。出庫發配至大雅油脂廠，檢驗結果等待回補中。',
        createdAt: new Date().toISOString()
      }
    ];

    try {
      setIsLoadingBatches(true);
      for (const b of samples) {
        await setDoc(doc(db, 'peanut_batches', b.id), b);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleScanSuccess = (trackedId: string) => {
    setShowScanner(false);
    
    // Check if matching batch exists
    const match = batches.find(b => b.id.trim().toLowerCase() === trackedId.trim().toLowerCase());
    
    if (activeTab === 'trace') {
      // In consumer tab, set query state
      setQrQueryId(trackedId);
    } else {
      // In administrator tab
      if (adminLoggedIn) {
        if (match) {
          // view details directly
          setSelectedBatch(match);
          setShowForm(false);
        } else {
          alert(`找不到履歷編號 ${trackedId} 的合規記錄。`);
        }
      } else {
        // Not logged in to admin, search in trace tab instead
        setActiveTab('trace');
        setQrQueryId(trackedId);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bento-bg font-sans antialiased text-bento-dark pb-16">
      
      {/* Dynamic Navigation Banner (Hidden on print) */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-bento-cream/70 shadow-sm z-40 px-4 md:px-8 py-4.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Main Brand with elegant display typography */}
          <div className="flex items-center space-x-3 text-center sm:text-left cursor-pointer" onClick={() => { setActiveTab('trace'); setQrQueryId(null); setSelectedBatch(null); }}>
            <div className="w-10 h-10 bg-bento-cream text-bento-dark rounded-xl flex items-center justify-center shadow-md shrink-0">
              <Database className="w-5 h-5 text-bento-dark" />
            </div>
            <div>
              <h1 className="text-base font-extrabold font-sans text-bento-dark tracking-tight flex items-center">
                <span>花生生產履歷與資產庫存系統</span>
                <span className="ml-1.5 px-2 py-0.5 bg-bento-cream text-bento-dark text-[9px] font-black uppercase rounded tracking-wider">雲端版</span>
              </h1>
              <p className="text-[10px] text-bento-mid font-mono mt-0.5">PEANUT TRACEABILITY & INVENTORY HUB</p>
            </div>
          </div>

          {/* Nav Links + Session controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
            {/* Database status badge */}
            <div className="hidden md:flex bg-white border border-bento-cream px-3 py-1.5 rounded-full text-[11px] text-bento-dark items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>雲端資料庫已連線</span>
            </div>

            {/* Trace tab button */}
            <button
              id="tab-trace"
              onClick={() => {
                setActiveTab('trace');
              }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'trace'
                  ? 'bg-bento-dark text-white shadow-md shadow-[#4A3728]/15'
                  : 'text-bento-mid hover:bg-bento-sand hover:text-bento-dark'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>🔍 履歷溯源驗證專區</span>
            </button>

            {/* Admin tab button */}
            <button
              id="tab-admin"
              onClick={() => {
                setActiveTab('admin');
              }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-bento-dark text-white shadow-md shadow-[#4a3728]/15'
                  : 'text-bento-mid hover:bg-bento-sand hover:text-bento-dark'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>⚙️ 履歷控管與庫存後台</span>
            </button>

            {/* LOG OUT BUTTON */}
            {adminLoggedIn && activeTab === 'admin' && (
              <button
                id="admin-logout"
                onClick={handleAdminLogout}
                className="p-2 text-bento-mid hover:text-red-600 hover:bg-bento-sand rounded-xl transition-all ml-1"
                title="登出管理者安全後台"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Real Loading states */}
        {isLoadingBatches && activeTab === 'admin' && adminLoggedIn ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader className="w-10 h-10 text-bento-dark animate-spin mb-4" />
            <p className="text-bento-mid text-sm font-medium">連線至雲端資料庫接收同步狀態中...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: Traceabilitylookup (PUBLIC PORTAL) */}
            {activeTab === 'trace' && (
              <TraceabilityView
                batches={batches}
                qrQueryId={qrQueryId}
                onClearQueryId={() => setQrQueryId(null)}
                onOpenScanner={() => setShowScanner(true)}
                template={template}
              />
            )}

            {/* TAB 2: ADMIN BACKEND */}
            {activeTab === 'admin' && (
              <>
                {!adminLoggedIn ? (
                  // Authentication prompt card
                  <AdminLogin
                    storedHash={storedHash}
                    isLoadingConfig={isLoadingConfig}
                    onLoginSuccess={handleAdminLoginSuccess}
                    onRegisterPassword={handleRegisterPassword}
                  />
                ) : (
                  // Logged inside admin console
                  <div className="space-y-6">
                    
                    {/* Admin Greeting header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-bento-cream gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-bento-dark flex items-center">
                          <span>安全控管中心</span>
                          <span className="ml-2 px-2 py-0.5 bg-bento-cream border border-bento-cream/70 text-bento-dark text-[10px] rounded font-bold uppercase tracking-wider">
                            管理者安全登入中
                          </span>
                        </h2>
                        <p className="text-bento-mid text-xs mt-1">
                          您可以執行自訂履歷欄位、手動快速錄入、包裝貼紙 QR Code 下載列印與庫存盤點表匯出。
                        </p>
                      </div>

                      {!showForm && !selectedBatch && (
                        <button
                          onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                          className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm border ${
                            showTemplateEditor 
                              ? 'bg-[#1a130e] text-white border-transparent' 
                              : 'bg-white hover:bg-bento-sand text-bento-dark border-bento-cream'
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>{showTemplateEditor ? '返回履歷庫存清單' : '⚙️ 自訂履歷欄目標題與預設選項'}</span>
                        </button>
                      )}
                    </div>

                    {/* Empty alert with DEMO generator for smooth onboarding */}
                    {batches.length === 0 && !showForm && !showTemplateEditor && (
                      <div className="bg-white border border-bento-cream p-6 rounded-3xl shadow-[0_4px_20px_rgba(74,55,40,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start space-x-3.5 text-left">
                          <div className="p-2.5 bg-bento-sand rounded-xl text-bento-dark mt-1 shrink-0">
                            <Sparkles className="w-5 h-5 text-bento-dark" />
                          </div>
                          <div>
                            <h4 className="font-bold text-bento-dark text-sm">歡迎使用！目前資料庫中尚無履歷</h4>
                            <p className="text-bento-mid text-xs mt-1 leading-relaxed">
                              點擊右側的「手動錄入新批次」填寫首批資料；或者，我們已為您備好 3 組測試範例，點擊下方按鈕即可一鍵快速載入！
                            </p>
                          </div>
                        </div>
                        <button
                          id="btn-inject-samples"
                          onClick={handleInjectSampleData}
                          className="px-4 py-2.5 bg-bento-dark hover:opacity-90 text-white font-bold rounded-xl text-xs transition-colors shadow-md shrink-0 flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>一鍵載入測試範例</span>
                        </button>
                      </div>
                    )}

                    {/* View Router */}
                    {showTemplateEditor ? (
                      // Custom dynamic fields layout / template settings
                      <TemplateEditor
                        currentTemplate={template}
                        onSave={handleSaveTemplate}
                        onBack={() => setShowTemplateEditor(false)}
                      />
                    ) : showForm ? (
                      // Add / Edit form (PeanutForm)
                      <PeanutForm
                        initialData={editingBatch}
                        onSubmit={handleSubmitBatch}
                        onCancel={() => {
                          setShowForm(false);
                          setEditingBatch(null);
                        }}
                        template={template}
                      />
                    ) : selectedBatch ? (
                      // Detail certificate inspector view (BatchDetails)
                      <BatchDetails
                        batch={selectedBatch}
                        onBack={() => {
                          setSelectedBatch(null);
                        }}
                        isAdminMode={true}
                        onEdit={(batchToEdit) => {
                          setEditingBatch(batchToEdit);
                          setShowForm(true);
                        }}
                        onChangeStatus={handleChangeStatus}
                        template={template}
                      />
                    ) : (
                      // Main Inventory Listing
                      <InventoryTable
                        batches={batches}
                        onSelectBatch={(batch) => {
                          setSelectedBatch(batch);
                        }}
                        onEditBatch={(batch) => {
                          setEditingBatch(batch);
                          setShowForm(true);
                        }}
                        onDeleteBatch={handleDeleteBatch}
                        onAddNewBatch={() => {
                          setEditingBatch(null);
                          setShowForm(true);
                        }}
                        onOpenScanner={() => setShowScanner(true)}
                        onChangeStatus={handleChangeStatus}
                        template={template}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* QR/Barcode scanner webcam modal overlay */}
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
