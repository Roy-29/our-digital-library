'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { LendingRecord, Borrower, getOwnerLabel, enToBnNumber } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BanglaDateInput } from '@/components/BanglaDateInput';
import { CustomSelect } from '@/components/CustomSelect';

export default function LendingPage() {
  const [records, setRecords] = useState<LendingRecord[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const { user } = useAuth();
  const supabase = createClient();

  // Lending Modal State
  const [showLendModal, setShowLendModal] = useState(false);
  const [bookId, setBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [lentBy, setLentBy] = useState('swapnil');
  const [dateLent, setDateLent] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [lendNotes, setLendNotes] = useState('');
  const [editingLendId, setEditingLendId] = useState<string | null>(null);
  const [deleteLendId, setDeleteLendId] = useState<string | null>(null);
  const [isReturned, setIsReturned] = useState(false);

  // Borrower Details Modal
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [borrowerLendings, setBorrowerLendings] = useState<LendingRecord[]>([]);
  
  // Lending Details Modal
  const [detailsLendItem, setDetailsLendItem] = useState<LendingRecord | null>(null);

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'history') {
        setActiveTab('history');
      }
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [lRes, bRes, brRes] = await Promise.all([
      supabase.from('lending_records').select('*').order('created_at', { ascending: false }),
      supabase.from('books').select('id, title, status, owner, cover_url').order('title'),
      supabase.from('borrowers').select('*').order('name'),
    ]);
    const booksList = bRes.data || [];
    const borrowersList = brRes.data || [];
    const booksMap = new Map(booksList.map((b: any) => [b.id, b]));
    const borrowersMap = new Map(borrowersList.map((br: any) => [br.id, br]));

    const populatedRecords = (lRes.data || []).map((r: any) => {
      const bid = r.book_id || r.bookId;
      const brid = r.borrower_id || r.borrowerId;
      return {
        ...r,
        book_id: bid,
        borrower_id: brid,
        book: booksMap.get(bid) || null,
        borrower: borrowersMap.get(brid) || null,
      };
    });

    setRecords(populatedRecords);
    setBooks(booksList);
    setBorrowers(borrowersList);
    setLoading(false);
  };

  // Lending handlers
  const handleLend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !borrowerName.trim()) {
      toast.error('বই ও ধারকারীর নাম দিন');
      return;
    }

    let currentBorrowerId = '';
    const trimmedName = borrowerName.trim();
    // find or create borrower
    const existingB = borrowers.find(b => b.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingB) {
      currentBorrowerId = existingB.id;
    } else {
      const { data: newB, error: errB } = await supabase.from('borrowers').insert({ name: trimmedName }).select().single();
      if (errB || !newB) {
        toast.error('ধারকারীর নাম সেভ করতে সমস্যা হয়েছে');
        return;
      }
      currentBorrowerId = newB.id;
    }

    const targetBook = books.find(b => b.id === bookId);


    const currentLentBy = user?.id || lentBy || 'swapnil';

    if (editingLendId) {
      // Editing existing record
      const oldRecord = records.find(r => r.id === editingLendId);
      
      const { error } = await supabase.from('lending_records').update({
        book_id: bookId,
        borrower_id: currentBorrowerId,
        date_lent: dateLent,
        expected_return_date: expectedReturn || null,
        notes: lendNotes || null,
        is_returned: isReturned,
        ...(isReturned && !oldRecord?.is_returned ? { date_returned: new Date().toISOString().split('T')[0] } : {}),
        ...(!isReturned ? { date_returned: null } : {})
      }).eq('id', editingLendId);

      if (error) {
        toast.error('আপডেট ব্যর্থ: ' + error.message);
        return;
      }

      // If book changed, revert old book status
      if (oldRecord && oldRecord.book_id !== bookId && !oldRecord.is_returned) {
        await supabase.from('books').update({ status: 'আছে' }).eq('id', oldRecord.book_id);
      }
      const newBookStatus = isReturned ? 'আছে' : 'ধার দেওয়া';
      await supabase.from('books').update({ status: newBookStatus }).eq('id', bookId);

      toast.success('ধারের তথ্য আপডেট হয়েছে ✅');
    } else {
      // Creating new record
      const { error } = await supabase.from('lending_records').insert({
        book_id: bookId,
        borrower_id: currentBorrowerId,
        lent_by: currentLentBy,
        date_lent: dateLent,
        expected_return_date: expectedReturn || null,
        notes: lendNotes || null,
      });

      if (error) {
        toast.error('ব্যর্থ: ' + error.message);
        return;
      }

      await supabase.from('books').update({ status: 'ধার দেওয়া' }).eq('id', bookId);

      const bTitle = targetBook?.title || books.find(b => b.id === bookId)?.title;
      const brName = trimmedName;

      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'book_lent',
        entity_type: 'lending',
        entity_name: bTitle,
        details: { borrower: brName },
      });

      toast.success('বই ধার দেওয়া হয়েছে 📤');
    }

    setShowLendModal(false);
    setBookId('');
    setBorrowerName('');
    setLendNotes('');
    setExpectedReturn('');
    setEditingLendId(null);
    fetchData();
  };

  const openEditLending = (record: LendingRecord) => {
    setEditingLendId(record.id);
    setBookId(record.book_id || (record as any).bookId || '');
    const recordBorrowerObj = record.borrower || borrowers.find(b => b.id === (record.borrower_id || (record as any).borrowerId));
    setBorrowerName(recordBorrowerObj?.name || '');
    setDateLent(record.date_lent || new Date().toISOString().split('T')[0]);
    setExpectedReturn(record.expected_return_date || '');
    setLendNotes(record.notes || '');
    setIsReturned(record.is_returned || false);
    setShowLendModal(true);
  };

  const handleDeleteLending = async () => {
    if (!deleteLendId) return;
    const record = records.find(r => r.id === deleteLendId);
    
    if (record) {
      const bookOwner = record.book?.owner || books.find(b => b.id === (record.book_id || (record as any).bookId))?.owner;
      if (user && record.lent_by !== user.id && bookOwner !== user.id) {
        toast.error('আপনি শুধুমাত্র নিজের এন্ট্রি মুছতে পারবেন!');
        setDeleteLendId(null);
        return;
      }
      
      const { error } = await supabase.from('lending_records').delete().eq('id', deleteLendId);
      if (error) {
        toast.error('মুছতে ব্যর্থ: ' + error.message);
      } else {
        if (!record.is_returned) {
           await supabase.from('books').update({ status: 'আছে' }).eq('id', record.book_id || (record as any).bookId);
        }
        toast.success('রেকর্ড মুছে ফেলা হয়েছে 🗑️');
        fetchData();
      }
    }
    setDeleteLendId(null);
  };

  const handleReturn = async (record: LendingRecord) => {
    const bookOwner = record.book?.owner || books.find(b => b.id === (record.book_id || (record as any).bookId))?.owner;
    if (user && record.lent_by !== user.id && bookOwner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের ধার দেওয়া বই ফেরত নিতে পারবেন!');
      return;
    }

    const { error } = await supabase.from('lending_records').update({
      is_returned: true,
      date_returned: new Date().toISOString().split('T')[0],
    }).eq('id', record.id);

    if (error) {
      toast.error('ব্যর্থ');
      return;
    }

    // Update book status back
    await supabase.from('books').update({ status: 'আছে' }).eq('id', record.book_id);

    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'book_returned',
      entity_type: 'lending',
      entity_name: record.book?.title,
      details: { borrower: record.borrower?.name },
    });

    toast.success('বই ফেরত পাওয়া গেছে! ✅');
    fetchData();
  };

  const openLendModal = () => {
    setBookId('');
    setBorrowerName('');
    setLendNotes('');
    setExpectedReturn('');
    setDateLent(new Date().toISOString().split('T')[0]);
    setLentBy(user?.id || 'swapnil');
    setEditingLendId(null);
    setIsReturned(false);
    setShowLendModal(true);
  };

  const viewBorrowerDetails = async (b: Borrower) => {
    setSelectedBorrower(b);
    const { data } = await supabase
      .from('lending_records')
      .select('*')
      .eq('borrower_id', b.id)
      .order('date_lent', { ascending: false });
    
    const booksMap = new Map(books.map((bk: any) => [bk.id, bk]));
    const list = (data || []).map((item: any) => {
      const bid = item.book_id || item.bookId;
      return {
        ...item,
        book_id: bid,
        book: booksMap.get(bid) || null,
        borrower: b,
      };
    });
    setBorrowerLendings(list);
  };

  const activeRecords = records.filter(r => !r.is_returned);
  const historyRecords = records.filter(r => r.is_returned);
  const isOverdue = (r: LendingRecord) => !r.is_returned && r.expected_return_date && new Date(r.expected_return_date) < new Date();

  // Only the logged in user's books can be lent!
  const myAvailableBooks = books.filter(b => 
    (user ? b.owner === user.id : true) && 
    (
      (b.status !== 'ধার দেওয়া' && b.status !== 'হারিয়ে গেছে') || 
      (editingLendId && b.id === bookId)
    )
  );



  return (
    <>
      <div className="page-header">
        <h2>📤 ধার দেওয়া বই</h2>
        <button className="btn btn-primary" onClick={openLendModal}>
          📤 বই ধার দিন
        </button>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            📤 বর্তমান ধার ({activeRecords.length})
          </button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 ধারের ইতিহাস ({historyRecords.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner" /></div>
        ) : (
          /* ===== TAB 1 & 2: ACTIVE & HISTORY RECORDS ===== */
          <div>
            {(activeTab === 'active' ? activeRecords : historyRecords).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📤</div>
                <h3>{activeTab === 'active' ? 'কোনো বই ধার দেওয়া নেই' : 'কোনো ধারের ইতিহাস নেই'}</h3>
                {activeTab === 'active' && (
                  <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={openLendModal}>
                    📤 নতুন বই ধার দিন
                  </button>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>বই</th>
                      <th>ধারকারী</th>
                      <th>ধার দিয়েছে</th>
                      <th>তারিখ</th>
                      <th>ফেরতের তারিখ</th>
                      <th>অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'active' ? activeRecords : historyRecords).map(r => {
                      const bookTitle = r.book?.title || books.find(b => b.id === (r.book_id || (r as any).bookId))?.title || '—';
                      const borrowerObj = r.borrower || borrowers.find(b => b.id === (r.borrower_id || (r as any).borrowerId));
                      return (
                        <tr 
                          key={r.id} 
                          onClick={() => setDetailsLendItem(r)}
                          style={{ cursor: 'pointer' }}
                          className="hoverable-row"
                        >
                          <td style={{ fontWeight: 500 }}>
                            <Link 
                              href={`/dashboard/books/${r.book_id || (r as any).bookId}`} 
                              className="text-primary hover:underline" 
                              style={{ color: 'inherit', textDecoration: 'none' }} 
                              onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} 
                              onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                              onClick={e => e.stopPropagation()}
                            >
                              {bookTitle}
                            </Link>
                          </td>
                          <td>
                            {borrowerObj ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                style={{ fontWeight: 600, padding: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewBorrowerDetails(borrowerObj);
                                }}
                              >
                                👤 {borrowerObj.name}
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getOwnerLabel(r.lent_by)}
                            {user?.id === r.lent_by && (
                              <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>আপনি</span>
                            )}
                          </div>
                        </td>
                        <td>{r.date_lent ? enToBnNumber(r.date_lent) : '—'}</td>
                        <td>{r.expected_return_date ? enToBnNumber(r.expected_return_date) : '—'}</td>
                        <td>
                          {r.is_returned ? (
                            <span className="badge badge-green">✅ ফেরত পাওয়া ({enToBnNumber(r.date_returned || '')})</span>
                          ) : isOverdue(r) ? (
                            <span className="badge badge-red">⏰ সময় পেরিয়ে গেছে</span>
                          ) : (
                            <span className="badge badge-yellow">📤 ধার দেওয়া</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== LEND BOOK MODAL ===== */}
      {showLendModal && (
        <div className="modal-overlay" onClick={() => setShowLendModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLendId ? '✏️ ধার সম্পাদনা করুন' : '📤 বই ধার দিন'}</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowLendModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLend}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">📚 আপনার বই নির্বাচন করুন *</label>
                  <CustomSelect
                    options={myAvailableBooks.map(b => ({ value: b.id, label: b.title }))}
                    value={bookId}
                    onChange={setBookId}
                    placeholder={myAvailableBooks.length === 0 ? '— আপনার কোনো বই ধার দেওয়ার জন্য উপলব্ধ নেই —' : '— বই নির্বাচন করুন —'}
                  />
                  {myAvailableBooks.length === 0 && (
                    <div className="text-xs" style={{ marginTop: '6px', color: 'var(--amber)' }}>
                      ⚠️ আপনার সংগ্রহের কোনো বই বর্তমানে ধার দেওয়ার মতো উপলব্ধ নেই।
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">👤 ধারকারীর নাম *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="যার কাছে ধার দিচ্ছেন তার নাম..."
                    value={borrowerName}
                    onChange={e => setBorrowerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">কে দিচ্ছে</label>
                    <input 
                      className="form-input" 
                      value={getOwnerLabel((user?.id || lentBy) as any)} 
                      disabled 
                      readOnly 
                      style={{ opacity: 0.9, background: 'var(--bg-card)', cursor: 'not-allowed', fontWeight: 500 }} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">তারিখ</label>
                    <BanglaDateInput value={dateLent} onChange={setDateLent} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">সম্ভাব্য ফেরত তারিখ</label>
                    <BanglaDateInput value={expectedReturn} onChange={setExpectedReturn} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">নোট</label>
                  <textarea className="form-textarea" placeholder="প্রয়োজনে অতিরিক্ত তথ্য লিখুন..." value={lendNotes} onChange={e => setLendNotes(e.target.value)} />
                </div>
                
                {editingLendId && (
                  <div className="form-group">
                    <label className="form-label">অবস্থা</label>
                    <select className="form-select" value={isReturned ? 'true' : 'false'} onChange={e => setIsReturned(e.target.value === 'true')}>
                      <option value="false">📤 ধার দেওয়া</option>
                      <option value="true">✅ ফেরত পাওয়া</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {editingLendId ? (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => {
                      setDeleteLendId(editingLendId);
                      setShowLendModal(false);
                    }}
                  >
                    🗑️ মুছে ফেলুন
                  </button>
                ) : <div></div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLendModal(false)}>বাতিল</button>
                  <button type="submit" className="btn btn-primary">{editingLendId ? '✅ আপডেট করুন' : '📤 ধার দিন'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ===== BORROWER DETAIL MODAL ===== */}
      {selectedBorrower && (
        <div className="modal-overlay" onClick={() => setSelectedBorrower(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 {selectedBorrower.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedBorrower(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '18px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                {selectedBorrower.phone && <div>📱 <strong>ফোন:</strong> <a href={`tel:${selectedBorrower.phone}`}>{selectedBorrower.phone}</a></div>}
                {selectedBorrower.email && <div>📧 <strong>ইমেইল:</strong> <a href={`mailto:${selectedBorrower.email}`}>{selectedBorrower.email}</a></div>}
                {selectedBorrower.address && <div>📍 <strong>ঠিকানা:</strong> {selectedBorrower.address}</div>}
                {selectedBorrower.notes && <div style={{ width: '100%' }}>📝 <strong>নোট:</strong> {selectedBorrower.notes}</div>}
              </div>

              <h4 style={{ marginBottom: '12px' }}>📚 ধার নেওয়া বইয়ের ইতিহাস</h4>
              {borrowerLendings.length === 0 ? (
                <p className="text-muted">কোনো বই ধার নেওয়ার ইতিহাস নেই</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>বইয়ের নাম</th>
                        <th>ধারের তারিখ</th>
                        <th>ফেরত তারিখ</th>
                        <th>অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowerLendings.map(l => {
                        const bookTitle = l.book?.title || books.find(b => b.id === (l.book_id || (l as any).bookId))?.title || '—';
                        return (
                          <tr key={l.id}>
                            <td style={{ fontWeight: 500 }}>{bookTitle}</td>
                            <td>{l.date_lent}</td>
                            <td>{l.date_returned || '—'}</td>
                            <td>
                              {l.is_returned ? (
                                <span className="badge badge-green">✅ ফেরত</span>
                              ) : (
                                <span className="badge badge-yellow">📤 ধার চলছে</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBorrower(null)}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}



      {/* ===== LENDING DETAILS MODAL ===== */}
      {detailsLendItem && (
        <div className="modal-overlay" onClick={() => setDetailsLendItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📖 ধারের বিস্তারিত</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setDetailsLendItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  {detailsLendItem.book?.title || books.find(b => b.id === (detailsLendItem.book_id || (detailsLendItem as any).bookId))?.title || '—'}
                </h4>
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>ধারকারী:</strong> {detailsLendItem.borrower?.name || borrowers.find(b => b.id === (detailsLendItem.borrower_id || (detailsLendItem as any).borrowerId))?.name || '—'}
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>ধার দিয়েছেন:</strong> {getOwnerLabel(detailsLendItem.lent_by)}
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>তারিখ:</strong> {detailsLendItem.date_lent}
                </p>
                {detailsLendItem.expected_return_date && (
                  <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <strong>ফেরতের সম্ভাব্য তারিখ:</strong> {detailsLendItem.expected_return_date}
                  </p>
                )}
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>বর্তমান অবস্থা:</strong>{' '}
                  {detailsLendItem.is_returned ? (
                    <span style={{ color: 'var(--text-success)', fontWeight: 600 }}>✅ ফেরত পাওয়া ({detailsLendItem.date_returned})</span>
                  ) : isOverdue(detailsLendItem) ? (
                    <span style={{ color: 'var(--text-danger)', fontWeight: 600 }}>⏰ সময় পেরিয়ে গেছে</span>
                  ) : (
                    <span style={{ color: 'var(--text-warning)', fontWeight: 600 }}>📤 ধার দেওয়া</span>
                  )}
                </p>
              </div>

              {detailsLendItem.notes && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>নোট:</strong>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{detailsLendItem.notes}</div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(() => {
                    const bookOwner = detailsLendItem.book?.owner || books.find(b => b.id === (detailsLendItem.book_id || (detailsLendItem as any).bookId))?.owner;
                    const canManage = !user || detailsLendItem.lent_by === user.id || bookOwner === user.id;
                    if (canManage && !detailsLendItem.is_returned) {
                      return (
                        <button className="btn btn-primary" onClick={() => { setDetailsLendItem(null); handleReturn(detailsLendItem); }}>
                          ✅ ফেরত পেয়েছি
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(() => {
                    const bookOwner = detailsLendItem.book?.owner || books.find(b => b.id === (detailsLendItem.book_id || (detailsLendItem as any).bookId))?.owner;
                    const canManage = !user || detailsLendItem.lent_by === user.id || bookOwner === user.id;
                    if (canManage) {
                      return (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setDetailsLendItem(null);
                            openEditLending(detailsLendItem);
                          }}
                        >
                          ✏️ সম্পাদনা
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE LENDING RECORD DIALOG ===== */}
      {deleteLendId && (
        <div className="confirm-overlay" onClick={() => setDeleteLendId(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>রেকর্ডটি মুছে ফেলবেন?</h3>
            <p>এই ধারের তথ্যটি মুছে যাবে।</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteLendId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={handleDeleteLending}>🗑️ মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
