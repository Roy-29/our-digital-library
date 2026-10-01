'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { LendingRecord, Book, Borrower } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LendingPage() {
  const [records, setRecords] = useState<LendingRecord[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const { user } = useAuth();
  const supabase = createClient();

  const [bookId, setBookId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [lentBy, setLentBy] = useState('swapnil');
  const [dateLent, setDateLent] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [lendNotes, setLendNotes] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [lRes, bRes, brRes] = await Promise.all([
      supabase.from('lending_records').select('*, book:books(id, title, cover_url, owner), borrower:borrowers(*)').order('created_at', { ascending: false }),
      supabase.from('books').select('id, title, status, owner').order('title'),
      supabase.from('borrowers').select('*').order('name'),
    ]);
    setRecords(lRes.data || []);
    setBooks(bRes.data || []);
    setBorrowers(brRes.data || []);
    setLoading(false);
  };

  const handleLend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !borrowerId) { toast.error('বই ও ধারকারী নির্বাচন করুন'); return; }

    const { error } = await supabase.from('lending_records').insert({
      book_id: bookId, borrower_id: borrowerId, lent_by: lentBy,
      date_lent: dateLent, expected_return_date: expectedReturn || null, notes: lendNotes || null,
    });

    if (error) { toast.error('ব্যর্থ: ' + error.message); return; }

    // Update book status
    await supabase.from('books').update({ status: 'ধার দেওয়া' }).eq('id', bookId);

    await supabase.from('activity_log').insert({
      user_id: user?.id, action: 'book_lent', entity_type: 'lending',
      entity_name: books.find(b => b.id === bookId)?.title,
      details: { borrower: borrowers.find(b => b.id === borrowerId)?.name },
    });

    toast.success('বই ধার দেওয়া হয়েছে 📤');
    setShowModal(false); setBookId(''); setBorrowerId(''); setLendNotes(''); setExpectedReturn('');
    fetchData();
  };

  const handleReturn = async (record: LendingRecord) => {
    const { error } = await supabase.from('lending_records').update({
      is_returned: true, date_returned: new Date().toISOString().split('T')[0],
    }).eq('id', record.id);

    if (error) { toast.error('ব্যর্থ'); return; }

    // Update book status back
    await supabase.from('books').update({ status: 'আছে' }).eq('id', record.book_id);

    await supabase.from('activity_log').insert({
      user_id: user?.id, action: 'book_returned', entity_type: 'lending',
      entity_name: record.book?.title,
      details: { borrower: record.borrower?.name },
    });

    toast.success('বই ফেরত পাওয়া গেছে! ✅');
    fetchData();
  };

  const activeRecords = records.filter(r => !r.is_returned);
  const historyRecords = records.filter(r => r.is_returned);
  const displayRecords = activeTab === 'active' ? activeRecords : historyRecords;

  const isOverdue = (r: LendingRecord) => !r.is_returned && r.expected_return_date && new Date(r.expected_return_date) < new Date();

  return (
    <>
      <div className="page-header">
        <h2>📤 ধার দেওয়া</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>📤 নতুন ধার</button>
      </div>
      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            📤 বর্তমান ({activeRecords.length})
          </button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 ইতিহাস ({historyRecords.length})
          </button>
        </div>

        {loading ? <div className="loading-inline"><div className="spinner" /></div> : displayRecords.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📤</div><h3>{activeTab === 'active' ? 'কোনো বই ধার দেওয়া নেই' : 'কোনো ইতিহাস নেই'}</h3></div>
        ) : (
          <div className="table-container"><table className="table"><thead><tr>
            <th>বই</th><th>ধারকারী</th><th>ধার দিয়েছে</th><th>তারিখ</th><th>ফেরতের তারিখ</th><th>অবস্থা</th><th style={{ textAlign: 'right' }}>অ্যাকশন</th>
          </tr></thead><tbody>
            {displayRecords.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.book?.title || '—'}</td>
                <td>{r.borrower?.name || '—'}</td>
                <td>{r.lent_by}</td>
                <td>{r.date_lent}</td>
                <td>{r.expected_return_date || '—'}</td>
                <td>
                  {r.is_returned ? (
                    <span className="badge badge-green">✅ ফেরত পাওয়া ({r.date_returned})</span>
                  ) : isOverdue(r) ? (
                    <span className="badge badge-red">⏰ সময় পেরিয়ে গেছে</span>
                  ) : (
                    <span className="badge badge-yellow">📤 ধার দেওয়া</span>
                  )}
                </td>
                <td>
                  <div className="actions">
                    {!r.is_returned && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleReturn(r)}>
                        ✅ ফেরত পেয়েছি
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>📤 বই ধার দিন</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
          <form onSubmit={handleLend}><div className="modal-body">
            <div className="form-group"><label className="form-label">📚 বই নির্বাচন *</label>
              <select className="form-select" value={bookId} onChange={e => setBookId(e.target.value)} required>
                <option value="">— বই নির্বাচন —</option>
                {books.filter(b => b.status !== 'ধার দেওয়া' && b.status !== 'হারিয়ে গেছে').map(b => <option key={b.id} value={b.id}>{b.title} ({b.owner})</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">👤 ধারকারী *</label>
              <select className="form-select" value={borrowerId} onChange={e => setBorrowerId(e.target.value)} required>
                <option value="">— ধারকারী নির্বাচন —</option>
                {borrowers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">কে দিচ্ছে</label>
                <select className="form-select" value={lentBy} onChange={e => setLentBy(e.target.value)}>
                  <option value="swapnil">Swapnil</option><option value="bipro">Bipro</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">তারিখ</label><input className="form-input" type="date" value={dateLent} onChange={e => setDateLent(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">ফেরতের তারিখ</label><input className="form-input" type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">নোট</label><textarea className="form-textarea" value={lendNotes} onChange={e => setLendNotes(e.target.value)} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button><button type="submit" className="btn btn-primary">📤 ধার দিন</button></div></form>
        </div></div>
      )}
    </>
  );
}
