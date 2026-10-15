'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, X, Search, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (isbn: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualIsbn, setManualIsbn] = useState('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'isbn-barcode-reader-box';
  const hasScannedRef = useRef(false);

  // Play a crisp beep tone using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // High C6 tone
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // AudioContext not permitted or supported
    }
  };

  const triggerVibrate = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100]);
      }
    } catch {
      // Ignore vibration error
    }
  };

  const handleDetectedCode = (decodedText: string) => {
    if (hasScannedRef.current) return;
    
    // Clean to alphanumeric and hyphens
    const cleanNum = decodedText.replace(/[^0-9Xx]/g, '');
    if (cleanNum.length === 10 || cleanNum.length === 13) {
      hasScannedRef.current = true;
      playBeep();
      triggerVibrate();
      stopScanner();
      onScanSuccess(decodedText);
      onClose();
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startScanner = async (cameraId?: string) => {
    setCameraError(null);
    hasScannedRef.current = false;
    
    // Ensure previous instance is stopped
    await stopScanner();

    try {
      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      const cameraConfig = cameraId 
        ? { deviceId: { exact: cameraId } } 
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxWidth = Math.floor(minEdge * 0.85);
            const boxHeight = Math.floor(boxWidth * 0.55); // Wide rectangle for barcodes
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.333333
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame passed without detection, silent
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner start error:', err);
      let errMsg = 'ক্যামেরা চালু করতে সমস্যা হয়েছে।';
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        errMsg = 'ক্যামেরা ব্যবহারের অনুমতি (Permission) দেওয়া হয়নি। ব্রাউজার সেটিংসে ক্যামেরা এলাউ করুন।';
      } else if (err?.name === 'NotFoundError') {
        errMsg = 'আপনার ডিভাইসে কোনো ক্যামেরা পাওয়া যায়নি।';
      }
      setCameraError(errMsg);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;

    // Discover cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          const initialId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(initialId);
          startScanner(initialId);
        } else {
          startScanner();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not enumerate cameras, trying default environment:', err);
        startScanner();
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '520px', 
          width: '95%', 
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--card-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>ISBN বারকোড স্ক্যানার</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                বইয়ের পেছনের বারকোডটি ক্যামেরার সামনে ধরুন
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-icon"
              title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
              style={{ width: '34px', height: '34px', padding: 0 }}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-icon"
              style={{ width: '34px', height: '34px', padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          overflowY: 'auto'
        }}>
          {cameraError ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed var(--danger)',
              borderRadius: '12px',
              width: '100%',
              margin: '10px 0'
            }}>
              <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--danger)', fontWeight: 500, margin: '0 0 14px' }}>
                {cameraError}
              </p>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => startScanner(selectedCameraId)}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> পুনরায় চেষ্টা করুন
              </button>
            </div>
          ) : (
            <div style={{
              width: '100%',
              maxWidth: '440px',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              minHeight: '260px'
            }}>
              <div id={containerId} style={{ width: '100%' }} />

              {/* Scanning visual overlay & animation */}
              {isScanning && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '78%',
                    height: '48%',
                    border: '2px solid rgba(59, 130, 246, 0.8)',
                    borderRadius: '8px',
                    position: 'relative',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  }}>
                    {/* Laser line animated */}
                    <div style={{
                      position: 'absolute',
                      left: '4px',
                      right: '4px',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #3b82f6, #60a5fa, transparent)',
                      boxShadow: '0 0 8px #3b82f6',
                      animation: 'scanLaser 2s ease-in-out infinite alternate'
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera switcher if multiple cameras */}
          {cameras.length > 1 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginTop: '12px',
              width: '100%',
              maxWidth: '440px' 
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ক্যামেরা:</span>
              <select
                className="form-select"
                style={{ fontSize: '0.85rem', padding: '6px 10px', flex: 1 }}
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
              >
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Input Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '440px',
            margin: '20px 0 12px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ padding: '0 10px' }}>অথবা হাতে লিখে খুঁজুন</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Manual Input form */}
          <div style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
            maxWidth: '440px'
          }}>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.9rem' }}
              placeholder="ISBN লিখুন (যেমন: 978...)"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (manualIsbn.trim()) {
                    onScanSuccess(manualIsbn.trim());
                    onClose();
                  } else {
                    toast.error('অনুগ্রহ করে ISBN লিখুন');
                  }
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                if (manualIsbn.trim()) {
                  onScanSuccess(manualIsbn.trim());
                  onClose();
                } else {
                  toast.error('অনুগ্রহ করে ISBN লিখুন');
                }
              }}
            >
              <Search size={15} /> খুঁজুন
            </button>
          </div>
        </div>

        {/* Global Keyframes for the scan laser */}
        <style jsx global>{`
          @keyframes scanLaser {
            0% { top: 5%; }
            100% { top: 92%; }
          }
        `}</style>
      </div>
    </div>
  );
}
