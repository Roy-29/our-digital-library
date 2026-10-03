'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ActivityLog, formatRelativeTimeBn } from '@/lib/types';

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  const actionLabels: Record<string, { icon: string; label: string }> = {
    book_added: { icon: '📚', label: 'বই যোগ' },
    book_updated: { icon: '✏️', label: 'বই আপডেট' },
    book_deleted: { icon: '🗑️', label: 'বই মুছে ফেলা' },
    book_lent: { icon: '📤', label: 'বই ধার দেওয়া' },
    book_returned: { icon: '✅', label: 'বই ফেরত পাওয়া' },
    book_finished: { icon: '🎉', label: 'পড়া শেষ' },
    wishlist_purchased: { icon: '🛒', label: 'উইশলিস্ট থেকে কেনা' },
  };

  const formatDate = (dateStr: string) => {
    return formatRelativeTimeBn(dateStr);
  };

  return (
    <>
      <div className="page-header"><h2>📋 কার্যকলাপ</h2></div>
      <div className="page-body">
        {loading ? <div className="loading-inline"><div className="spinner" /></div> : logs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>কোনো কার্যকলাপ নেই</h3></div>
        ) : (
          <div style={{ maxWidth: '700px' }}>
            {logs.map((log, i) => {
              const action = actionLabels[log.action] || { icon: '📌', label: log.action };
              return (
                <div key={log.id} style={{
                  display: 'flex', gap: '16px', padding: '16px 0',
                  borderBottom: i < logs.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{action.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div>
                      <strong>{action.label}</strong>
                      {log.entity_name && <span style={{ color: 'var(--text-secondary)' }}> — {log.entity_name}</span>}
                    </div>
                    {log.details && (
                      <div className="text-xs text-muted mt-2">
                        {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
