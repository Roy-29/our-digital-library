'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

const TABLES = ['books', 'authors', 'publishers', 'categories', 'genres', 'rooms', 'shelves', 'racks', 'borrowers', 'lending_records', 'wishlist', 'reading_sessions', 'activity_log'];

export default function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);
  const [importData, setImportData] = useState<Record<string, unknown[]> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const exportJSON = async () => {
    setExporting(true);
    try {
      const backup: Record<string, unknown[]> = {};
      for (const table of TABLES) {
        const { data } = await supabase.from(table).select('*');
        backup[table] = data || [];
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ব্যাকআপ ডাউনলোড হয়েছে ✅');
    } catch {
      toast.error('ব্যাকআপ ব্যর্থ');
    }
    setExporting(false);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      for (const table of ['books', 'authors', 'publishers']) {
        const { data } = await supabase.from(table).select('*');
        if (!data || data.length === 0) continue;

        const headers = Object.keys(data[0]);
        const csv = [
          headers.join(','),
          ...data.map(row => headers.map(h => {
            const val = (row as Record<string, unknown>)[h];
            const str = val === null ? '' : String(val);
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success('CSV ফাইল ডাউনলোড হয়েছে ✅');
    } catch {
      toast.error('ব্যর্থ');
    }
    setExporting(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setImportData(data);
        setShowRestoreWarning(true);
      } catch {
        toast.error('ফাইল পড়তে ব্যর্থ');
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!importData) return;
    setImporting(true);
    setShowRestoreWarning(false);

    try {
      // Import in dependency order
      const orderedTables = ['categories', 'genres', 'rooms', 'shelves', 'racks', 'authors', 'publishers', 'borrowers', 'books', 'lending_records', 'wishlist', 'reading_sessions', 'activity_log'];

      for (const table of orderedTables) {
        const rows = importData[table];
        if (!rows || rows.length === 0) continue;

        // Upsert in batches
        const batchSize = 50;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          await supabase.from(table).upsert(batch as Record<string, unknown>[], { onConflict: 'id' });
        }
      }

      toast.success('ডেটা পুনরুদ্ধার হয়েছে ✅');
    } catch (err) {
      toast.error('পুনরুদ্ধার ব্যর্থ');
      console.error(err);
    }
    setImporting(false);
    setImportData(null);
  };

  return (
    <>
      <div className="page-header"><h2>💾 ব্যাকআপ ও পুনরুদ্ধার</h2></div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Export */}
          <div className="card">
            <div className="card-header"><h3>📥 ব্যাকআপ ডাউনলোড</h3></div>
            <div className="card-body">
              <p className="text-sm text-muted mb-4">সম্পূর্ণ ডাটাবেস ব্যাকআপ ডাউনলোড করুন।</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary w-full" onClick={exportJSON} disabled={exporting}>
                  {exporting ? '⏳ প্রক্রিয়াকরণ...' : '📄 JSON ব্যাকআপ'}
                </button>
                <button className="btn btn-secondary w-full" onClick={exportCSV} disabled={exporting}>
                  {exporting ? '⏳ প্রক্রিয়াকরণ...' : '📊 CSV এক্সপোর্ট'}
                </button>
              </div>
            </div>
          </div>

          {/* Import */}
          <div className="card">
            <div className="card-header"><h3>📤 ডেটা পুনরুদ্ধার</h3></div>
            <div className="card-body">
              <p className="text-sm text-muted mb-4">JSON ব্যাকআপ ফাইল থেকে ডেটা পুনরুদ্ধার করুন।</p>
              <input type="file" accept=".json" ref={fileRef} onChange={handleImportFile} style={{ display: 'none' }} />
              <button className="btn btn-secondary w-full" onClick={() => fileRef.current?.click()} disabled={importing}>
                {importing ? '⏳ পুনরুদ্ধার হচ্ছে...' : '📂 ফাইল নির্বাচন করুন'}
              </button>
            </div>
          </div>

          {/* Import CSV/XLSX */}
          <div className="card">
            <div className="card-header"><h3>📊 Excel/CSV ইম্পোর্ট</h3></div>
            <div className="card-body">
              <p className="text-sm text-muted mb-4">Excel বা CSV ফাইল থেকে বই ইম্পোর্ট করুন। &quot;সব বই&quot; পেজে Import বাটন ব্যবহার করুন।</p>
              <a href="/dashboard/books" className="btn btn-secondary w-full">📚 সব বই পেজে যান</a>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header"><h3>ℹ️ তথ্য</h3></div>
          <div className="card-body">
            <p className="text-sm">ব্যাকআপে যা থাকবে:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              {TABLES.map(t => <li key={t} className="text-sm">{t}</li>)}
            </ul>
            <p className="text-sm text-muted" style={{ marginTop: '12px' }}>
              ⚠️ পুনরুদ্ধার করলে বিদ্যমান ডেটা ওভাররাইট হতে পারে। সতর্কতার সাথে ব্যবহার করুন।
            </p>
          </div>
        </div>
      </div>

      {/* Restore Warning */}
      {showRestoreWarning && (
        <div className="confirm-overlay" onClick={() => setShowRestoreWarning(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>ডেটা পুনরুদ্ধার করবেন?</h3>
            <p>এটি বিদ্যমান ডেটা ওভাররাইট করতে পারে। আগে ব্যাকআপ নিন!</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowRestoreWarning(false)}>বাতিল</button>
              <button className="btn btn-danger" onClick={handleRestore}>⚡ পুনরুদ্ধার করুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
