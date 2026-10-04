'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AddMagazinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [issueMonth, setIssueMonth] = useState('');
  const [issueYear, setIssueYear] = useState('');
  const [volume, setVolume] = useState('');
  const [publisher, setPublisher] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [status, setStatus] = useState('আছে');
  const [readingStatus, setReadingStatus] = useState('পড়া হয়নি');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) return;
    
    setSaving(true);
    // TODO: implement actual save to DB via API or Supabase direct
    // For now, this is a placeholder
    
    setTimeout(() => {
      setSaving(false);
      router.push('/dashboard/magazines');
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === 'Enter' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
      e.preventDefault();
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>📰 নতুন ম্যাগাজিন যোগ করুন</h2>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="add-book-form">
          <div className="card">
            <div className="card-header">
              <h3>📄 ম্যাগাজিনের তথ্য</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">ম্যাগাজিনের নাম *</label>
                <input 
                  className="form-input" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  placeholder="যেমন: মাসিক আলকাউসার" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">মাস</label>
                  <input 
                    className="form-input" 
                    value={issueMonth} 
                    onChange={e => setIssueMonth(e.target.value)} 
                    placeholder="যেমন: জানুয়ারি" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">সাল (Year)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    value={issueYear} 
                    onChange={e => setIssueYear(e.target.value)} 
                    placeholder="যেমন: 2024" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">সংখ্যা (Volume/Issue)</label>
                  <input 
                    className="form-input" 
                    value={volume} 
                    onChange={e => setVolume(e.target.value)} 
                    placeholder="যেমন: ১৪" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">পৃষ্ঠা সংখ্যা</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    value={pageCount} 
                    onChange={e => setPageCount(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>বাতিল</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? '⏳ সংরক্ষণ করছি...' : '📰 ম্যাগাজিন যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
