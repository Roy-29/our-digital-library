'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { LendingRecord, Borrower, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BanglaDateInput } from '@/components/BanglaDateInput';

export default function LendingPage() {
  const [records, setRecords] = useState<LendingRecord[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'borrowers'>('active');
  const { user } = useAuth();
  const supabase = createClient();

  // Lending Modal State
  const [showLendModal, setShowLendModal] = useState(false);
  const [bookId, setBookId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [lentBy, setLentBy] = useState('swapnil');
  const [dateLent, setDateLent] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [lendNotes, setLendNotes] = useState('');
  const [editingLendId, setEditingLendId] = useState<string | null>(null);
  const [deleteLendId, setDeleteLendId] = useState<string | null>(null);
  const [isReturned, setIsReturned] = useState(false);

  // Borrower Modal State (Add/Edit)
  const [showBorrowerModal, setShowBorrowerModal] = useState(false);
  const [fromLendModal, setFromLendModal] = useState(false);
  const [editingBorrowerId, setEditingBorrowerId] = useState<string | null>(null);
  const [deleteBorrowerId, setDeleteBorrowerId] = useState<string | null>(null);
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bNotes, setBNotes] = useState('');

  // Borrower Details Modal
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [borrowerLendings, setBorrowerLendings] = useState<LendingRecord[]>([]);
  const [borrowerSearch, setBorrowerSearch] = useState('');

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'borrowers' || tabParam === 'people') {
        setActiveTab('borrowers');
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
    if (!bookId || !borrowerId) {
      toast.error('বই ও ধারকারী নির্বাচন করুন');
      return;
    }

    const targetBook = books.find(b => b.id === bookId);
    if (user && targetBook && targetBook.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের বই ধার দিতে/সম্পাদনা করতে পারবেন!');
      return;
    }

    const currentLentBy = user?.id || lentBy || 'swapnil';

    if (editingLendId) {
      // Editing existing record
      const oldRecord = records.find(r => r.id === editingLendId);
      
      const { error } = await supabase.from('lending_records').update({
        book_id: bookId,
        borrower_id: borrowerId,
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
        borrower_id: borrowerId,
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
      const brName = borrowers.find(b => b.id === borrowerId)?.name;

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
    setBorrowerId('');
    setLendNotes('');
    setExpectedReturn('');
    setEditingLendId(null);
    fetchData();
  };

  const openEditLending = (record: LendingRecord) => {
    setEditingLendId(record.id);
    setBookId(record.book_id || (record as any).bookId || '');
    setBorrowerId(record.borrower_id || (record as any).borrowerId || '');
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

  // Borrower Form Reset & Openers
  const resetBorrowerForm = () => {
    setBName('');
    setBPhone('');
    setBEmail('');
    setBAddress('');
    setBNotes('');
    setEditingBorrowerId(null);
    setFromLendModal(false);
  };

  const openLendModal = () => {
    setBookId('');
    setBorrowerId('');
    setLendNotes('');
    setExpectedReturn('');
    setDateLent(new Date().toISOString().split('T')[0]);
    setLentBy(user?.id || 'swapnil');
    setEditingLendId(null);
    setIsReturned(false);
    setShowLendModal(true);
  };

  const openAddBorrower = (isFromLendModal = false) => {
    resetBorrowerForm();
    setFromLendModal(isFromLendModal);
    setShowBorrowerModal(true);
  };

  const openEditBorrower = (b: Borrower) => {
    setEditingBorrowerId(b.id);
    setBName(b.name);
    setBPhone(b.phone || '');
    setBEmail(b.email || '');
    setBAddress(b.address || '');
    setBNotes(b.notes || '');
    setFromLendModal(false);
    setShowBorrowerModal(true);
  };

  const handleSubmitBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bName.trim();
    if (!trimmed) {
      toast.error('নাম লিখুন');
      return;
    }

    const payload = {
      name: trimmed,
      phone: bPhone.trim() || null,
      email: bEmail.trim() || null,
      address: bAddress.trim() || null,
      notes: bNotes.trim() || null,
    };

    if (editingBorrowerId) {
      const { error } = await supabase.from('borrowers').update(payload).eq('id', editingBorrowerId);
      if (error) {
        toast.error('আপডেট ব্যর্থ');
      } else {
        toast.success('ধারকারী আপডেট হয়েছে ✅');
        setShowBorrowerModal(false);
        resetBorrowerForm();
        fetchData();
      }
    } else {
      const { data, error } = await supabase.from('borrowers').insert(payload);
      if (error) {
        toast.error('যোগ করতে ব্যর্থ');
      } else {
        toast.success('ধারকারী যোগ হয়েছে ✅');
        setShowBorrowerModal(false);
        resetBorrowerForm();
        await fetchData();
        if (fromLendModal && data?.id) {
          setBorrowerId(data.id);
        }
      }
    }
  };

  const getActiveBorrowCount = (id: string) => {
    return records.filter(r => r.borrower_id === id && !r.is_returned).length;
  };

  const handleDeleteBorrower = async () => {
    if (!deleteBorrowerId) return;
    const activeCount = getActiveBorrowCount(deleteBorrowerId);
    if (activeCount > 0) {
      toast.error('এই ব্যক্তির কাছে বর্তমানে বই ধার দেওয়া আছে! ফেরত না নেওয়া পর্যন্ত মুছতে পারবেন না।');
      setDeleteBorrowerId(null);
      return;
    }
    const { error } = await supabase.from('borrowers').delete().eq('id', deleteBorrowerId);
    if (error) {
      toast.error('মুছতে পারা যায়নি');
    } else {
      toast.success('ধারকারী মুছে ফেলা হয়েছে');
      fetchData();
    }
    setDeleteBorrowerId(null);
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

  const filteredBorrowers = borrowers.filter(b => {
    if (!borrowerSearch) return true;
    const q = borrowerSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.phone && b.phone.toLowerCase().includes(q)) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="page-header">
        <h2>📤 ধার ও ধারকারী</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => openAddBorrower(false)}>
            ➕ নতুন ধারকারী
          </button>
          <button className="btn btn-primary" onClick={openLendModal}>
            📤 বই ধার দিন
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            📤 বর্তমান ধার ({activeRecords.length})
          </button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 ধারের ইতিহাস ({historyRecords.length})
          </button>
          <button className={`tab ${activeTab === 'borrowers' ? 'active' : ''}`} onClick={() => setActiveTab('borrowers')}>
            👥 ধারকারী তালিকা ({borrowers.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner" /></div>
        ) : activeTab === 'borrowers' ? (
          /* ===== TAB 3: BORROWERS LIST ===== */
          <div>
            <div className="search-bar" style={{ marginBottom: '16px', maxWidth: '100%' }}>
              <span className="search-icon">🔍</span>
              <input
                placeholder="ধারকারী খুঁজুন (নাম, ফোন, ইমেইল)..."
                value={borrowerSearch}
                onChange={e => setBorrowerSearch(e.target.value)}
              />
            </div>

            {filteredBorrowers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>কোনো ধারকারী নেই</h3>
                <p>বই ধার দেওয়ার জন্য নতুন ধারকারী যোগ করুন</p>
                <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={() => openAddBorrower(false)}>
                  ➕ নতুন ধারকারী যোগ করুন
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
                {filteredBorrowers.map(b => {
                  const activeCount = getActiveBorrowCount(b.id);
                  return (
                    <div
                      key={b.id}
                      className="card"
                      style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => viewBorrowerDetails(b)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            flexShrink: 0,
                          }}
                        >
                          {b.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.name}
                          </div>
                          {activeCount > 0 ? (
                            <span className="badge badge-yellow" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
                              📤 {activeCount}টি বই ধার আছে
                            </span>
                          ) : (
                            <span className="text-xs text-muted">কোনো বই ধার নেই</span>
                          )}
                        </div>
                        <div className="actions" onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" title="সম্পাদনা" onClick={() => openEditBorrower(b)}>✏️</button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="মুছুন" onClick={() => setDeleteBorrowerId(b.id)}>🗑️</button>
                        </div>
                      </div>

                      {b.phone && (
                        <div className="text-xs text-muted" style={{ marginTop: '6px' }}>
                          📱 <a href={`tel:${b.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit' }}>{b.phone}</a>
                        </div>
                      )}
                      {b.email && (
                        <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                          📧 <a href={`mailto:${b.email}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit' }}>{b.email}</a>
                        </div>
                      )}
                      {b.address && (
                        <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                          📍 {b.address}
                        </div>
                      )}
                      {b.notes && (
                        <div className="text-xs text-muted" style={{ marginTop: '8px', fontStyle: 'italic', borderTop: '1px dashed var(--border-light)', paddingTop: '6px' }}>
                          📝 {b.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                      <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'active' ? activeRecords : historyRecords).map(r => {
                      const bookTitle = r.book?.title || books.find(b => b.id === (r.book_id || (r as any).bookId))?.title || '—';
                      const borrowerObj = r.borrower || borrowers.find(b => b.id === (r.borrower_id || (r as any).borrowerId));
                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 500 }}>
                            <Link href={`/dashboard/books/${r.book_id || (r as any).bookId}`} className="text-primary hover:underline" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
                              {bookTitle}
                            </Link>
                          </td>
                          <td>
                            {borrowerObj ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                style={{ fontWeight: 600, padding: 0 }}
                                onClick={() => viewBorrowerDetails(borrowerObj)}
                              >
                                👤 {borrowerObj.name}
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                        <td>{getOwnerLabel(r.lent_by)}</td>
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
                          <div className="actions" style={{ gap: '6px', justifyContent: 'flex-end' }}>
                            {(() => {
                              const bookOwner = r.book?.owner || books.find(b => b.id === (r.book_id || (r as any).bookId))?.owner;
                              const canManage = !user || r.lent_by === user.id || bookOwner === user.id;
                              if (canManage) {
                                return (
                                  <>
                                    {!r.is_returned && (
                                      <button className="btn btn-sm btn-primary" onClick={() => handleReturn(r)} style={{ marginRight: '4px' }}>
                                        ✅ ফেরত পেয়েছি
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-ghost btn-icon btn-sm"
                                      onClick={() => openEditLending(r)}
                                      title="সম্পাদনা করুন"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-icon btn-sm"
                                      onClick={() => setDeleteLendId(r.id)}
                                      title="মুছে ফেলুন"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                );
                              }
                              return !r.is_returned ? <span className="text-xs text-muted">চলতি ধার</span> : null;
                            })()}
                          </div>
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
                  <select className="form-select" value={bookId} onChange={e => setBookId(e.target.value)} required>
                    <option value="">
                      {myAvailableBooks.length === 0 
                        ? '— আপনার কোনো বই ধার দেওয়ার জন্য উপলব্ধ নেই —' 
                        : '— বই নির্বাচন করুন —'}
                    </option>
                    {myAvailableBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                  {myAvailableBooks.length === 0 && (
                    <div className="text-xs" style={{ marginTop: '6px', color: 'var(--amber)' }}>
                      ⚠️ আপনার সংগ্রহের কোনো বই বর্তমানে ধার দেওয়ার মতো উপলব্ধ নেই।
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>👤 ধারকারী *</label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-primary"
                      onClick={() => openAddBorrower(true)}
                    >
                      ➕ নতুন ধারকারী যোগ
                    </button>
                  </div>
                  <select className="form-select" value={borrowerId} onChange={e => setBorrowerId(e.target.value)} required>
                    <option value="">— ধারকারী নির্বাচন করুন —</option>
                    {borrowers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}{b.phone ? ` (${b.phone})` : ''}</option>
                    ))}
                  </select>
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLendModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">{editingLendId ? '✅ আপডেট করুন' : '📤 ধার দিন'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD / EDIT BORROWER MODAL ===== */}
      {showBorrowerModal && (
        <div className="modal-overlay" style={{ zIndex: fromLendModal ? 1100 : 1000 }} onClick={() => setShowBorrowerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBorrowerId ? '✏️ ধারকারী সম্পাদনা' : '➕ নতুন ধারকারী'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBorrowerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitBorrower}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">নাম *</label>
                  <input
                    className="form-input"
                    placeholder="ধারকারীর নাম..."
                    value={bName}
                    onChange={e => setBName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ফোন</label>
                    <input className="form-input" placeholder="01..." value={bPhone} onChange={e => setBPhone(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ইমেইল</label>
                    <input className="form-input" type="email" placeholder="example@gmail.com" value={bEmail} onChange={e => setBEmail(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ঠিকানা</label>
                  <input className="form-input" placeholder="ঠিকানা বা অবস্থান..." value={bAddress} onChange={e => setBAddress(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">নোট</label>
                  <textarea className="form-textarea" placeholder="ব্যক্তি সম্পর্কে বিশেষ নোট..." value={bNotes} onChange={e => setBNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBorrowerModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">{editingBorrowerId ? '✅ আপডেট' : '➕ যোগ করুন'}</button>
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

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      {deleteBorrowerId && (
        <div className="confirm-overlay" onClick={() => setDeleteBorrowerId(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>ধারকারীকে মুছে ফেলবেন?</h3>
            <p>এই ব্যক্তির তথ্য তালিকা থেকে মুছে যাবে।</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteBorrowerId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={handleDeleteBorrower}>🗑️ মুছুন</button>
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
