'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { enToBnNumber } from '@/lib/types';

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchMagazines() {
      try {
        const { data, error } = await supabase.from('magazines').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setMagazines(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMagazines();
  }, []);
  
  return (
    <>
      <div className="page-header">
        <h2>📰 ম্যাগাজিন</h2>
        <div className="page-header-actions">
          <Link href="/dashboard/magazines/add" className="btn btn-primary">
            ➕ ম্যাগাজিন যোগ করুন
          </Link>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>লোড হচ্ছে...</p>
          </div>
        ) : magazines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>কোনো ম্যাগাজিন নেই</h3>
            <p>আপনার সংগ্রহে এখনও কোনো ম্যাগাজিন যোগ করা হয়নি। নতুন ম্যাগাজিন যোগ করতে উপরের বাটনে ক্লিক করুন।</p>
          </div>
        ) : (
          <div className="books-grid">
            {magazines.map((mag: any) => (
              <div key={mag.id} className="book-card">
                <div className="book-card-info" style={{ padding: '16px' }}>
                  <h3 className="book-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{mag.title}</h3>
                  
                  {mag.issue_month && (
                    <div className="book-meta">
                      <span className="icon">🗓️</span>
                      <span>মাস: {mag.issue_month}</span>
                    </div>
                  )}
                  
                  {mag.issue_year && (
                    <div className="book-meta">
                      <span className="icon">📅</span>
                      <span>সাল: {enToBnNumber(mag.issue_year.toString())}</span>
                    </div>
                  )}
                  
                  {mag.volume && (
                    <div className="book-meta">
                      <span className="icon">🔢</span>
                      <span>সংখ্যা: {mag.volume}</span>
                    </div>
                  )}
                  
                  <div className="book-card-footer" style={{ marginTop: '16px', gap: '8px', display: 'flex', flexWrap: 'wrap' }}>
                    <span className={`status-badge status-${mag.status === 'আছে' ? 'owned' : 'missing'}`}>
                      {mag.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
