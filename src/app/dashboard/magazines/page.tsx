'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { enToBnNumber, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Trash2, Edit2 } from 'lucide-react';

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে আপনি "${title}" ম্যাগাজিনটি মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('magazines').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('ম্যাগাজিন মুছে ফেলা হয়েছে');
      setMagazines(magazines.filter(m => m.id !== id));
      
      if (user?.id) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'magazine_deleted',
          entity_type: 'magazine',
          entity_id: id,
          entity_name: title,
          details: { owner: user.id },
        });
      }
    } catch (err: any) {
      toast.error('ম্যাগাজিন মুছতে সমস্যা: ' + err.message);
    }
  };
  
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
                  
                  <div className="book-card-footer" style={{ marginTop: '16px', gap: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`status-badge status-${mag.status === 'আছে' ? 'owned' : 'missing'}`}>
                        {mag.status}
                      </span>
                      <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        👤 {getOwnerLabel(mag.owner)}
                        {user?.id === mag.owner && (
                          <span style={{ color: '#10b981', fontSize: '0.8rem' }}> (✅ আপনি)</span>
                        )}
                      </span>
                    </div>
                    
                    {user?.id === mag.owner && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/dashboard/magazines/${mag.id}/edit`} className="btn btn-ghost btn-icon" title="এডিট করুন" style={{ padding: '4px' }}>
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(mag.id, mag.title)}
                          className="btn btn-ghost btn-icon" 
                          title="ডিলিট করুন"
                          style={{ padding: '4px', color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
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
