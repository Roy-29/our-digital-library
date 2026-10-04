'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { bnToEnNumber, enToBnNumber, getOwnerLabel, formatDateBn } from '@/lib/types';
import { use } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function ViewMagazinePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const resolvedParams = use(params);
  
  const [loading, setLoading] = useState(true);
  const [magazine, setMagazine] = useState<any>(null);

  useEffect(() => {
    async function fetchMagazine() {
      try {
        const { data, error } = await supabase.from('magazines').select('*').eq('id', resolvedParams.id).single();
        if (error) throw error;
        if (data) {
          setMagazine(data);
        }
      } catch (err: any) {
        toast.error('তথ্য লোড করতে সমস্যা: ' + err.message);
        router.push('/dashboard/magazines');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMagazine();
  }, [resolvedParams.id, router]);

  const handleDelete = async () => {
    if (!magazine || !user) return;
    if (magazine.owner !== user.id) return;
    
    if (!confirm(`আপনি কি নিশ্চিত যে আপনি "${magazine.title}" ম্যাগাজিনটি মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('magazines').delete().eq('id', magazine.id);
      if (error) throw error;
      
      toast.success('ম্যাগাজিন মুছে ফেলা হয়েছে');
      
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'magazine_deleted',
        entity_type: 'magazine',
        entity_id: magazine.id,
        entity_name: magazine.title,
        details: { owner: user.id },
      });
      
      router.push('/dashboard/magazines');
    } catch (err: any) {
      toast.error('ম্যাগাজিন মুছতে সমস্যা: ' + err.message);
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

  if (!magazine) return null;

  return (
    <>
      <div className="page-header">
        <h2>📰 ম্যাগাজিনের বিস্তারিত</h2>
        {user?.id === magazine.owner && (
          <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/dashboard/magazines/${magazine.id}/edit`} className="btn btn-secondary">
              <Edit2 size={16} /> এডিট
            </Link>
            <button onClick={handleDelete} className="btn btn-danger" style={{ backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' }}>
              <Trash2 size={16} /> ডিলিট
            </button>
          </div>
        )}
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{magazine.title}</h3>
            <span className={`status-badge status-${magazine.status === 'আছে' ? 'owned' : 'missing'}`}>
              {magazine.status}
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              
              <div className="info-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>মালিক</span>
                <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  👤 {getOwnerLabel(magazine.owner)}
                  {user?.id === magazine.owner && (
                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}> (✅ আপনি)</span>
                  )}
                </span>
              </div>

              {magazine.reading_status && (
                <div className="info-group">
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>পড়ার স্ট্যাটাস</span>
                  <span style={{ fontWeight: 500 }}>{magazine.reading_status}</span>
                </div>
              )}

              {magazine.issue_month && (
                <div className="info-group">
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>মাস</span>
                  <span style={{ fontWeight: 500 }}>{magazine.issue_month}</span>
                </div>
              )}

              {magazine.issue_year && (
                <div className="info-group">
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>সাল</span>
                  <span style={{ fontWeight: 500 }}>{enToBnNumber(magazine.issue_year.toString())}</span>
                </div>
              )}

              {magazine.volume && (
                <div className="info-group">
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>সংখ্যা</span>
                  <span style={{ fontWeight: 500 }}>{magazine.volume}</span>
                </div>
              )}

              {magazine.page_count && (
                <div className="info-group">
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>পৃষ্ঠা সংখ্যা</span>
                  <span style={{ fontWeight: 500 }}>{enToBnNumber(magazine.page_count.toString())}</span>
                </div>
              )}

            </div>
            
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              যোগ করা হয়েছে: {formatDateBn(magazine.created_at)}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          <Link href="/dashboard/magazines" className="btn btn-secondary">
            ← ফিরে যান
          </Link>
        </div>
      </div>
    </>
  );
}
