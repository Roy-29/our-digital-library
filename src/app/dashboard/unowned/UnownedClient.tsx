'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BOOK_STATUSES, OWNERS, getOwnerLabel, BookStatus, BookOwner } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BanglaDateInput } from '@/components/BanglaDateInput';

type ViewMode = 'grid' | 'list';

const BOOK_COLORS = [
  '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
  '#C026D3', '#DB2777', '#E11D48', '#EA580C', '#D97706',
  '#65A30D', '#16A34A', '#0D9488', '#0891B2', '#475569',
];

const UNOWNED_CATEGORIES = [
  { value: '', label: 'সবগুলো', icon: '🔖' },
  { value: 'পড়া শেষ (কাছে নেই)', label: 'পড়া শেষ', icon: '📘', desc: 'পড়েছি কিন্তু কাছে নেই' },
  { value: 'কিনবো', label: 'কিনবো', icon: '🛒', desc: 'পড়েছি বা জানি, কিনবো' },
  { value: 'পড়ছি (কাছে নেই)', label: 'এখন পড়ছি', icon: '📖', desc: 'অন্যত্র এখন পড়ছি' },
  { value: 'ধার করে পড়া', label: 'ধার করে পড়া', icon: '🤝', desc: 'বন্ধু/লাইব্রেরি থেকে' },
  { value: 'ই-বুক / পিডিএফ', label: 'ই-বুক / পিডিএফ', icon: '📱', desc: 'ডিজিটাল ভার্সন' },
];

