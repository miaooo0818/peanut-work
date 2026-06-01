/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Image, X, UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (text: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [deviceErrorMessage, setDeviceErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-element';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up scanner on unmount
    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async () => {
    setDeviceErrorMessage(null);
    setIsUploading(false);
    setIsScanning(true);

    // Give a brief delay for container mounting
    setTimeout(async () => {
      try {
        const qrScanner = new Html5Qrcode(containerId);
        qrRef.current = qrScanner;

        const config = {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return { width: boxSize, height: boxSize };
          },
        };

        await qrScanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Success
            handleSuccess(decodedText);
          },
          () => {
            // Verbose error logging ignored to prevent flood
          }
        );

        setCameraActive(true);
      } catch (err: any) {
        console.error('Camera Scanner start failure:', err);
        setDeviceErrorMessage('無法啟動相機。請確認已授予相機權限，或選擇下方「上傳圖片」掃描。');
        setIsScanning(false);
        setCameraActive(false);
      }
    }, 100);
  };

  const stopCameraScanner = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
        qrRef.current = null;
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  const handleSuccess = (decodedText: string) => {
    // Strip raw URL wrapping if QR matches traceability URL pattern
    let parsedText = decodedText.trim();
    if (parsedText.includes('?id=')) {
      const parts = parsedText.split('?id=');
      parsedText = parts[parts.length - 1];
    } else if (parsedText.includes('/')) {
      const parts = parsedText.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart.startsWith('PN-')) {
        parsedText = lastPart;
      }
    }
    stopCameraScanner();
    onScanSuccess(parsedText);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDeviceErrorMessage(null);
    setIsUploading(true);
    await stopCameraScanner();

    // Use html5-qrcode to scan file offline
    const html5QrCode = new Html5Qrcode('qr-reader-dummy');
    try {
      const result = await html5QrCode.scanFile(file, true);
      handleSuccess(result);
    } catch (err) {
      console.error('Failed to parse QR from uploaded file:', err);
      setDeviceErrorMessage('無法在此圖片中辨識到 QR code，請上傳更清晰的標籤圖片。');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="qr-scanner-modal" className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-2 border-bento-cream flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-bento-cream bg-[#FDFBF7] flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-bento-dark" />
            <h3 className="font-extrabold text-bento-dark text-sm">條碼 / QR Code 掃描</h3>
          </div>
          <button 
            id="close-scanner"
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="text-bento-mid hover:text-bento-dark p-1.5 rounded-xl hover:bg-bento-sand transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display reader dummy for file reading */}
        <div id="qr-reader-dummy" className="hidden"></div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[320px]">
          {isScanning && (
            <div className="relative w-full max-w-[260px] aspect-square rounded-2xl bg-stone-950 overflow-hidden shadow-inner border-2 border-bento-dark">
              <div id={containerId} className="w-full h-full object-cover"></div>
              {/* Dynamic Overlay scanning line */}
              <div className="absolute inset-x-0 h-0.5 bg-bento-dark shadow-[0_0_8px_rgba(74,55,40,0.8)] animate-bounce" style={{ top: '10%', animationDuration: '2s' }}></div>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="px-2 py-1 bg-[#1a130e]/80 rounded text-[10px] text-bento-cream font-mono tracking-wider">相機掃描中...</span>
              </div>
            </div>
          )}

          {!isScanning && !isUploading && (
            <div className="w-full text-center py-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-bento-sand rounded-full flex items-center justify-center text-bento-dark mb-4 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-extrabold text-bento-dark mb-2">啟動相機自動掃描標籤</p>
              <p className="text-xs text-bento-mid mb-6 max-w-xs leading-relaxed">請對準花生履歷卡上的 QR Code 條碼，即可自動讀取並跳轉到該履歷詳情。</p>
              
              <button
                id="btn-start-camera"
                onClick={startCameraScanner}
                className="w-full py-2.5 px-4 bg-bento-dark hover:opacity-90 text-white rounded-xl font-extrabold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>開啟相機鏡頭</span>
              </button>
            </div>
          )}

          {isUploading && (
            <div className="text-center py-10 flex flex-col items-center">
              <RefreshCw className="w-10 h-10 text-bento-dark animate-spin mb-4" />
              <p className="text-sm text-bento-dark font-extrabold">圖片分析解碼中，請稍候...</p>
            </div>
          )}

          {deviceErrorMessage && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 flex items-start space-x-2 text-red-700 text-xs text-left w-full animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{deviceErrorMessage}</span>
            </div>
          )}

          {/* Fallback local image selector */}
          <div className="w-full border-t border-bento-cream mt-6 pt-4">
            <input
              type="file"
              id="qr-image-upload"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              id="upload-qr-button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-[#FDFBF7] hover:bg-bento-sand border border-bento-cream text-bento-dark rounded-xl font-bold transition-all flex items-center justify-center space-x-2 text-sm shadow-sm cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-bento-mid" />
              <span>上傳 QR Code 圖片解碼</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FDFBF7] border-t-2 border-bento-cream flex justify-end">
          <button
            id="close-scanner-footer"
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="px-4 py-2 hover:bg-bento-sand bg-bento-cream text-bento-dark rounded-xl text-xs font-bold transition-all border border-bento-cream cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
