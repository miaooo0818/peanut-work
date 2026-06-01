/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { sha256 } from '../utils';

interface AdminLoginProps {
  storedHash: string | null;
  onLoginSuccess: () => void;
  onRegisterPassword: (hash: string) => Promise<void>;
  isLoadingConfig: boolean;
}

export default function AdminLogin({
  storedHash,
  onLoginSuccess,
  onRegisterPassword,
  isLoadingConfig,
}: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSetupMode = !storedHash && !isLoadingConfig;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 5) {
      setErrorMsg('密碼長度必須大於或等於 5 個字元。');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('兩次輸入的密碼不一致！請再次確認。');
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await sha256(password);
      await onRegisterPassword(hash);
      setSuccessMsg('管理者密碼設定成功！即將登入系統...');
      setTimeout(() => {
        onLoginSuccess();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg('設定密碼時發生錯誤，請重試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password) {
      setErrorMsg('請輸入密碼。');
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await sha256(password);
      if (hash === storedHash) {
        setSuccessMsg('驗證成功！正在登入後台...');
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        setErrorMsg('密碼錯誤！請再次確認您的密碼是否正確。');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('密碼驗證時發生錯誤，請重試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Loader className="w-10 h-10 text-bento-dark animate-spin mb-4" />
        <p className="text-bento-mid text-sm">載入系統配置中，請稍候...</p>
      </div>
    );
  }

  return (
    <div id="admin-login-wrapper" className="max-w-md mx-auto my-12 bg-white rounded-3xl shadow-[0_4px_20px_rgba(74,55,40,0.05)] border border-bento-cream overflow-hidden">
      {/* Accent Header Banner */}
      <div className="bg-bento-dark p-8 text-white relative">
        <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-full">
          <KeyRound className="w-6 h-6 text-bento-cream" />
        </div>
        <h2 className="text-2xl font-bold font-sans tracking-tight mb-2">
          {isSetupMode ? '初始化管理者密碼' : '管理者登入'}
        </h2>
        <p className="text-bento-cream/90 text-xs leading-relaxed">
          {isSetupMode 
            ? '這是您首次啟用此數據中心。請先建立一組管理者安全性密碼。' 
            : '此區域為花生入庫、檢驗管控與履歷修改安全後台，請輸入管理者驗證密碼。'}
        </p>
      </div>

      {/* Form Content */}
      <div className="p-8">
        {isSetupMode ? (
          // Setup Form
          <form id="form-admin-setup" onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-bento-dark uppercase tracking-wider mb-2">
                設定管理者密碼 (最小長度 5 字元)
              </label>
              <input
                type="password"
                id="setup-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入首創登入密碼"
                className="w-full px-4 py-3 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-bento-dark uppercase tracking-wider mb-2">
                再次確認密碼
              </label>
              <input
                type="password"
                id="setup-confirm-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="請再次輸入密碼以驗證"
                className="w-full px-4 py-3 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark transition-all text-sm"
              />
            </div>

            <div className="p-3.5 bg-bento-sand/50 border border-bento-cream/60 rounded-xl text-[11px] text-bento-dark flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-bento-mid mt-0.5" />
              <p className="leading-relaxed text-bento-mid">
                <strong className="text-bento-dark">特別叮嚀：</strong>此密碼一經儲存將進行高強度雜湊存放於資料庫。若忘記密碼，需透過資料庫管理端進行重設，請務必妥善保管。
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2 text-red-700 text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              id="submit-register-password"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-bento-dark hover:opacity-90 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>建立及儲存中...</span>
                </>
              ) : (
                <span>啟用認證並進入後台</span>
              )}
            </button>
          </form>
        ) : (
          // Login Form
          <form id="form-admin-login" onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-bento-dark uppercase tracking-wider mb-2">
                請輸入安全登入密碼
              </label>
              <input
                type="password"
                id="login-password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入管理者密碼"
                className="w-full px-4 py-3 bg-[#FDFBF7] border border-bento-cream rounded-xl text-bento-dark placeholder-bento-mid focus:outline-none focus:ring-2 focus:ring-bento-dark transition-all text-sm"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2 text-red-700 text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              id="submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-bento-dark hover:opacity-90 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>密碼比對驗證中...</span>
                </>
              ) : (
                <span>驗證管理者身分</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