export default function UnownedClient({
  initialBooks,
  categories,
  genres,
  authors,
}: {
  initialBooks: any[];
  categories: any[];
  genres: any[];
  authors: any[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [books, setBooks] = useState(initialBooks);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTitleOriginal, setNewTitleOriginal] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newStatus, setNewStatus] = useState<BookStatus>('পড়া শেষ (কাছে নেই)');
  const [newSource, setNewSource] = useState('');
  const [newReadingStartDate, setNewReadingStartDate] = useState('');
  const [newReadingFinishDate, setNewReadingFinishDate] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [newReview, setNewReview] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newFavoriteQuote, setNewFavoriteQuote] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');

  // Delete Book
  const handleDelete = async () => {
    if (!deleteId) return;
    const targetBook = books.find((b) => b.id === deleteId);
    if (targetBook && user && targetBook.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের এন্ট্রি মুছে ফেলতে পারবেন!');
      setDeleteId(null);
      return;
    }
    const { error } = await supabase.from('books').delete().eq('id', deleteId);
    if (error) {
      toast.error('মুছতে সমস্যা হয়েছে: ' + error.message);
      return;
    }
    toast.success('এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে');
    setBooks(books.filter((b) => b.id !== deleteId));
    setDeleteId(null);
  };

  // Mark currently reading as finished
  const handleMarkFinished = async (book: any) => {
    if (user && book.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের এন্ট্রি পরিবর্তন করতে পারবেন!');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('books')
      .update({
        status: 'পড়া শেষ (কাছে নেই)',
        reading_finish_date: today,
        reading_progress: 100,
      })
      .eq('id', book.id);

    if (error) {
      toast.error('আপডেট করতে সমস্যা: ' + error.message);
      return;
    }

    toast.success(`"${book.title}" পড়া শেষ হিসেবে মার্ক করা হয়েছে! 🎉`);
    setBooks(
      books.map((b) =>
        b.id === book.id
          ? {
              ...b,
              status: 'পড়া শেষ (কাছে নেই)',
              readingFinishDate: today,
            }
          : b
      )
    );
  };

  // Convert to physical collection (Bought)
  const handleAddToCollection = async (book: any) => {
    if (user && book.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের বই সংগ্রহে যুক্ত করতে পারবেন!');
      return;
    }
    const confirmMove = window.confirm(
      `আপনি কি "${book.title}" বইটি কিনে সংগ্রহে যোগ করতে চান? এটি মূল বই তালিকায় যুক্ত হবে।`
    );
    if (!confirmMove) return;

    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('books')
      .update({
        status: 'আছে',
        is_purchased: true,
        purchase_date: today,
      })
      .eq('id', book.id);

    if (error) {
      toast.error('সংগ্রহে যুক্ত করতে সমস্যা: ' + error.message);
      return;
    }

    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'book_purchased_from_unowned',
      entity_type: 'book',
      entity_id: book.id,
      entity_name: book.title,
    });

    toast.success('অভিনন্দন! বইটি আপনার মূল লাইব্রেরি সংগ্রহে যুক্ত হয়েছে 📚');
    setBooks(books.filter((b) => b.id !== book.id));
  };

  // Add New Entry
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('বইয়ের নাম লিখুন');
      return;
    }

    setSaving(true);

    const resolveAuthor = async (name: string) => {
      if (!name) return null;
      const t = name.trim();
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = authors.find((a) => (a.nameBn && a.nameBn.trim().toLowerCase() === lower) || (a.name && a.name.trim().toLowerCase() === lower) || (a.name_bn && a.name_bn.trim().toLowerCase() === lower));
      if (existing) return existing.id;
      const { data } = await supabase
        .from('authors')
        .insert({ name_bn: t, name: t })
        .select()
        .single();
      if (data?.id) return data.id;
      const { data: all } = await supabase.from('authors').select('*');
      const found = (all as any[])?.find(a => (a.name_bn && a.name_bn.trim().toLowerCase() === lower) || (a.name && a.name.trim().toLowerCase() === lower) || (a.nameBn && a.nameBn.trim().toLowerCase() === lower));
      return found?.id || null;
    };

    const finalAuthorId = await resolveAuthor(newAuthor);

    const payload = {
      title: newTitle.trim(),
      title_original: newTitleOriginal.trim() || null,
      status: 'নাই',
      reading_status: newStatus,
      owner: (user?.id as BookOwner) || 'swapnil',
      is_purchased: false,
      purchase_source: newSource.trim() || null,
      reading_start_date: newReadingStartDate || null,
      reading_finish_date: newReadingFinishDate || null,
      reading_progress: newStatus === 'পড়া শেষ (কাছে নেই)' ? 100 : 0,
      rating: newRating || null,
      review: newReview.trim() || null,
      notes: newNotes.trim() || null,
      favorite_quote: newFavoriteQuote.trim() || null,
      cover_url: newCoverUrl.trim() || null,
      author_id: finalAuthorId || null,
      added_by: user?.id || null,
    };

    const { data, error } = await supabase
      .from('books')
      .insert(payload)
      .select()
      .single();

    if (error) {
      toast.error('এন্ট্রি যোগ করতে ব্যর্থ: ' + error.message);
    } else {
      toast.success('সফলভাবে যোগ হয়েছে! 🔖');
      setBooks([
        {
          id: data.id,
          title: payload.title,
          titleOriginal: payload.title_original,
          status: payload.status,
          readingStatus: payload.reading_status,
          owner: payload.owner,
          isPurchased: false,
          purchaseSource: payload.purchase_source,
          readingStartDate: payload.reading_start_date,
          readingFinishDate: payload.reading_finish_date,
          rating: payload.rating,
          review: payload.review,
          notes: payload.notes,
          favoriteQuote: payload.favorite_quote,
          coverUrl: payload.cover_url,
          authorName: newAuthor,
          authorNameBn: newAuthor,
          createdAt: new Date().toISOString(),
        },
        ...books,
      ]);

      // Reset
      setNewTitle('');
      setNewTitleOriginal('');
      setNewAuthor('');
      setNewPublisher('');
      setNewStatus('পড়া শেষ (কাছে নেই)');
      setNewSource('');
      setNewReadingStartDate('');
      setNewReadingFinishDate('');
      setNewRating(0);
      setNewReview('');
      setNewNotes('');
      setNewFavoriteQuote('');
      setNewCoverUrl('');
      setShowAddModal(false);
    }
    setSaving(false);
  };

  // Filters
  const filteredBooks = books.filter((book) => {
    if (filterOwner && book.owner !== filterOwner) return false;
    if (filterStatus && book.status !== filterStatus && book.readingStatus !== filterStatus) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      book.title?.toLowerCase().includes(q) ||
      book.titleOriginal?.toLowerCase().includes(q) ||
      book.authorName?.toLowerCase().includes(q) ||
      book.authorNameBn?.toLowerCase().includes(q) ||
      book.purchaseSource?.toLowerCase().includes(q) ||
      book.notes?.toLowerCase().includes(q) ||
      book.review?.toLowerCase().includes(q)
    );
  });

  // Priority sorting: Logged in user's books first ("আগে আসবে")!
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (user?.id) {
      const aIsMine = a.owner === user.id ? 1 : 0;
      const bIsMine = b.owner === user.id ? 1 : 0;
      if (aIsMine !== bIsMine) {
        return bIsMine - aIsMine;
      }
    }
    return 0;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🔖 আমার কাছে নেই ({sortedBooks.length})</h2>
          <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
            পড়া বই, ধার করে পড়া বা পছন্দের বই যা ফিজিক্যাল সংগ্রহে নেই
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              🔲 Grid
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            ➕ নতুন এন্ট্রি যোগ
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Status Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '14px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {UNOWNED_CATEGORIES.map((cat) => {
            const count = cat.value
              ? books.filter((b) => b.status === cat.value || b.readingStatus === cat.value).length
              : books.length;
            const active = filterStatus === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(cat.value)}
                style={{
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  style={{
                    background: active
                      ? 'rgba(255,255,255,0.25)'
                      : 'var(--border-light)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Owner Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '14px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${filterOwner === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterOwner('')}
            style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem' }}
          >
            📚 সবার ({books.length})
          </button>
          {user && (
            <button
              type="button"
              className={`btn btn-sm ${filterOwner === user.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterOwner(filterOwner === user.id ? '' : user.id)}
              style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem' }}
            >
              ⭐ আমার এন্ট্রি ({books.filter((b) => b.owner === user.id).length})
            </button>
          )}
          {OWNERS.filter((o) => o.value !== user?.id).map((o) => {
            const count = books.filter((b) => b.owner === o.value).length;
            return (
              <button
                key={o.value}
                type="button"
                className={`btn btn-sm ${filterOwner === o.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterOwner(filterOwner === o.value ? '' : o.value)}
                style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem' }}
              >
                👤 {o.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: '20px', maxWidth: '100%' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="বইয়ের নাম, লেখক, কোথা থেকে পড়া (উৎস), বা নোট খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {sortedBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h3>কোনো বই পাওয়া যায়নি</h3>
            <p>
              যে বইটি পড়া হয়েছে বা কিনতে চান কিন্তু কাছে নেই, এখানে এন্ট্রি করে সংরক্ষণ করুন।
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
            >
              ➕ নতুন এন্ট্রি যোগ করুন
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="books-grid">
            {sortedBooks.map((book) => {
              const statusConfig = BOOK_STATUSES.find((s) => s.value === book.status);
              const isOwner = user?.id === book.owner;

              return (
                <div key={book.id} className="book-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <Link href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                    <div className="book-card-cover">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} />
                      ) : (
                        <div
                          className="placeholder-cover"
                          style={{
                            background: `linear-gradient(135deg, ${
                              BOOK_COLORS[book.title.length % BOOK_COLORS.length]
                            }, ${
                              BOOK_COLORS[(book.title.length + 4) % BOOK_COLORS.length]
                            })`,
                          }}
                        >
                          <span className="book-emoji">🔖</span>
                          <span className="book-title-placeholder">{book.title}</span>
                        </div>
                      )}
                      <span
                        className="book-card-status"
                        style={{
                          background: statusConfig ? `${statusConfig.color}25` : undefined,
                          color: statusConfig ? statusConfig.color : undefined,
                        }}
                      >
                        {statusConfig?.icon || '🔖'} {book.status}
                      </span>
                    </div>
                  </Link>

                  <div className="book-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Link href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                      <div className="book-card-title">{book.title}</div>
                      <div className="book-card-author">
                        {book.authorNameBn || book.authorName || '—'}
                      </div>
                    </Link>

                    {/* Source & Date info */}
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {book.purchaseSource && (
                        <div>
                          📍 উৎস: <strong style={{ color: 'var(--text-secondary)' }}>{book.purchaseSource}</strong>
                        </div>
                      )}
                      {book.readingFinishDate && (
                        <div>
                          📅 পড়া শেষ: <span>{book.readingFinishDate}</span>
                        </div>
                      )}
                    </div>

                    {book.favoriteQuote && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '6px 8px',
                          background: 'var(--bg-secondary)',
                          borderLeft: '3px solid var(--accent)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.3,
                        }}
                      >
                        &ldquo;{book.favoriteQuote.slice(0, 70)}
                        {book.favoriteQuote.length > 70 ? '...' : ''}&rdquo;
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      <div className="book-card-meta">
                        <span className="book-card-owner">
                          {isOwner ? '⭐ ' : ''}
                          {getOwnerLabel(book.owner)}
                          {isOwner ? ' (আমার)' : ''}
                        </span>
                        {book.rating && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            ⭐ {book.rating}
                          </span>
                        )}
                      </div>

                      {/* Action buttons on card */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-light)',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {isOwner && book.status === 'কিনবো' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAddToCollection(book)}
                              title="কিনেছি! মূল সংগ্রহে যুক্ত করুন"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              🛒 কেনা হয়েছে
                            </button>
                          )}
                          {isOwner && book.status === 'পড়ছি (কাছে নেই)' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleMarkFinished(book)}
                              title="পড়া শেষ মার্ক করুন"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              ✅ পড়া শেষ
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link
                            href={`/dashboard/books/${book.id}`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="দেখুন"
                            style={{ width: '28px', height: '28px', padding: 0 }}
                          >
                            👁️
                          </Link>
                          {isOwner && (
                            <>
                              <Link
                                href={`/dashboard/books/${book.id}/edit`}
                                className="btn btn-ghost btn-icon btn-sm"
                                title="সম্পাদনা"
                                style={{ width: '28px', height: '28px', padding: 0 }}
                              >
                                ✏️
                              </Link>
                              <button
                                type="button"
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => setDeleteId(book.id)}
                                title="মুছুন"
                                style={{ width: '28px', height: '28px', padding: 0 }}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>বই</th>
                  <th className="hide-mobile">লেখক</th>
                  <th>স্ট্যাটাস</th>
                  <th className="hide-mobile">উৎস / বিবরণ</th>
                  <th>এন্ট্রি কার</th>
                  <th className="hide-mobile">রেটিং</th>
                  <th className="table-actions-cell" style={{ textAlign: 'right' }}>
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((book) => {
                  const statusConfig = BOOK_STATUSES.find((s) => s.value === book.status);
                  const isOwner = user?.id === book.owner;

                  return (
                    <tr key={book.id}>
                      <td>
                        <Link
                          href={`/dashboard/books/${book.id}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                          }}
                        >
                          {book.title}
                        </Link>
                        <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                          {(book.authorNameBn || book.authorName) && (
                            <span
                              className="show-mobile-inline"
                              style={{ color: 'var(--text-secondary)', marginRight: '4px' }}
                            >
                              {book.authorNameBn || book.authorName} •
                            </span>
                          )}
                          {book.purchaseSource && <span>উৎস: {book.purchaseSource}</span>}
                        </div>
                      </td>
                      <td className="hide-mobile">{book.authorNameBn || book.authorName || '—'}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: statusConfig ? `${statusConfig.color}20` : undefined,
                            color: statusConfig ? statusConfig.color : undefined,
                          }}
                        >
                          {statusConfig?.icon || '🔖'} {book.status}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {book.purchaseSource ? (
                          <span style={{ fontSize: '0.85rem' }}>{book.purchaseSource}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${isOwner ? 'badge-primary' : 'badge-gray'}`}
                          style={
                            isOwner
                              ? {
                                  background: 'rgba(45, 106, 79, 0.15)',
                                  color: 'var(--primary)',
                                  fontWeight: 600,
                                }
                              : undefined
                          }
                        >
                          {isOwner ? '⭐ ' : ''}
                          {getOwnerLabel(book.owner)}
                          {isOwner ? ' (আমার)' : ''}
                        </span>
                      </td>
                      <td className="hide-mobile">{book.rating ? `⭐ ${book.rating}` : '—'}</td>
                      <td className="table-actions-cell">
                        <div className="actions">
                          {isOwner && book.status === 'কিনবো' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAddToCollection(book)}
                              title="কিনেছি! সংগ্রহে যুক্ত করুন"
                              style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                            >
                              🛒 কেনা হয়েছে
                            </button>
                          )}
                          <Link
                            href={`/dashboard/books/${book.id}`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="দেখুন"
                          >
                            👁️
                          </Link>
                          {isOwner && (
                            <>
                              <Link
                                href={`/dashboard/books/${book.id}/edit`}
                                className="btn btn-ghost btn-icon btn-sm"
                                title="সম্পাদনা"
                              >
                                ✏️
                              </Link>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => setDeleteId(book.id)}
                                title="মুছুন"
                              >
                                🗑️
                              </button>
                            </>
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
      </div>

      {/* Add New Entry Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>🔖 নতুন এন্ট্রি (সংগ্রহে নেই এমন বই)</h3>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">বইয়ের নাম *</label>
                  <input
                    className="form-input"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="বইয়ের নাম লিখুন"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">English / Original Title</label>
                    <input
                      className="form-input"
                      value={newTitleOriginal}
                      onChange={(e) => setNewTitleOriginal(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">লেখক</label>
                    <input
                      className="form-input"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="লেখকের নাম"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">অবস্থা / স্ট্যাটাস *</label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as BookStatus)}
                    >
                      <option value="পড়া শেষ (কাছে নেই)">📘 পড়া শেষ (কাছে নেই)</option>
                      <option value="কিনবো">🛒 কিনবো (পড়েছি/জানি, পরে কিনবো)</option>
                      <option value="পড়ছি (কাছে নেই)">📖 এখন পড়ছি (অন্যের বই বা লাইব্রেরি)</option>
                      <option value="ধার করে পড়া">🤝 ধার করে পড়া (বন্ধু/লাইব্রেরি)</option>
                      <option value="ই-বুক / পিডিএফ">📱 ই-বুক / পিডিএফ</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">উৎস / কোথা থেকে পড়া</label>
                    <input
                      className="form-input"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="যেমন: বিশ্বসাহিত্য কেন্দ্র, বন্ধু, পিডিএফ..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">পড়া শুরু</label>
                    <BanglaDateInput
                      value={newReadingStartDate}
                      onChange={setNewReadingStartDate}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">পড়া শেষ</label>
                    <BanglaDateInput
                      value={newReadingFinishDate}
                      onChange={setNewReadingFinishDate}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">⭐ রেটিং</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(newRating === star ? 0 : star)}
                      >
                        {star <= newRating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">📝 পর্যালোচনা / মতামত</label>
                  <textarea
                    className="form-textarea"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="বইটি কেমন লেগেছে..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">💬 প্রিয় উক্তি</label>
                  <input
                    className="form-input"
                    value={newFavoriteQuote}
                    onChange={(e) => setNewFavoriteQuote(e.target.value)}
                    placeholder="পছন্দের একটি লাইন বা উক্তি..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🖼️ কভার ছবির URL (ঐচ্ছিক)</label>
                  <input
                    className="form-input"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ সংরক্ষণ করছি...' : '🔖 এন্ট্রি সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>এন্ট্রি মুছে ফেলবেন?</h3>
            <p>এই এন্ট্রিটি তালিকা থেকে চিরতরে মুছে যাবে।</p>
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
      )}
    </>
  );
}
