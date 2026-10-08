'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { enToBnNumber, getOwnerLabel, OWNERS } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
          const { data: issues } = await supabase.from('magazine_issues').select('magazine_id');
          
          const issuesCount = (issues || []).reduce((acc: any, curr: any) => {
            acc[curr.magazine_id] = (acc[curr.magazine_id] || 0) + 1;
            return acc;
          }, {});

          const mapped = data.map((mag: any) => ({
            ...mag,
            issues_count: issuesCount[mag.id] || 0
          }));
          
          setMagazines(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMagazines();
  }, []);

  const filteredMagazines = magazines.filter((mag) => {
    if (filterOwner && mag.owner !== filterOwner) return false;
    
    if (!search) return true;
    const q = search.toLowerCase();
    return mag.title?.toLowerCase().includes(q);
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
            <span className="pill-badge">{enToBnNumber(magazines.length.toString())}</span>
          </button>
          {user && (
            <button 
              type="button"
              className={`owner-pill ${filterOwner === user.id ? 'active' : ''}`}
              onClick={() => setFilterOwner(filterOwner === user.id ? '' : user.id)}
            >
              <span>⭐ আমার ম্যাগাজিন</span>
              <span className="pill-badge">{enToBnNumber(magazines.filter(m => m.owner === user.id).length.toString())}</span>
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
                <span className="pill-badge">{enToBnNumber(count.toString())}</span>
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
          <div className="books-grid magazines-grid">
            {filteredMagazines.map((mag: any) => (
              <div key={mag.id} className="book-card" style={{ display: 'flex', flexDirection: 'column', aspectRatio: '1 / 1', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <Link href={`/dashboard/magazines/${mag.id}`} style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '16px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ 
                    width: '72px', 
                    height: '96px', 
                    borderRadius: '6px', 
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    marginBottom: '16px'
                  }}>
                    {mag.cover_url ? (
                      <img src={mag.cover_url} alt={mag.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span style={{ fontSize: '32px' }}>📰</span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 className="book-title" style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 8px 0', lineHeight: 1.3 }}>{mag.title}</h3>
                    <div className="book-meta" style={{ justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <span style={{ opacity: 0.8, marginRight: '6px' }}>📚</span>
                        সংগ্রহ: <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>{enToBnNumber(mag.issues_count?.toString() || '0')}</strong> ইস্যু
                      </span>
                    </div>
                  </div>
                </Link>
                
                <div className="book-card-info" style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'center' }}>
                  <div className="book-card-footer" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      {user?.id === mag.owner ? (
                        <span style={{ color: 'var(--success)' }}>✅ {getOwnerLabel(mag.owner)} (আপনি)</span>
                      ) : (
                        <span>👤 {getOwnerLabel(mag.owner)}</span>
                      )}
                    </div>
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
