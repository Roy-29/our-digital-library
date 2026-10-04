'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { WishlistItem, PRIORITIES, getOwnerLabel, BookOwner, OWNERS } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type OwnerFilter = 'all' | BookOwner;

interface AuthorOption {
  id: string;
  name: string;
  name_bn: string | null;
}

interface PublisherOption {
  id: string;
  name: string;
  name_bn: string | null;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [authorsList, setAuthorsList] = useState<AuthorOption[]>([]);
  const [publishersList, setPublishersList] = useState<PublisherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Filters
  const [selectedOwner, setSelectedOwner] = useState<OwnerFilter>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [isbn, setIsbn] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [priority, setPriority] = useState('medium');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const [detailsItem, setDetailsItem] = useState<WishlistItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [wishlistRes, authorsRes, publishersRes] = await Promise.all([
        supabase.from('wishlist').select('*').order('created_at', { ascending: false }),
        supabase.from('authors').select('id, name, name_bn').order('name_bn', { ascending: true }),
        supabase.from('publishers').select('id, name, name_bn').order('name_bn', { ascending: true }),
      ]);

      if (wishlistRes.data) {
        setItems(wishlistRes.data);
      }
      if (authorsRes.data) {
        setAuthorsList(authorsRes.data);
      }
      if (publishersRes.data) {
        setPublishersList(publishersRes.data);
      }
    } catch (err: any) {
      toast.error('উইশলিস্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthorName('');
    setPublisherName('');
    setIsbn('');
    setEstimatedPrice('');
    setPriority('medium');
    setSource('');
    setNotes('');
    setCoverUrl('');
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: WishlistItem) => {
    // Only the owner of the wishlist item can edit it
    if (user && item.requested_by !== user.id) {
      toast.error(`এই উইশলিস্টটি ${getOwnerLabel(item.requested_by)}-এর। শুধুমাত্র উনি এটি সম্পাদনা করতে পারবেন!`);
      return;
    }
    setEditingId(item.id);
    setTitle(item.title);
    setAuthorName(item.author_name || '');
    setPublisherName(item.publisher_name || '');
    setIsbn(item.isbn || '');
    setEstimatedPrice(item.estimated_price?.toString() || '');
    setPriority(item.priority || 'medium');
    setSource(item.source || '');
    setNotes(item.notes || '');
    setCoverUrl(item.cover_url || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('বইয়ের নাম লিখুন');
      return;
    }

    const currentUserId = (user?.id as BookOwner) || 'swapnil';

    if (editingId) {
      const existing = items.find((i) => i.id === editingId);
      if (existing && user && existing.requested_by !== user.id) {
        toast.error('আপনি শুধুমাত্র নিজের উইশলিস্ট এন্ট্রি সম্পাদনা করতে পারবেন!');
        return;
      }

      const payload = {
        title: title.trim(),
        author_name: authorName.trim() || null,
        publisher_name: publisherName.trim() || null,
        isbn: isbn.trim() || null,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        priority,
        source: source.trim() || null,
        notes: notes.trim() || null,
        cover_url: coverUrl.trim() || null,
        requested_by: existing?.requested_by || currentUserId,
      };

      const { error } = await supabase.from('wishlist').update(payload).eq('id', editingId);
      if (error) {
        toast.error('আপডেট ব্যর্থ: ' + error.message);
      } else {
        toast.success('উইশলিস্ট আপডেট হয়েছে ✅');
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } else {
      // Strictly add for currently logged in user
      const payload = {
        title: title.trim(),
        author_name: authorName.trim() || null,
        publisher_name: publisherName.trim() || null,
        isbn: isbn.trim() || null,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        priority,
        source: source.trim() || null,
        notes: notes.trim() || null,
        cover_url: coverUrl.trim() || null,
        requested_by: currentUserId,
      };

      const { error } = await supabase.from('wishlist').insert(payload);
      if (error) {
        toast.error('যোগ করতে ব্যর্থ: ' + error.message);
      } else {
        toast.success('আপনার উইশলিস্টে যোগ হয়েছে 🛒');
        setShowModal(false);
        resetForm();
        fetchData();
      }
    }
  };

  const handlePurchased = async (item: WishlistItem) => {
    if (user && item.requested_by !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের উইশলিস্টের বই কেনা হয়েছে মার্ক করতে পারবেন!');
      return;
    }
    
    setPurchasingId(item.id);
    const targetOwner = (item.requested_by as BookOwner) || (user?.id as BookOwner) || 'swapnil';
    const buyerName = user?.name || getOwnerLabel(user?.id);

    try {
      // 1. Create book in collection for the requester
      const { data: bookData, error: bookErr } = await supabase
        .from('books')
        .insert({
          title: item.title,
          isbn: item.isbn || null,
          owner: targetOwner,
          status: 'আছে',
          is_purchased: true,
          purchase_date: new Date().toISOString().split('T')[0],
          purchase_final_price: item.estimated_price,
          purchased_by: buyerName,
        })
        .select()
        .single();

      if (bookErr) {
        toast.error('বই তৈরি ব্যর্থ: ' + bookErr.message);
        setPurchasingId(null);
        return;
      }

      // 2. Mark wishlist item as purchased
      await supabase
        .from('wishlist')
        .update({
          is_purchased: true,
          purchased_book_id: bookData?.id || null,
          purchased_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', item.id);

      // 3. Log activity
      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'wishlist_purchased',
        entity_type: 'wishlist',
        entity_name: item.title,
        details: {
          requested_by: item.requested_by,
          purchased_by: buyerName,
        },
      });

      toast.success(`'${item.title}' কেনা হয়েছে এবং ${getOwnerLabel(targetOwner)}-এর সংগ্রহে যুক্ত হয়েছে 📚`);
      await fetchData();

      if (bookData?.id) {
        router.push(`/dashboard/books/${bookData.id}/edit`);
      }
    } catch (err: any) {
      toast.error('কেনা সম্পন্ন করার সময় সমস্যা হয়েছে');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const target = items.find((i) => i.id === deleteId);
    if (target && user && target.requested_by !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের উইশলিস্ট এন্ট্রি মুছে ফেলতে পারবেন!');
      setDeleteId(null);
      return;
    }

    const { error } = await supabase.from('wishlist').delete().eq('id', deleteId);
    if (error) {
      toast.error('মুছতে পারা যায়নি: ' + error.message);
    } else {
      toast.success('উইশলিস্ট থেকে মুছে ফেলা হয়েছে');
      fetchData();
    }
    setDeleteId(null);
  };

  // Separation of pending and purchased
  const pendingItems = useMemo(() => items.filter((i) => !i.is_purchased), [items]);
  const purchasedItems = useMemo(() => items.filter((i) => i.is_purchased), [items]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: pendingItems.length,
      swapnil: pendingItems.filter((i) => i.requested_by === 'swapnil').length,
      bipro: pendingItems.filter((i) => i.requested_by === 'bipro').length,
      srrijan: pendingItems.filter((i) => i.requested_by === 'srrijan').length,
    };
  }, [pendingItems]);

  // Filter pending items
  const filteredPending = useMemo(() => {
    return pendingItems.filter((item) => {
      // Owner filter
      if (selectedOwner !== 'all' && item.requested_by !== selectedOwner) return false;

      // Priority filter
      if (priorityFilter && item.priority !== priorityFilter) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const authorMatch = item.author_name?.toLowerCase().includes(q);
        const publisherMatch = item.publisher_name?.toLowerCase().includes(q);
        const sourceMatch = item.source?.toLowerCase().includes(q);
        const notesMatch = item.notes?.toLowerCase().includes(q);
        const ownerMatch = getOwnerLabel(item.requested_by)?.toLowerCase().includes(q);
        return titleMatch || authorMatch || publisherMatch || sourceMatch || notesMatch || ownerMatch;
      }
      return true;
    });
  }, [pendingItems, selectedOwner, priorityFilter, search]);

  // Filter purchased items
  const filteredPurchased = useMemo(() => {
    return purchasedItems.filter((item) => {
      if (selectedOwner !== 'all' && item.requested_by !== selectedOwner) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.author_name?.toLowerCase().includes(q) ||
          getOwnerLabel(item.requested_by)?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [purchasedItems, selectedOwner, search]);

  // Estimated total price for filtered pending items
  const totalEstimatedPrice = useMemo(() => {
    return filteredPending.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
  }, [filteredPending]);

  const editingItem = editingId ? items.find((i) => i.id === editingId) : null;

  return (
    <>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>🛒 উইশলিস্ট</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            সবার উইশলিস্ট একনজরে দেখুন • আপনি লগইন আছেন:{' '}
            <strong style={{ color: 'var(--accent)' }}>
              👤 {user?.name || getOwnerLabel(user?.id)}
            </strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ gap: '8px' }}>
          <span>➕</span>
          <span>নতুন উইশলিস্ট যোগ</span>
        </button>
      </div>

      <div className="page-body">
        {/* Navigation Tabs (All, Swapnil, Bipro, Srrijan) */}
        <div className="tabs" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={`tab ${selectedOwner === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedOwner('all')}
          >
            <span>👥 সবার উইশলিস্ট</span>
            <span
              style={{
                marginLeft: '4px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                background: selectedOwner === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                border: '1px solid var(--border-light)',
              }}
            >
              {tabCounts.all}
            </span>
          </button>

          {OWNERS.map((o) => {
            const isMe = user?.id === o.value;
            const isTabActive = selectedOwner === o.value;
            return (
              <button
                key={o.value}
                type="button"
                className={`tab ${isTabActive ? 'active' : ''}`}
                onClick={() => setSelectedOwner(o.value)}
              >
                <span>👤 {o.label}</span>
                {isMe && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isTabActive ? 'rgba(255,255,255,0.35)' : 'var(--accent)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    আপনি
                  </span>
                )}
                <span
                  style={{
                    marginLeft: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    background: isTabActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {tabCounts[o.value] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls Bar: Search & Priority Filter & Price Summary */}
        <div className="books-controls-bar" style={{ marginBottom: '20px' }}>
          <div className="books-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="বইয়ের নাম, লেখক, প্রকাশক বা নোট খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '135px', height: '38px', padding: '0 12px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">সব অগ্রাধিকার</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} অগ্রাধিকার
              </option>
            ))}
          </select>

          {totalEstimatedPrice > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <span>💰 আনুমানিক মোট:</span>
              <span style={{ color: 'var(--accent)' }}>৳{totalEstimatedPrice.toLocaleString('bn-BD')}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-inline">
            <div className="spinner" />
          </div>
        ) : filteredPending.length === 0 && filteredPurchased.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h3>
              {selectedOwner !== 'all'
                ? `${getOwnerLabel(selectedOwner)}${selectedOwner === user?.id ? ' (আপনার)' : ''}-এর কোনো উইশলিস্ট নেই`
                : 'কোনো উইশলিস্ট নেই'}
            </h3>
            <p>পছন্দের বই সংগ্রহে যোগ করতে নতুন উইশলিস্ট এন্ট্রি তৈরি করুন</p>
            <button type="button" className="btn btn-primary" onClick={openAdd} style={{ marginTop: '12px' }}>
              ➕ নতুন উইশলিস্ট যোগ করুন
            </button>
          </div>
        ) : (
          <>
            {/* PENDING WISHLIST TABLE */}
            {filteredPending.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border)',
                  marginBottom: '28px',
                  color: 'var(--text-muted)',
                }}
              >
                🛒 এই ফিল্টারে কেনার অপেক্ষায় কোনো বই নেই
              </div>
            ) : (
              <div className="table-container" style={{ marginBottom: '32px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>বইয়ের নাম</th>
                      <th>লেখক / প্রকাশক</th>
                      <th>কার জন্য (মালিক)</th>
                      <th>আনুমানিক দাম</th>
                      <th>অগ্রাধিকার</th>
                      <th>উৎস</th>
                      <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPending.map((item) => {
                      const prioConfig = PRIORITIES.find((p) => p.value === item.priority) || PRIORITIES[2];
                      const isMyItem = item.requested_by === user?.id;

                      return (
                        <tr key={item.id}>
                          <td>
                            <div 
                              style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.95rem', cursor: 'pointer' }}
                              onClick={() => setDetailsItem(item)}
                              onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {item.title}
                            </div>
                            {item.notes && (
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '2px',
                                  maxWidth: '280px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={item.notes}
                              >
                                📝 {item.notes}
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {item.author_name || '—'}
                            </div>
                            {item.publisher_name && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                🏢 {item.publisher_name}
                              </div>
                            )}
                          </td>

                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: isMyItem ? 'rgba(79, 161, 115, 0.15)' : 'var(--bg-secondary)',
                                color: isMyItem ? 'var(--accent)' : 'var(--text-secondary)',
                                border: `1px solid ${isMyItem ? 'var(--accent)' : 'var(--border-light)'}`,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '999px',
                              }}
                            >
                              <span>👤</span>
                              <span>{getOwnerLabel(item.requested_by)}</span>
                              {isMyItem && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    fontWeight: 700,
                                  }}
                                >
                                  আপনি
                                </span>
                              )}
                            </span>
                          </td>

                          <td style={{ fontWeight: 600, color: item.estimated_price ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {item.estimated_price ? `৳${item.estimated_price.toLocaleString('bn-BD')}` : '—'}
                          </td>

                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: `${prioConfig.color}15`,
                                color: prioConfig.color,
                                border: `1px solid ${prioConfig.color}35`,
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: prioConfig.color,
                                }}
                              />
                              {prioConfig.label}
                            </span>
                          </td>

                          <td style={{ fontSize: '0.85rem', color: item.source ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                            {item.source || '—'}
                          </td>

                          <td>
                            <div className="actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                              {/* Purchase button only allowed for the user who added it */}
                              {isMyItem && (
                                <button
                                  className="btn btn-sm btn-gold"
                                  onClick={() => handlePurchased(item)}
                                  disabled={purchasingId === item.id}
                                  title="বইটি কেনা হয়েছে হিসেবে মার্ক করুন এবং আপনার লাইব্রেরিতে যুক্ত করুন"
                                  style={{ whiteSpace: 'nowrap' }}
                                >
                                  {purchasingId === item.id ? '...' : '🛒 কেনা হয়েছে'}
                                </button>
                              )}

                              {/* Edit only allowed for the user who added it */}
                              {isMyItem ? (
                                <button
                                  className="btn btn-ghost btn-icon btn-sm"
                                  onClick={() => openEdit(item)}
                                  title="সম্পাদনা করুন"
                                >
                                  ✏️
                                </button>
                              ) : (
                                <button
                                  className="btn btn-ghost btn-icon btn-sm"
                                  style={{ opacity: 0.3, cursor: 'not-allowed' }}
                                  onClick={() =>
                                    toast.error(
                                      `এই উইশলিস্টটি ${getOwnerLabel(item.requested_by)}-এর। শুধুমাত্র উনি এটি সম্পাদনা করতে পারবেন!`
                                    )
                                  }
                                  title={`শুধুমাত্র ${getOwnerLabel(item.requested_by)} সম্পাদনা করতে পারবেন`}
                                >
                                  🔒
                                </button>
                              )}

                              {/* Delete only allowed for the user who added it */}
                              {isMyItem && (
                                <button
                                  className="btn btn-ghost btn-icon btn-sm"
                                  onClick={() => setDeleteId(item.id)}
                                  title="মুছে ফেলুন"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PURCHASED ITEMS TABLE */}
            {filteredPurchased.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h3
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  <span>✅ কেনা সম্পন্ন হয়েছে ({filteredPurchased.length})</span>
                </h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>বইয়ের নাম</th>
                        <th>লেখক</th>
                        <th>কার উইশলিস্ট ছিল</th>
                        <th>কেনার তারিখ</th>
                        <th>আনুমানিক দাম</th>
                        <th style={{ textAlign: 'right' }}>অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchased.map((item) => (
                        <tr key={item.id} style={{ opacity: 0.75 }}>
                          <td style={{ fontWeight: 600 }}>
                            <span 
                              style={{ cursor: 'pointer', color: 'var(--accent)' }}
                              onClick={() => setDetailsItem(item)}
                              onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {item.title}
                            </span>
                          </td>
                          <td>{item.author_name || '—'}</td>
                          <td>
                            <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              👤 {getOwnerLabel(item.requested_by)}
                              {item.requested_by === user?.id && ' (আপনি)'}
                            </span>
                          </td>
                          <td>{item.purchased_date || '—'}</td>
                          <td>{item.estimated_price ? `৳${item.estimated_price.toLocaleString('bn-BD')}` : '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {item.purchased_book_id ? (
                              <Link
                                href={`/dashboard/books/${item.purchased_book_id}`}
                                className="btn btn-sm btn-ghost"
                                style={{ fontSize: '0.8rem', color: 'var(--accent)' }}
                              >
                                📚 বই দেখুন
                              </Link>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                                কেনা শেষ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: '580px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingId ? '✏️ উইশলিস্ট সম্পাদনা' : '🛒 নতুন উইশলিস্ট যোগ'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* LOCKED USER IDENTITY DISPLAY */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.3rem' }}>👤</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        কার উইশলিস্ট:{' '}
                        {editingItem ? getOwnerLabel(editingItem.requested_by) : user?.name || getOwnerLabel(user?.id)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {editingItem
                          ? 'উইশলিস্টের মূল অনুরোধকারী অ্যাকাউন্ট'
                          : `লগইনকৃত অ্যাকাউন্ট: ${user?.id || 'swapnil'} (আপনার নামেই যুক্ত হবে)`}
                      </div>
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: 'var(--pastel-forest-grad)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔒 স্বয়ংক্রিয়
                  </span>
                </div>

                {/* Book Title */}
                <div className="form-group">
                  <label className="form-label">বইয়ের নাম *</label>
                  <input
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="বইয়ের নাম লিখুন..."
                    required
                    autoFocus
                  />
                </div>

                {/* Author and Publisher with DataLists */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">লেখক</label>
                    <input
                      className="form-input"
                      list="wishlist-authors-list"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="লেখকের নাম..."
                    />
                    <datalist id="wishlist-authors-list">
                      {authorsList.map((a) => (
                        <option key={a.id} value={a.name_bn || a.name}>
                          {a.name_bn && a.name && a.name_bn !== a.name ? `${a.name_bn} (${a.name})` : a.name_bn || a.name}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">প্রকাশক</label>
                    <input
                      className="form-input"
                      list="wishlist-publishers-list"
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      placeholder="প্রকাশকের নাম..."
                    />
                    <datalist id="wishlist-publishers-list">
                      {publishersList.map((p) => (
                        <option key={p.id} value={p.name_bn || p.name}>
                          {p.name_bn && p.name && p.name_bn !== p.name ? `${p.name_bn} (${p.name})` : p.name_bn || p.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Estimated Price, Priority, ISBN */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">আনুমানিক দাম (৳)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="যেমন: ৩৫০"
                      value={estimatedPrice}
                      onChange={(e) => setEstimatedPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">অগ্রাধিকার</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">আইএসবিএন (ঐচ্ছিক)</label>
                    <input
                      className="form-input"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="ISBN..."
                    />
                  </div>
                </div>

                {/* Source */}
                <div className="form-group">
                  <label className="form-label">কোথা থেকে কিনবো / প্রাপ্তিস্থান</label>
                  <input
                    className="form-input"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="যেমন: রকমারি, বাতিঘর, বুক ক্যাফে, মেলা ইত্যাদি..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">কভার ছবির URL (ঐচ্ছিক)</label>
                  <input
                    className="form-input"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">নোট / বিশেষ মন্তব্য</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="বইটি সম্পর্কে কোনো বিশেষ তথ্য বা অনুবাদক/সংস্করণ..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? '✅ আপডেট করুন' : '➕ উইশলিস্টে যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>উইশলিস্ট থেকে মুছে ফেলবেন?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              এই এন্ট্রিটি উইশলিস্ট থেকে চিরতরে মুছে যাবে।
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                বাতিল
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                🗑️ মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsItem && (
        <div className="modal-overlay" onClick={() => setDetailsItem(null)}>
          <div
            className="modal"
            style={{ maxWidth: '500px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📖 বইয়ের বিস্তারিত</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetailsItem(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                {detailsItem.cover_url && (
                  <div style={{ width: '120px', flexShrink: 0 }}>
                    <img src={detailsItem.cover_url} alt={detailsItem.title} style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{detailsItem.title}</h2>
                  {detailsItem.author_name && <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}><strong>লেখক:</strong> {detailsItem.author_name}</p>}
                  {detailsItem.publisher_name && <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}><strong>প্রকাশক:</strong> {detailsItem.publisher_name}</p>}
                  {detailsItem.isbn && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>ISBN: {detailsItem.isbn}</p>}
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      👤 {getOwnerLabel(detailsItem.requested_by)}
                    </span>
                    {detailsItem.priority && (
                      <span className="badge" style={{ background: `${PRIORITIES.find(p => p.value === detailsItem.priority)?.color || '#999'}15`, color: PRIORITIES.find(p => p.value === detailsItem.priority)?.color || '#999' }}>
                        {PRIORITIES.find(p => p.value === detailsItem.priority)?.label} অগ্রাধিকার
                      </span>
                    )}
                  </div>
                  
                  {detailsItem.estimated_price && (
                    <p style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '8px' }}>
                      আনুমানিক দাম: ৳{detailsItem.estimated_price.toLocaleString('bn-BD')}
                    </p>
                  )}
                </div>
              </div>

              {detailsItem.source && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>প্রাপ্তিস্থান:</strong>
                  {detailsItem.source}
                </div>
              )}

              {detailsItem.notes && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>নোট:</strong>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{detailsItem.notes}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!detailsItem.is_purchased && user?.id === detailsItem.requested_by && (
                <button 
                  className="btn btn-gold" 
                  onClick={() => {
                    setDetailsItem(null);
                    handlePurchased(detailsItem);
                  }}
                >
                  🛒 কেনা হয়েছে
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setDetailsItem(null)}>
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
