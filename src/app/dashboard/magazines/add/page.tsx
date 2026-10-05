'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AddMagazinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');

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
      if (magData?.id) {
        router.push(`/dashboard/magazines/${magData.id}`);
      } else {
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
                  autoFocus
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
