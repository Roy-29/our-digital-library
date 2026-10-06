'use client';

import { useState, useRef } from 'react';
import { dbExportBackup, dbRestoreBackup, dbExportTableCsv, dbImportBooks } from '@/app/actions';
import { BACKUP_TABLES, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

const TABLE_LABELS: Record<string, string> = {
  profiles: 'ইউজার প্রোফাইল (Profiles)',
  books: 'সব বই (Books)',
  authors: 'লেখক ও অনুবাদক (Authors)',
  publishers: 'প্রকাশক (Publishers)',
  categories: 'ক্যাটাগরি (Categories)',
  genres: 'ধরন / জঁরা (Genres)',
  rooms: 'রুম (Rooms)',
  shelves: 'আলমারি (Shelves)',
  racks: 'তাক / র‍্যাক (Racks)',
  borrowers: 'ধারগ্রহীতা (Borrowers)',
  lending_records: 'ধার দেওয়ার রেকর্ড (Lendings)',
  wishlist: 'উইশলিস্ট (Wishlist)',
  activity_log: 'কার্যকলাপ (Activity Log)',
  magazines: 'ম্যাগাজিন (Magazines)',
  magazine_issues: 'ম্যাগাজিন ইস্যু (Magazine Issues)',
};

const CSV_OPTIONS = [
  { table: 'books', label: 'বইয়ের তালিকা', icon: '📚' },
  { table: 'authors', label: 'লেখক তালিকা', icon: '✍🏻' },
  { table: 'publishers', label: 'প্রকাশক তালিকা', icon: '🏢' },
  { table: 'wishlist', label: 'উইশলিস্ট', icon: '🛒' },
  { table: 'borrowers', label: 'ধারগ্রহীতা', icon: '👥' },
  { table: 'lending_records', label: 'ধারের রেকর্ড', icon: '📤' },
];

export default function BackupPage() {
  const { user } = useAuth();

  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportingCsvTable, setExportingCsvTable] = useState<string | null>(null);

  // Restore states
  const [importing, setImporting] = useState(false);
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);
  const [importData, setImportData] = useState<any | null>(null);
  const [importStats, setImportStats] = useState<Record<string, number> | null>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);

  // Excel / CSV Book Import states
  const [importingSpreadsheet, setImportingSpreadsheet] = useState(false);
  const [spreadsheetBooks, setSpreadsheetBooks] = useState<any[] | null>(null);
  const [spreadsheetFileName, setSpreadsheetFileName] = useState('');
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState(false);
  const spreadsheetFileRef = useRef<HTMLInputElement>(null);

  // 1. Export JSON Full Backup
  const handleExportJSON = async () => {
    setExportingJSON(true);
    try {
      const backup = await dbExportBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `digital-library-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড হয়েছে ✅');
    } catch (err: any) {
      toast.error('ব্যাকআপ তৈরিতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setExportingJSON(false);
    }
  };

  // 2. Export Single CSV Table
  const handleExportCSV = async (table: string, label: string) => {
    setExportingCsvTable(table);
    try {
      const res = await dbExportTableCsv(table);
      if (!res.csv || res.count === 0) {
        toast.error(`${label}-এ কোনো তথ্য নেই`);
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `library-${table}-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${label} CSV ডাউনলোড সম্পন্ন ✅ (${res.count} টি রেকর্ড)`);
    } catch (err: any) {
      toast.error('CSV ডাউনলোড ব্যর্থ: ' + err.message);
    } finally {
      setExportingCsvTable(null);
    }
  };

  // 3. Read JSON File for Restore
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const data = parsed.data || parsed;
        if (!data || typeof data !== 'object') {
          toast.error('অবৈধ ব্যাকআপ ফাইল। সঠিক JSON ফাইল নির্বাচন করুন।');
          return;
        }

        const stats: Record<string, number> = {};
        for (const t of BACKUP_TABLES) {
          if (Array.isArray(data[t])) {
            stats[t] = data[t].length;
          }
        }

        setImportData(parsed);
        setImportStats(stats);
        setShowRestoreWarning(true);
      } catch {
        toast.error('ফাইল পড়তে ব্যর্থ! ফাইলটি সঠিক JSON ফরম্যাটে আছে কিনা যাচাই করুন।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 4. Execute Restore
  const handleRestore = async () => {
    if (!importData) return;
    setImporting(true);
    setShowRestoreWarning(false);

    try {
      const res = await dbRestoreBackup(importData);
      const totalRestored = Object.values(res.counts).reduce((a, b) => a + b, 0);
      toast.success(`সফলভাবে ${totalRestored} টি রেকর্ড পুনরুদ্ধার করা হয়েছে! 🎉`, { duration: 5000 });
      setImportData(null);
      setImportStats(null);
    } catch (err: any) {
      console.error(err);
      toast.error('পুনরুদ্ধার ব্যর্থ হয়েছে: ' + (err.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  // 5. Read Excel / CSV File for Book Import
  const handleSelectSpreadsheetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSpreadsheetFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          toast.error('ফাইলটিতে কোনো তথ্য পাওয়া যায়নি');
          return;
        }

        setSpreadsheetBooks(rows);
        setShowSpreadsheetModal(true);
      } catch (err: any) {
        toast.error('Excel/CSV ফাইল পার্স করতে সমস্যা হয়েছে: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 6. Execute Excel / CSV Book Import
  const handleExecuteSpreadsheetImport = async () => {
    if (!spreadsheetBooks || spreadsheetBooks.length === 0) return;
    setImportingSpreadsheet(true);
    setShowSpreadsheetModal(false);

    try {
      const owner = user?.id || 'swapnil';
      const res = await dbImportBooks(spreadsheetBooks, owner);
      toast.success(`অভিনন্দন! ${res.count} টি বই সফলভাবে লাইব্রেরিতে যুক্ত হয়েছে! 📚`, { duration: 5000 });
      setSpreadsheetBooks(null);
    } catch (err: any) {
      toast.error('ইম্পোর্ট করতে সমস্যা: ' + (err.message || 'Error'));
    } finally {
      setImportingSpreadsheet(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>💾 ব্যাকআপ ও পুনরুদ্ধার</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            আপনার লাইব্রেরির সকল বই, লেখক, প্রকাশক ও অন্যান্য ডেটার নিরাপদ ব্যাকআপ রাখুন এবং প্রয়োজনে পুনরুদ্ধার বা ইম্পোর্ট করুন
          </p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Card 1: Full JSON Backup */}
          <div className="card">
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.15rem' }}>
                <span>📥</span>
                <span>সম্পূর্ণ ডাটাবেস ব্যাকআপ (JSON)</span>
              </h3>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
                একটি ক্লিকে সম্পূর্ণ লাইব্রেরির সব ডেটা (১৫টি টেবিল) ডাউনলোড করে রাখুন। এই ফাইলটি ব্যবহার করে পরবর্তীতে যেকোনো সময় সম্পূর্ণ লাইব্রেরি পুনরুদ্ধার করা যাবে।
              </p>
              <button
                className="btn btn-primary w-full"
                onClick={handleExportJSON}
                disabled={exportingJSON}
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                {exportingJSON ? '⏳ ব্যাকআপ তৈরি হচ্ছে...' : '📥 ব্যাকআপ ফাইল ডাউনলোড (JSON)'}
              </button>
            </div>
          </div>

          {/* Card 2: JSON Restore */}
          <div className="card">
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.15rem' }}>
                <span>⚡</span>
                <span>ডেটা পুনরুদ্ধার (JSON Restore)</span>
              </h3>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
                আগে ডাউনলোড করা JSON ব্যাকআপ ফাইল থেকে সকল টেবিলের তথ্য পুনরুদ্ধার করুন। রেকর্ডগুলো স্বয়ংক্রিয়ভাবে আপডেট ও সমন্বয় হবে।
              </p>
              <input
                type="file"
                accept=".json,application/json"
                ref={jsonFileRef}
                onChange={handleImportJsonFile}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-gold w-full"
                onClick={() => jsonFileRef.current?.click()}
                disabled={importing}
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                {importing ? '⏳ পুনরুদ্ধার হচ্ছে...' : '📂 ব্যাকআপ ফাইল নির্বাচন করুন (.json)'}
              </button>
            </div>
          </div>

          {/* Card 3: Direct Excel / CSV Book Import */}
          <div className="card">
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.15rem' }}>
                <span>📊</span>
                <span>Excel / CSV থেকে বই ইম্পোর্ট</span>
              </h3>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
                যেকোনো Excel স্প্রেডশিট (.xlsx, .xls) বা .csv ফাইল থেকে এক ক্লিকে শত শত বই লাইব্রেরিতে সরাসরি ইম্পোর্ট করুন।
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={spreadsheetFileRef}
                onChange={handleSelectSpreadsheetFile}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary w-full"
                onClick={() => spreadsheetFileRef.current?.click()}
                disabled={importingSpreadsheet}
                style={{ justifyContent: 'center', padding: '12px', border: '1.5px dashed var(--accent)' }}
              >
                {importingSpreadsheet ? '⏳ ইম্পোর্ট হচ্ছে...' : '📤 Excel / CSV ফাইল আপলোড করুন'}
              </button>
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: '8px', textAlign: 'center' }}>
                সমর্থিত কলাম: বইয়ের নাম, লেখক, প্রকাশক, দাম, আইএসবিএন ইত্যাদি
              </span>
            </div>
          </div>

          {/* Card 4: CSV Export per Table */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.15rem' }}>
                <span>📑</span>
                <span>Excel / CSV এক্সপোর্ট (টেবিল অনুযায়ী ডাউনলোড)</span>
              </h3>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
                যেকোনো টেবিলের ডেটা আলাদাভাবে CSV ফাইলে ডাউনলোড করুন। ফাইলগুলো <strong>UTF-8 BOM</strong> এনকোডেড হওয়ায় Microsoft Excel বা Google Sheets-এ কোনো ভাঙাচোরা অক্ষর ছাড়াই নিখুঁত বাংলা প্রদর্শিত হবে।
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {CSV_OPTIONS.map((opt) => (
                  <button
                    key={opt.table}
                    className="btn btn-secondary"
                    onClick={() => handleExportCSV(opt.table, opt.label)}
                    disabled={exportingCsvTable === opt.table}
                    style={{
                      justifyContent: 'center',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{exportingCsvTable === opt.table ? '⏳ তৈরি হচ্ছে...' : `${opt.label} (CSV)`}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Card: Tables Included */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.05rem' }}>
              <span>ℹ️</span>
              <span>ব্যাকআপে অন্তর্ভুক্ত সকল টেবিল</span>
            </h3>
          </div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
              }}
            >
              {BACKUP_TABLES.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                  <span>{TABLE_LABELS[t] || t}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted" style={{ marginTop: '16px', marginBlockEnd: 0 }}>
              💡 <strong>টিপস:</strong> পুনরুদ্ধার করার সময় কোনো ডেটা ক্ষতিগ্রস্ত হয় না; ব্যাকআপ ফাইলের আইডি অনুযায়ী রেকর্ডগুলো হালনাগাদ (Update/Insert) হয়।
            </p>
          </div>
        </div>
      </div>

      {/* Restore JSON Confirmation Modal */}
      {showRestoreWarning && importData && (
        <div className="confirm-overlay" onClick={() => setShowRestoreWarning(false)}>
          <div
            className="confirm-dialog"
            style={{ maxWidth: '480px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">⚠️</div>
            <h3>ডেটা পুনরুদ্ধার করতে চান?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              নির্বাচিত ব্যাকআপ ফাইলটিতে নিচের ডেটাগুলো পাওয়া গেছে:
            </p>

            {importStats && (
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  background: 'var(--bg-secondary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border-light)',
                }}
              >
                {Object.entries(importStats).map(([table, count]) => (
                  <div
                    key={table}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: '1px dashed var(--border-light)',
                    }}
                  >
                    <span>{TABLE_LABELS[table] || table}:</span>
                    <strong style={{ color: 'var(--accent)' }}>{count} টি</strong>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '0.82rem', color: 'var(--danger)', marginBottom: '20px' }}>
              এটি নিশ্চিত করলে বিদ্যমান রেকর্ডগুলো ব্যাকআপ ফাইলের ডেটা দিয়ে হালনাগাদ হবে।
            </p>

            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowRestoreWarning(false)}>
                বাতিল
              </button>
              <button className="btn btn-danger" onClick={handleRestore}>
                ⚡ হ্যাঁ, পুনরুদ্ধার করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Confirmation Modal */}
      {showSpreadsheetModal && spreadsheetBooks && (
        <div className="confirm-overlay" onClick={() => setShowSpreadsheetModal(false)}>
          <div
            className="confirm-dialog"
            style={{ maxWidth: '500px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">📚</div>
            <h3>Excel / CSV থেকে বই ইম্পোর্ট</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              ফাইল: <strong>{spreadsheetFileName}</strong>
            </p>
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.88rem',
                textAlign: 'left',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                মোট শনাক্তকৃত বই: <strong style={{ color: 'var(--accent)' }}>{spreadsheetBooks.length} টি</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                মালিকানা নির্ধারণ:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  👤 {user?.name || getOwnerLabel(user?.id)}
                </strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                নমুনা বই:{' '}
                <em>
                  {spreadsheetBooks
                    .slice(0, 3)
                    .map((b) => b.title || b['বইয়ের নাম'] || b['বইয়ের নাম'] || b.Title || '—')
                    .join(', ')}
                  {spreadsheetBooks.length > 3 ? '...' : ''}
                </em>
              </div>
            </div>

            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowSpreadsheetModal(false)}>
                বাতিল
              </button>
              <button className="btn btn-primary" onClick={handleExecuteSpreadsheetImport}>
                📥 বইগুলো ইম্পোর্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
