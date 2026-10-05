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
  const [publisher, setPublisher] = useState('');

  useEffect(() => {
    async function fetchMagazine() {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('magazines').select('*, publisher:publishers(name)').eq('id', resolvedParams.id).single();
        if (error) throw error;
        if (data) {
          if (data.owner !== user.id) {
            toast.error('আপনি শুধুমাত্র আপনার নিজের ম্যাগাজিন এডিট করতে পারবেন');
            router.push('/dashboard/magazines');
            return;
          }
          
          setTitle(data.title || '');
          setPublisher(data.publisher?.name || '');
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

      const magazineData = {
        title: title.trim(),
        publisher_id: pubId,
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
          details: { owner: user.id },
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
