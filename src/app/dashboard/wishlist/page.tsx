'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { WishlistItem, PRIORITIES, getOwnerLabel, BookOwner } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [isbn, setIsbn] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [priority, setPriority] = useState('medium');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [requestedBy, setRequestedBy] = useState<BookOwner>((user?.id as BookOwner) || 'swapnil');

  useEffect(() => {
    if (user?.id) {
      setRequestedBy(user.id as BookOwner);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('wishlist').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const resetForm = () => { setTitle(''); setAuthorName(''); setPublisherName(''); setIsbn(''); setEstimatedPrice(''); setPriority('medium'); setSource(''); setNotes(''); setRequestedBy(user?.id || 'swapnil'); setEditingId(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (item: WishlistItem) => {
    setEditingId(item.id); setTitle(item.title); setAuthorName(item.author_name || '');
    setPublisherName(item.publisher_name || ''); setIsbn(item.isbn || '');
    setEstimatedPrice(item.estimated_price?.toString() || ''); setPriority(item.priority);
    setSource(item.source || ''); setNotes(item.notes || ''); setRequestedBy(item.requested_by as BookOwner);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('বইয়ের নাম লিখুন'); return; }
    const data = {
      title: title.trim(), author_name: authorName || null, publisher_name: publisherName || null,
      isbn: isbn || null, estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
      priority, source: source || null, notes: notes || null, requested_by: requestedBy,
    };

    if (editingId) {
      const { error } = await supabase.from('wishlist').update(data).eq('id', editingId);
      if (error) toast.error('আপডেট ব্যর্থ'); else toast.success('আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from('wishlist').insert(data);
      if (error) toast.error('যোগ করতে ব্যর্থ'); else toast.success('উইশলিস্টে যোগ হয়েছে 🛒');
    }
    setShowModal(false); resetForm(); fetchData();
  };

  const handlePurchased = async (item: WishlistItem) => {
    // Create book from wishlist
    const { data: bookData, error } = await supabase.from('books').insert({
      title: item.title, isbn: item.isbn || null,
      owner: (user?.id as BookOwner) || (item.requested_by as BookOwner) || 'swapnil', status: 'আছে',
      is_purchased: true, purchase_date: new Date().toISOString().split('T')[0],
      purchase_final_price: item.estimated_price,
    }).select().single();

    if (error) { toast.error('বই তৈরি ব্যর্থ'); return; }

    // Mark wishlist as purchased
    await supabase.from('wishlist').update({
      is_purchased: true, purchased_book_id: bookData.id,
      purchased_date: new Date().toISOString().split('T')[0],
    }).eq('id', item.id);

    await supabase.from('activity_log').insert({
      user_id: user?.id, action: 'wishlist_purchased', entity_type: 'wishlist',
      entity_name: item.title,
    });

    toast.success('কেনা হয়েছে! বই সংগ্রহে যোগ হয়েছে 📚');
    router.push(`/dashboard/books/${bookData.id}/edit`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('wishlist').delete().eq('id', deleteId);
    if (error) toast.error('মুছতে পারা যায়নি'); else { toast.success('মুছে ফেলা হয়েছে'); fetchData(); }
    setDeleteId(null);
  };

  const pendingItems = items.filter(i => !i.is_purchased);
  const purchasedItems = items.filter(i => i.is_purchased);

  return (
    <>
      <div className="page-header"><h2>🛒 উইশলিস্ট ({pendingItems.length})</h2><button className="btn btn-primary" onClick={openAdd}>➕ নতুন যোগ</button></div>
      <div className="page-body">
        {loading ? <div className="loading-inline"><div className="spinner" /></div> : pendingItems.length === 0 && purchasedItems.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🛒</div><h3>উইশলিস্ট খালি</h3><p>কিনতে চাওয়া বই যোগ করুন</p></div>
        ) : (
          <>
            {pendingItems.length > 0 && (
              <div className="table-container" style={{ marginBottom: '32px' }}><table className="table"><thead><tr>
                <th>বই</th><th>লেখক</th><th>আনুমানিক দাম</th><th>অগ্রাধিকার</th><th>কার জন্য</th><th>উৎস</th><th style={{ textAlign: 'right' }}>অ্যাকশন</th>
              </tr></thead><tbody>
                {pendingItems.map(item => {
                  const prioConfig = PRIORITIES.find(p => p.value === item.priority);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.title}</td>
                      <td>{item.author_name || '—'}</td>
                      <td>{item.estimated_price ? `৳${item.estimated_price}` : '—'}</td>
                      <td><span className="badge" style={{ background: `${prioConfig?.color}20`, color: prioConfig?.color }}>{prioConfig?.label}</span></td>
                      <td>{getOwnerLabel(item.requested_by)}</td>
                      <td>{item.source || '—'}</td>
                      <td><div className="actions">
                        <button className="btn btn-sm btn-gold" onClick={() => handlePurchased(item)}>🛒 কেনা হয়েছে</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteId(item.id)}>🗑️</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody></table></div>
            )}

            {purchasedItems.length > 0 && (
              <>
                <h3 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>✅ কেনা হয়েছে ({purchasedItems.length})</h3>
                <div className="table-container"><table className="table"><thead><tr>
                  <th>বই</th><th>কেনার তারিখ</th><th>কার জন্য</th>
                </tr></thead><tbody>
                  {purchasedItems.map(item => (
                    <tr key={item.id} style={{ opacity: 0.6 }}>
                      <td>{item.title}</td>
                      <td>{item.purchased_date || '—'}</td>
                      <td>{getOwnerLabel(item.requested_by)}</td>
                    </tr>
                  ))}
                </tbody></table></div>
              </>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editingId ? '✏️ সম্পাদনা' : '🛒 নতুন উইশলিস্ট'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label className="form-label">বইয়ের নাম *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">লেখক</label><input className="form-input" value={authorName} onChange={e => setAuthorName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">প্রকাশক</label><input className="form-input" value={publisherName} onChange={e => setPublisherName(e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">আনুমানিক দাম (৳)</label><input className="form-input" type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">অগ্রাধিকার</label>
                <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">কার জন্য</label>
                <select className="form-select" value={requestedBy} onChange={e => setRequestedBy(e.target.value as BookOwner)}>
                  <option value="swapnil">স্বপ্নীল</option>
                  <option value="bipro">বিপ্রতীব</option>
                  <option value="srrijan">সৃজন</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">কোথা থেকে কিনবো</label><input className="form-input" value={source} onChange={e => setSource(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">নোট</label><textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button><button type="submit" className="btn btn-primary">{editingId ? '✅ আপডেট' : '➕ যোগ'}</button></div></form>
        </div></div>
      )}

      {deleteId && (<div className="confirm-overlay" onClick={() => setDeleteId(null)}><div className="confirm-dialog" onClick={e => e.stopPropagation()}><div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button><button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button></div></div></div>)}
    </>
  );
}
