'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', params.id).single();
    if (error || !data) {
      toast.error('ব্যবহারকারী পাওয়া যায়নি');
      router.push('/dashboard/users');
      return;
    }
    setProfile(data);
    setDisplayName(data.display_name || '');
    setRole(data.role || 'member');
    setLoading(false);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('নাম ফাঁকা রাখা যাবে না');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      role: role
    }).eq('id', params.id);
    
    if (error) {
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে');
    } else {
      toast.success('প্রোফাইল আপডেট হয়েছে');
      setProfile(prev => prev ? { ...prev, display_name: displayName, role: role } : null);
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <>
        <div className="page-header"><h2>👥 ব্যবহারকারী প্রোফাইল</h2></div>
        <div className="page-body"><div className="loading-inline"><div className="spinner" /></div></div>
      </>
    );
  }

  if (!profile) return null;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.push('/dashboard/users')} 
            className="btn btn-secondary"
            title="ফিরে যান"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>⬅️</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ফিরে যান</span>
          </button>
          <h2 style={{ margin: 0 }}>👥 প্রোফাইল: {profile.display_name}</h2>
        </div>
        {!isEditing && (
          <div className="flex gap-2 page-header-actions">
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>✏️ সম্পাদনা</button>
          </div>
        )}
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h3>{isEditing ? 'প্রোফাইল সম্পাদনা করুন' : 'প্রোফাইল বিস্তারিত'}</h3>
          </div>
          <div className="card-body">
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', 
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '3rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  profile.display_name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">আইডি (ID)</label>
                  <input className="form-input" type="text" value={profile.id} disabled style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }} />
                  <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>ব্যবহারকারীর আইডি পরিবর্তন করা যায় না।</span>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">নাম <span style={{color: 'var(--danger)'}}>*</span></label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    placeholder="ব্যবহারকারীর নাম"
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">রোল (Role)</label>
                  <select 
                    className="form-select" 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="admin">Admin (অ্যাডমিন)</option>
                    <option value="member">Member (সদস্য)</option>
                  </select>
                </div>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="btn btn-secondary flex-1" onClick={() => setIsEditing(false)} disabled={saving}>বাতিল</button>
                  <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? 'সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ করুন'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <DetailRow label="আইডি (ID)" value={`@${profile.id}`} />
                <DetailRow label="নাম" value={profile.display_name} />
                <DetailRow label="রোল (Role)" value={profile.role === 'admin' ? 'Admin (অ্যাডমিন)' : 'Member (সদস্য)'} />
                
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
                  <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>📊 অ্যাক্টিভিটি</h4>
                  <Link href={`/dashboard/books?owner=${profile.id}`} className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    📚 {profile.display_name}-এর বইগুলো দেখুন
                  </Link>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ minWidth: '140px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--charcoal)', fontSize: '1rem', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
