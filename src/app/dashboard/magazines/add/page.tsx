'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { bnToEnNumber, enToBnNumber } from '@/lib/types';

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

  const handleYearInput = (inputVal: string, setter: (val: string) => void) => {
    const englishVal = bnToEnNumber(inputVal);
    const cleanVal = englishVal.replace(/\D/g, '');
    const truncated = cleanVal.slice(0, 4);
    setter(truncated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) return;
    
    setSaving(true);
    
    try {
      // 1. Check if magazine with same title and owner already exists
      const { data: existing } = await supabase.from('magazines')
        .select('id')
        .eq('owner', user.id)
        .ilike('title', title.trim())
        .limit(1);
        
      if (existing && existing.length > 0) {
        toast.error('এই নামের ম্যাগাজিন ইতিমধ্যে আছে! দয়া করে ম্যাগাজিন লিস্ট থেকে এটিতে ক্লিক করে নতুন ইস্যু যোগ করুন।');
        setSaving(false);
        return;
      }

      // 2. Resolve publisher ID
      let pubId = null;
      if (publisher.trim()) {
        const { data: existingPub } = await supabase.from('publishers').select('id').ilike('name', publisher.trim()).single();
        if (existingPub) {
          pubId = existingPub.id;
        } else {
          const { data: newPub } = await supabase.from('publishers').insert({ name: publisher.trim() }).select('id').single();
          if (newPub) pubId = newPub.id;
        }
      }

      // 3. Create the magazine (Series)
      const magazineData = {
        title: title.trim(),
        publisher_id: pubId,
        owner: user.id,
        added_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: magData, error: magErr } = await supabase.from('magazines').insert(magazineData).select().single();

      if (magErr) {
        throw magErr;
      }
      
      // 3. Create the first issue
      if (magData) {
        const issueData = {
          magazine_id: magData.id,
          issue_month: issueMonth.trim() || null,
          issue_year: issueYear ? parseInt(bnToEnNumber(issueYear)) : null,
          volume: volume.trim() || null,
          status: status,
          copies: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { error: issueErr } = await supabase.from('magazine_issues').insert(issueData);
        if (issueErr) throw issueErr;
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'magazine_added',
        entity_type: 'magazine',
        entity_id: magData?.id,
        entity_name: title.trim(),
        details: { owner: user.id },
      });

      toast.success('ম্যাগাজিন সফলভাবে যোগ হয়েছে! 📰');
      router.push('/dashboard/magazines');
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

              <div className="form-group">
                <label className="form-label">প্রকাশক</label>
                <input 
                  className="form-input" 
                  value={publisher} 
                  onChange={e => setPublisher(e.target.value)} 
                  placeholder="যেমন: প্রথমা প্রকাশন" 
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
                    list="months-datalist"
                  />
                  <datalist id="months-datalist">
                    <option value="জানুয়ারি" />
                    <option value="ফেব্রুয়ারি" />
                    <option value="মার্চ" />
                    <option value="এপ্রিল" />
                    <option value="মে" />
                    <option value="জুন" />
                    <option value="জুলাই" />
                    <option value="আগস্ট" />
                    <option value="সেপ্টেম্বর" />
                    <option value="অক্টোবর" />
                    <option value="নভেম্বর" />
                    <option value="ডিসেম্বর" />
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">সাল (Year)</label>
                  <input 
                    className="form-input" 
                    type="text"
                    inputMode="numeric"
                    value={enToBnNumber(issueYear)} 
                    onChange={e => handleYearInput(e.target.value, setIssueYear)} 
                    placeholder="যেমন: ২০২৪" 
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
                  <label className="form-label">অবস্থা</label>
                  <select 
                    className="form-input"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="আছে">আছে</option>
                    <option value="নাই">নাই</option>
                    <option value="ধার দেওয়া হয়েছে">ধার দেওয়া</option>
                    <option value="হারিয়ে গেছে">হারিয়ে গেছে</option>
                  </select>
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
