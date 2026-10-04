'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { bnToEnNumber, enToBnNumber } from '@/lib/types';
import { use } from 'react';

export default function EditMagazinePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const resolvedParams = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [issueMonth, setIssueMonth] = useState('');
  const [issueYear, setIssueYear] = useState('');
  const [volume, setVolume] = useState('');
  const [publisher, setPublisher] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [status, setStatus] = useState('আছে');
  const [readingStatus, setReadingStatus] = useState('পড়া হয়নি');

  useEffect(() => {
    async function fetchMagazine() {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('magazines').select('*').eq('id', resolvedParams.id).single();
        if (error) throw error;
        if (data) {
          if (data.owner !== user.id) {
            toast.error('আপনি শুধুমাত্র আপনার নিজের ম্যাগাজিন এডিট করতে পারবেন');
            router.push('/dashboard/magazines');
            return;
          }
          
          setTitle(data.title || '');
          setIssueMonth(data.issue_month || '');
          setIssueYear(data.issue_year ? data.issue_year.toString() : '');
          setVolume(data.volume || '');
          setPublisher(data.publisher_id || '');
          setPageCount(data.page_count ? data.page_count.toString() : '');
          setStatus(data.status || 'আছে');
          setReadingStatus(data.reading_status || 'পড়া হয়নি');
        }
      } catch (err: any) {
        toast.error('তথ্য লোড করতে সমস্যা: ' + err.message);
        router.push('/dashboard/magazines');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMagazine();
  }, [resolvedParams.id, user, router]);

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
        page_count: pageCount ? parseInt(bnToEnNumber(pageCount)) : null,
        status,
        reading_status: readingStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('magazines').update(magazineData).eq('id', resolvedParams.id);

      if (error) {
        toast.error('ম্যাগাজিন এডিট করতে সমস্যা: ' + error.message);
      } else {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'magazine_edited',
          entity_type: 'magazine',
          entity_id: resolvedParams.id,
          entity_name: title.trim(),
          details: { owner: user.id, status },
        });

        toast.success('ম্যাগাজিন সফলভাবে আপডেট হয়েছে! 📰');
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

  if (loading) {
    return (
      <div className="page-body">
        <div className="loading-state">
          <div className="spinner" />
          <p>তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>📰 ম্যাগাজিন এডিট করুন</h2>
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
                  placeholder="যেমন: কিশোর আলো, আনন্দমেলা" 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">মাস</label>
                  <input 
                    className="form-input" 
                    value={issueMonth} 
                    onChange={e => setIssueMonth(e.target.value)} 
                    placeholder="যেমন: জানুয়ারি, বৈশাখ" 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">সাল</label>
                  <input 
                    className="form-input" 
                    value={enToBnNumber(issueYear)} 
                    onChange={e => setIssueYear(e.target.value)} 
                    placeholder="যেমন: ২০২৪" 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">সংখ্যা (Volume)</label>
                  <input 
                    className="form-input" 
                    value={volume} 
                    onChange={e => setVolume(e.target.value)} 
                    placeholder="যেমন: ২য় বর্ষ, ৫ম সংখ্যা" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">পৃষ্ঠা সংখ্যা</label>
                  <input 
                    className="form-input" 
                    type="text"
                    inputMode="numeric"
                    value={enToBnNumber(pageCount)} 
                    onChange={e => setPageCount(e.target.value)} 
                    placeholder="যেমন: ১২০" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3>📌 সংগ্রহ ও স্ট্যাটাস</h3>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">বর্তমান অবস্থা *</label>
                  <select 
                    className="form-input"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="আছে">আছে</option>
                    <option value="পড়া হচ্ছে">পড়া হচ্ছে</option>
                    <option value="ধার দেওয়া হয়েছে">ধার দেওয়া হয়েছে</option>
                    <option value="নাই">নাই</option>
                    <option value="হারিয়ে গেছে">হারিয়ে গেছে</option>
                    <option value="উইশলিস্ট">উইশলিস্ট</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">পড়ার স্ট্যাটাস *</label>
                  <select 
                    className="form-input"
                    value={readingStatus}
                    onChange={e => setReadingStatus(e.target.value)}
                  >
                    <option value="পড়া হয়নি">পড়া হয়নি</option>
                    <option value="পড়া হচ্ছে">পড়া হচ্ছে</option>
                    <option value="পড়া শেষ">পড়া শেষ</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Link href="/dashboard/magazines" className="btn btn-secondary">
              বাতিল
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
