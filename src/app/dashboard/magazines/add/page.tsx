'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { bnToEnNumber } from '@/lib/types';

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
  const [status, setStatus] = useState('আছে');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) return;
    
    setSaving(true);
    
    try {
      const magazineData = {
        title: title.trim(),
        issue_month: issueMonth.trim() || null,
        issue_year: issueYear ? parseInt(bnToEnNumber(issueYear)) : null,
        volume: volume.trim() || null,
        publisher_id: publisher || null,
        owner: user.id,
        status,
        added_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('magazines').insert(magazineData).select().single();

      if (error) {
        toast.error('ম্যাগাজিন যোগ করতে সমস্যা: ' + error.message);
      } else {
        // Log activity
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'magazine_added',
          entity_type: 'magazine',
          entity_id: data?.id,
          entity_name: title.trim(),
          details: { owner: user.id, status },
        });

        toast.success('ম্যাগাজিন সফলভাবে যোগ হয়েছে! 📰');
        router.push('/dashboard/magazines');
      }
    } catch (err: any) {
      toast.error('দুঃখিত, একটি সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSaving(false);
    }
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

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">সংখ্যা (Volume/Issue)</label>
                  <input 
                    className="form-input" 
                    value={volume} 
                    onChange={e => setVolume(e.target.value)} 
                    placeholder="যেমন: ১৪" 
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
