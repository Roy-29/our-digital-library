'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { 
  Camera, Zap, Trash2, Save, ArrowLeft, RefreshCw, Volume2, 
  VolumeX, AlertTriangle, CheckCircle2, Loader2, BookOpen, 
  MapPin, User, Plus, X 
} from 'lucide-react';
import { OWNERS, Room, Shelf, Rack, enToBnNumber, getOwnerLabel } from '@/lib/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface QueuedBook {
  tempId: string;
  isbn: string;
  title: string;
  titleOriginal?: string;
  subtitle?: string;
  authorName?: string;
  publisherName?: string;
  publicationYear?: number | null;
  pageCount?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  status: 'fetching' | 'ready' | 'not_found' | 'error';
  isExistingInLibrary?: boolean;
  existingCopiesCount?: number;
}

export default function RapidScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Settings State
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualIsbn, setManualIsbn] = useState('');

  // Default Batch Settings
  const [defaultOwner, setDefaultOwner] = useState('swapnil');
  const [defaultRoomId, setDefaultRoomId] = useState('');
  const [defaultShelfId, setDefaultShelfId] = useState('');
  const [defaultRackId, setDefaultRackId] = useState('');

  // Reference data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  // Queue State
  const [queue, setQueue] = useState<QueuedBook[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'rapid-scanner-viewfinder';
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  useEffect(() => {
    if (user?.id) {
      setDefaultOwner(user.id);
    }
  }, [user]);

  // Load rooms, shelves, racks
  useEffect(() => {
    const fetchLocations = async () => {
      const [r, s, rk] = await Promise.all([
        supabase.from('rooms').select('*').order('name'),
        supabase.from('shelves').select('*').order('name'),
        supabase.from('racks').select('*').order('name'),
      ]);
      setRooms(r.data || []);
      setShelves(s.data || []);
      setRacks(rk.data || []);
    };
    fetchLocations();
  }, [supabase]);

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
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
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
    } catch {}
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
    await stopScanner();

    try {
      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
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
            const boxHeight = Math.floor(boxWidth * 0.55);
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.333333
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner start error:', err);
      let errMsg = 'ক্যামেরা চালু করতে সমস্যা হয়েছে।';
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        errMsg = 'ক্যামেরা ব্যবহারের অনুমতি (Permission) দেওয়া হয়নি। ব্রাউজার সেটিংসে এলাউ করুন।';
      } else if (err?.name === 'NotFoundError') {
        errMsg = 'আপনার ডিভাইসে কোনো ক্যামেরা পাওয়া যায়নি।';
      }
      setCameraError(errMsg);
      setIsScanning(false);
    }
  };

  // Discover cameras on mount
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
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
  }, []);

  const handleDetectedCode = async (code: string) => {
    const clean = code.replace(/[^0-9Xx]/g, '').trim();
    if (clean.length !== 10 && clean.length !== 13) return;

    // Cooldown check (3.5 seconds) to prevent accidental multiple scans of same book
    const now = Date.now();
    if (lastScannedTimeRef.current.code === clean && now - lastScannedTimeRef.current.time < 3500) {
      return;
    }
    lastScannedTimeRef.current = { code: clean, time: now };

    playBeep();
    triggerVibrate();

    // Add placeholder to queue immediately
    const tempId = crypto.randomUUID();
    const newEntry: QueuedBook = {
      tempId,
      isbn: clean,
      title: 'তথ্য লোড হচ্ছে...',
      status: 'fetching'
    };

    setQueue(prev => [newEntry, ...prev]);
    toast.success(`ISBN স্ক্যান হয়েছে: ${clean}`);

    // Asynchronously fetch details
    try {
      const { dbLookupIsbn } = await import('@/app/actions');
      const res = await dbLookupIsbn(clean);

      setQueue(prev => prev.map(item => {
        if (item.tempId !== tempId) return item;

        if (res.success) {
          const online = res.onlineData;
          const isExisting = res.existsLocally;
          const copiesCount = res.localBook?.totalCopies || 1;

          if (online && online.title) {
            return {
              ...item,
              title: online.title,
              subtitle: online.subtitle || '',
              authorName: online.authors?.[0] || '',
              publisherName: online.publisher || '',
              publicationYear: online.publishedYear ? parseInt(online.publishedYear, 10) : null,
              pageCount: online.pageCount ? parseInt(online.pageCount, 10) : null,
              description: online.description || '',
              coverUrl: online.coverUrl || null,
              status: 'ready',
              isExistingInLibrary: isExisting,
              existingCopiesCount: copiesCount
            };
          } else if (res.localBook) {
            return {
              ...item,
              title: res.localBook.title,
              authorName: res.localBook.authorName || '',
              publisherName: res.localBook.publisherName || '',
              coverUrl: res.localBook.coverUrl || null,
              status: 'ready',
              isExistingInLibrary: true,
              existingCopiesCount: copiesCount
            };
          } else {
            return {
              ...item,
              title: `অজ্ঞাত বই (ISBN: ${clean})`,
              status: 'not_found'
            };
          }
        }

        return {
          ...item,
          title: `অজ্ঞাত বই (ISBN: ${clean})`,
          status: 'not_found'
        };
      }));
    } catch (err) {
      console.error('Rapid lookup error:', err);
      setQueue(prev => prev.map(item => 
        item.tempId === tempId ? { ...item, title: `অজ্ঞাত বই (ISBN: ${clean})`, status: 'error' } : item
      ));
    }
  };

  const handleManualScan = () => {
    if (!manualIsbn.trim()) return;
    handleDetectedCode(manualIsbn.trim());
    setManualIsbn('');
  };

  const removeFromQueue = (tempId: string) => {
    setQueue(prev => prev.filter(item => item.tempId !== tempId));
  };

  const updateQueueItem = (tempId: string, field: string, val: any) => {
    setQueue(prev => prev.map(item => item.tempId === tempId ? { ...item, [field]: val } : item));
  };

  const handleSaveAll = async () => {
    if (queue.length === 0) {
      toast.error('সংরক্ষণের জন্য কোনো বই নেই');
      return;
    }

    setIsSaving(true);
    try {
      const { dbBulkAddRapidBooks } = await import('@/app/actions');
      
      const payload = queue.map(q => ({
        isbn: q.isbn,
        title: q.title,
        titleOriginal: q.titleOriginal || undefined,
        subtitle: q.subtitle || undefined,
        authorName: q.authorName || undefined,
        publisherName: q.publisherName || undefined,
        publicationYear: q.publicationYear || null,
        pageCount: q.pageCount || null,
        description: q.description || null,
        coverUrl: q.coverUrl || null,
        owner: defaultOwner,
        roomId: defaultRoomId || null,
        shelfId: defaultShelfId || null,
        rackId: defaultRackId || null,
      }));

      const res = await dbBulkAddRapidBooks(payload, defaultOwner);
      if (res.success) {
        toast.success(`🎉 সফলভাবে ${enToBnNumber((res.count ?? queue.length).toString())}টি বই লাইব্রেরিতে সংরক্ষণ করা হয়েছে!`);
        setQueue([]);
        router.push('/dashboard/books');
      } else {
        toast.error(res.message || 'সেভ করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error('Error saving bulk books:', err);
      toast.error('বইগুলো সেভ করতে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  const availableShelves = defaultRoomId 
    ? shelves.filter(s => s.room_id === defaultRoomId) 
    : shelves;
  const availableRacks = defaultShelfId 
    ? racks.filter(rk => rk.shelf_id === defaultShelfId) 
    : racks;

  return (
    <div className="page-body" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard/books" className="btn btn-secondary btn-icon" title="সব বই তালিকায় ফিরে যান">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡ র‍্যাপিড/বাল্ক বারকোড স্ক্যানার</span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              একটানা বারকোড স্ক্যান করুন, স্বয়ংক্রিয়ভাবে ডাটা ফেচ হবে এবং একসাথে সব বই সেভ করুন।
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.85rem',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            fontWeight: 600,
            color: 'var(--primary)'
          }}>
            📋 স্ক্যান হয়েছে: {enToBnNumber(queue.length.toString())}টি বই
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAll}
            disabled={isSaving || queue.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>সবগুলো সেভ করুন</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Scanner & Defaults, Right is Scanned Queue */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Live Viewfinder & Controls */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="#3b82f6" /> লাইভ স্ক্যান ভিউফাইন্ডার
            </h3>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-icon"
              title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
              style={{ width: '32px', height: '32px', padding: 0 }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>

          {/* Camera Viewport */}
          {cameraError ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed var(--danger)',
              borderRadius: '12px',
              margin: '10px 0'
            }}>
              <AlertTriangle size={32} color="var(--danger)" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500, margin: '0 0 12px' }}>
                {cameraError}
              </p>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => startScanner(selectedCameraId)}
                style={{ fontSize: '0.82rem' }}
              >
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> ক্যামেরা পুনরায় চালু করুন
              </button>
            </div>
          ) : (
            <div style={{
              width: '100%',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              minHeight: '240px'
            }}>
              <div id={containerId} style={{ width: '100%' }} />

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
                    width: '80%',
                    height: '50%',
                    border: '2px solid rgba(59, 130, 246, 0.8)',
                    borderRadius: '8px',
                    position: 'relative',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  }}>
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

          {/* Camera switcher */}
          {cameras.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
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
                  <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.slice(0, 5)}...`}</option>
                ))}
              </select>
            </div>
          )}

          {/* Manual / Barcode Gun Input */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="বারকোড গান / হাতে ISBN লিখুন..."
              value={manualIsbn}
              onChange={e => setManualIsbn(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleManualScan();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleManualScan}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <Plus size={16} /> স্ক্যান যোগ
            </button>
          </div>

          <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

          {/* Batch Default Settings (Owner & Shelving) */}
          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={16} color="var(--primary)" /> ব্যাচের ডিফল্ট সেটিংস
          </h4>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>বইগুলোর মালিক</label>
            <select
              className="form-select"
              value={defaultOwner}
              onChange={e => setDefaultOwner(e.target.value)}
            >
              {OWNERS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>রুম</label>
              <select
                className="form-select"
                style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                value={defaultRoomId}
                onChange={e => {
                  setDefaultRoomId(e.target.value);
                  setDefaultShelfId('');
                  setDefaultRackId('');
                }}
              >
                <option value="">রুম নির্বাচন</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name_bn || r.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>আলমারি/শেল্ফ</label>
              <select
                className="form-select"
                style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                value={defaultShelfId}
                onChange={e => {
                  setDefaultShelfId(e.target.value);
                  setDefaultRackId('');
                }}
              >
                <option value="">শেল্ফ নির্বাচন</option>
                {availableShelves.map(s => <option key={s.id} value={s.id}>{s.name_bn || s.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>র‍্যাক/তাক</label>
              <select
                className="form-select"
                style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                value={defaultRackId}
                onChange={e => setDefaultRackId(e.target.value)}
              >
                <option value="">র‍্যাক নির্বাচন</option>
                {availableRacks.map(rk => <option key={rk.id} value={rk.id}>{rk.name_bn || rk.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Books Queue */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              স্ক্যান করা বইয়ের তালিকা ({enToBnNumber(queue.length.toString())})
            </h3>
            {queue.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (confirm('আপনি কি পুরো তালিকাটি মুছে ফেলতে চান?')) {
                    setQueue([]);
                  }
                }}
                style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--danger)' }}
              >
                <Trash2 size={13} style={{ marginRight: '4px' }} /> ক্লিয়ার করুন
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="card" style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              border: '2px dashed var(--border-color)',
              background: 'transparent'
            }}>
              <BookOpen size={48} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text-main)' }}>
                এখনও কোনো বই স্ক্যান করা হয়নি
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                বইয়ের পেছনের বারকোডটি ক্যামেরার সামনে ধরলেই তা স্বয়ংক্রিয়ভাবে তালিকায় যুক্ত হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {queue.map((item, idx) => (
                <div 
                  key={item.tempId} 
                  className="card"
                  style={{
                    padding: '14px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    borderLeft: item.isExistingInLibrary 
                      ? '4px solid #eab308' 
                      : (item.status === 'ready' ? '4px solid #10b981' : '4px solid var(--border-color)')
                  }}
                >
                  {/* Sequence number */}
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '36px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    #{enToBnNumber((queue.length - idx).toString())}
                  </span>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.tempId)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '4px'
                    }}
                    title="তালিকা থেকে বাদ দিন"
                  >
                    <X size={16} />
                  </button>

                  {/* Cover image or placeholder */}
                  {item.coverUrl ? (
                    <img 
                      src={item.coverUrl} 
                      alt="Cover" 
                      style={{
                        width: '54px',
                        height: '76px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '54px',
                      height: '76px',
                      borderRadius: '6px',
                      background: 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      flexShrink: 0
                    }}>
                      <BookOpen size={24} />
                    </div>
                  )}

                  {/* Book details */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
                    {/* Status & duplicate indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {item.isbn}
                      </span>

                      {item.status === 'fetching' && (
                        <span style={{ fontSize: '0.72rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Loader2 size={12} className="animate-spin" /> তথ্য খোঁজা হচ্ছে...
                        </span>
                      )}

                      {item.isExistingInLibrary && (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#ca8a04',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <AlertTriangle size={11} /> লাইব্রেরিতে আছে ({enToBnNumber(item.existingCopiesCount?.toString() || '1')}টি কপি)
                        </span>
                      )}

                      {item.status === 'ready' && !item.isExistingInLibrary && (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <CheckCircle2 size={11} /> নতুন বই
                        </span>
                      )}
                    </div>

                    {/* Title input (editable) */}
                    <input
                      type="text"
                      className="form-input"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        marginBottom: '6px',
                        borderColor: item.status === 'not_found' ? '#f59e0b' : undefined
                      }}
                      value={item.title}
                      onChange={e => updateQueueItem(item.tempId, 'title', e.target.value)}
                      placeholder="বইয়ের নাম লিখুন..."
                    />

                    {/* Author input (editable) */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '3px 8px', fontSize: '0.82rem', flex: 1, minWidth: '130px' }}
                        value={item.authorName || ''}
                        onChange={e => updateQueueItem(item.tempId, 'authorName', e.target.value)}
                        placeholder="লেখকের নাম..."
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '3px 8px', fontSize: '0.82rem', flex: 1, minWidth: '130px' }}
                        value={item.publisherName || ''}
                        onChange={e => updateQueueItem(item.tempId, 'publisherName', e.target.value)}
                        placeholder="প্রকাশক..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanLaser {
          0% { top: 5%; }
          100% { top: 92%; }
        }
      `}</style>
    </div>
  );
}
