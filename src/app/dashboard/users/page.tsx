'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('display_name');
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <div className="page-header"><h2>👥 ব্যবহারকারী</h2></div>
        <div className="page-body"><div className="loading-inline"><div className="spinner" /></div></div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>👥 ব্যবহারকারী</h2>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px' }}>নাম</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>আইডি</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>রোল (Role)</th>
                    <th style={{ textAlign: 'right', padding: '16px' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: 'var(--primary-light)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1.2rem'
                          }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              user.display_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span style={{ fontWeight: 600 }}>{user.display_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>@{user.id}</td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge badge-gray">{user.role}</span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <Link href={`/dashboard/users/${user.id}`} className="btn btn-secondary btn-sm">
                          বিস্তারিত ➡️
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
