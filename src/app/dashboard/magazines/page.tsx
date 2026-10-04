'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { enToBnNumber, getOwnerLabel, OWNERS } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Trash2, Edit2 } from 'lucide-react';

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
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

  const filteredMagazines = magazines.filter((mag) => {
    if (filterOwner && mag.owner !== filterOwner) return false;
    
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      mag.title?.toLowerCase().includes(q) ||
      mag.issue_month?.toLowerCase().includes(q) ||
      mag.volume?.toLowerCase().includes(q)
    );
  });
  
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
        <div className="owner-pills-bar">
          <button 
            type="button"
            className={`owner-pill ${filterOwner === '' ? 'active' : ''}`}
            onClick={() => setFilterOwner('')}
          >
            <span>📰 সব ম্যাগাজিন</span>
            <span className="pill-badge">{magazines.length}</span>
          </button>
          {user && (
            <button 
              type="button"
              className={`owner-pill ${filterOwner === user.id ? 'active' : ''}`}
              onClick={() => setFilterOwner(filterOwner === user.id ? '' : user.id)}
            >
              <span>⭐ আমার ম্যাগাজিন</span>
              <span className="pill-badge">{magazines.filter(m => m.owner === user.id).length}</span>
            </button>
          )}
          {OWNERS.map(owner => {
            if (user?.id === owner.value) return null;
            const count = magazines.filter(m => m.owner === owner.value).length;
            return (
              <button 
                key={owner.value}
                type="button"
                className={`owner-pill ${filterOwner === owner.value ? 'active' : ''}`}
                onClick={() => setFilterOwner(filterOwner === owner.value ? '' : owner.value)}
              >
                <span>👤 {owner.label}</span>
                <span className="pill-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="books-controls-bar">
          <div className="books-search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="ম্যাগাজিনের নাম, মাস বা সংখ্যা খুঁজুন..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>লোড হচ্ছে...</p>
          </div>
        ) : filteredMagazines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>কোনো ম্যাগাজিন নেই</h3>
            <p>আপনার সংগ্রহে এখনও কোনো ম্যাগাজিন যোগ করা হয়নি। নতুন ম্যাগাজিন যোগ করতে উপরের বাটনে ক্লিক করুন।</p>
          </div>
        ) : (
          <div className="books-grid">
            {filteredMagazines.map((mag: any) => (
              <div key={mag.id} className="book-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '320px' }}>
                <div className="book-card-info" style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="book-title" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>{mag.title}</h3>
                  
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
                  
                  <div className="book-card-footer" style={{ marginTop: 'auto', paddingTop: '16px', gap: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`status-badge status-${mag.status === 'আছে' ? 'owned' : 'missing'}`}>
                        {mag.status}
                      </span>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        {user?.id === mag.owner ? (
                          <span style={{ color: '#059669' }}>✅ আপনার</span>
                        ) : (
                          <span>👤 {getOwnerLabel(mag.owner)}</span>
                        )}
                      </div>
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
