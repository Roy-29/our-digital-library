'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BOOK_STATUSES, OWNERS, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { enToBnNumber } from '@/lib/types';

type ViewMode = 'grid' | 'list' | 'shelf';

const BOOK_COLORS = [
  '#1B4332', '#2D6A4F', '#52796F', '#722F37', '#4A3F35',
  '#8B7355', '#4F46E5', '#7C3AED', '#B45309', '#0891B2',
  '#DC2626', '#065F46', '#1E40AF', '#92400E', '#5B21B6',
];

export default function BooksClient({ 
  initialBooks, 
  categories, 
  genres, 
  authors,
  publishers = [],
  initialStatus = '',
  initialOwner = '',
  initialAuthor = '',
  initialPublisher = ''
}: { 
  initialBooks: any[], 
  categories: any[], 
  genres: any[], 
  authors: any[],
  publishers?: any[],
  initialStatus?: string,
  initialOwner?: string,
  initialAuthor?: string,
  initialPublisher?: string
}) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [books, setBooks] = useState(initialBooks);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState(initialOwner || '');
  const [filterStatus, setFilterStatus] = useState(initialStatus || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterAuthor, setFilterAuthor] = useState(initialAuthor || '');
  const [filterPublisher, setFilterPublisher] = useState(initialPublisher || '');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingAuthor, setViewingAuthor] = useState<any | null>(null);
  const [viewingPublisher, setViewingPublisher] = useState<any | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    const targetBook = books.find(b => b.id === deleteId);
    if (targetBook && user && targetBook.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের বই মুছে ফেলতে পারবেন!');
      setDeleteId(null);
      return;
    }
    const { error } = await supabase.from('books').delete().eq('id', deleteId);
    if (error) {
      toast.error('মুছতে সমস্যা হয়েছে: ' + error.message);
      return;
    }
    toast.success('বই সফলভাবে মুছে ফেলা হয়েছে');
    setBooks(books.filter(b => b.id !== deleteId));
    setDeleteId(null);
  };

  const filteredBooks = books.filter((book) => {
    // Check filters first
    if (filterOwner && book.owner !== filterOwner) return false;
    if (filterStatus && book.status !== filterStatus) return false;
    if (filterCategory && book.categoryId !== filterCategory) return false;
    if (filterGenre && book.genreId !== filterGenre) return false;
    if (filterAuthor && book.authorId !== filterAuthor) return false;
    if (filterPublisher && book.publisherId !== filterPublisher && book.publisherName !== filterPublisher) return false;

    // Check search
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      book.title?.toLowerCase().includes(q) ||
      book.titleOriginal?.toLowerCase().includes(q) ||
      book.isbn?.toLowerCase().includes(q) ||
      book.authorName?.toLowerCase().includes(q) ||
      book.authorNameBn?.toLowerCase().includes(q) ||
      book.publisherName?.toLowerCase().includes(q)
    );
  });

  // Sorting: Default priority sorting (latest added books first, preserving order from page.tsx)
  const sortedBooks = [...filteredBooks];

  const clearFilters = () => {
    setSearch('');
    setFilterOwner('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterGenre('');
    setFilterAuthor('');
    setFilterPublisher('');
  };

  const hasFilters = search || filterOwner || filterStatus || filterCategory || filterGenre || filterAuthor || filterPublisher;

  return (
    <>
      <div className="page-header">
        <h2 className="font-serif">📚 সব বই ({enToBnNumber(sortedBooks.length.toString())})</h2>
        <div className="flex gap-3 items-center">
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              🔲 Grid
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              📋 List
            </button>
            <button className={viewMode === 'shelf' ? 'active' : ''} onClick={() => setViewMode('shelf')}>
              📚 Shelf
            </button>
          </div>
          <Link href="/dashboard/backup" className="btn btn-secondary" title="Excel / CSV থেকে বই ইম্পোর্ট করুন">
            📥 ইম্পোর্ট
          </Link>
          <Link href="/dashboard/books/add" className="btn btn-primary">
            ➕ বই যোগ
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Quick Owner Filter Pills */}
        <div className="owner-pills-bar">
          <button 
            type="button"
            className={`owner-pill ${filterOwner === '' ? 'active' : ''}`}
            onClick={() => setFilterOwner('')}
          >
            <span>📚 সব বই</span>
            <span className="pill-badge">{enToBnNumber(books.length.toString())}</span>
          </button>
          {user && (
            <button 
              type="button"
              className={`owner-pill ${filterOwner === user.id ? 'active' : ''}`}
              onClick={() => setFilterOwner(filterOwner === user.id ? '' : user.id)}
            >
              <span>⭐ আমার বই</span>
              <span className="pill-badge">{enToBnNumber(books.filter(b => b.owner === user.id).length.toString())}</span>
            </button>
          )}
          {OWNERS.filter(o => o.value !== user?.id).map(o => {
            const count = books.filter(b => b.owner === o.value).length;
            return (
              <button
                key={o.value}
                type="button"
                className={`owner-pill ${filterOwner === o.value ? 'active' : ''}`}
                onClick={() => setFilterOwner(filterOwner === o.value ? '' : o.value)}
              >
                <span>👤 {o.label}</span>
                <span className="pill-badge">{enToBnNumber(count.toString())}</span>
              </button>
            );
          })}
        </div>

        {/* Minimal Search & Filter Bar */}
        <div className="books-controls-bar">
          <div className="books-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="বই, লেখক, ISBN, প্রকাশক খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearch('')}
                title="সার্চ মুছুন"
              >
                ✕
              </button>
            )}
          </div>

          <div className="books-filter-group">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`minimal-select ${filterStatus ? 'active-filter' : ''}`}
            >
              <option value="">সব স্ট্যাটাস</option>
              {BOOK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
            </select>

            <select 
              value={filterAuthor} 
              onChange={(e) => setFilterAuthor(e.target.value)}
              className={`minimal-select ${filterAuthor ? 'active-filter' : ''}`}
            >
              <option value="">সব লেখক</option>
              {authors.map(a => <option key={a.id} value={a.id}>{a.nameBn || a.name}</option>)}
            </select>

            <select 
              value={filterPublisher} 
              onChange={(e) => setFilterPublisher(e.target.value)}
              className={`minimal-select ${filterPublisher ? 'active-filter' : ''}`}
            >
              <option value="">সব প্রকাশক</option>
              {publishers.map(p => <option key={p.id} value={p.id}>{p.nameBn || p.name}</option>)}
            </select>

            <Link 
              href="/dashboard/sort" 
              className="btn btn-secondary btn-sm"
              style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              title="উন্নত সর্টিং ও ফিল্টারিং পেজ"
            >
              🔀 সব ফিল্টার ও বাছাই
            </Link>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm filter-reset-btn" onClick={clearFilters} title="ফিল্টার রিসেট করুন">
                ✕ রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filterAuthor || filterPublisher) && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ফিল্টার করা হয়েছে:</span>
            {filterAuthor && (
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '0.8rem', background: 'rgba(79, 161, 115, 0.15)', color: 'var(--accent)' }}>
                ✍🏻 {authors.find(a => a.id === filterAuthor)?.nameBn || authors.find(a => a.id === filterAuthor)?.name || 'লেখক'}
                <button type="button" onClick={() => setFilterAuthor('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }} title="লেখক ফিল্টার মুছুন">✕</button>
              </span>
            )}
            {filterPublisher && (
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '0.8rem', background: 'rgba(79, 161, 115, 0.15)', color: 'var(--accent)' }}>
                🏢 {publishers.find(p => p.id === filterPublisher || p.name === filterPublisher)?.nameBn || publishers.find(p => p.id === filterPublisher || p.name === filterPublisher)?.name || filterPublisher}
                <button type="button" onClick={() => setFilterPublisher('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }} title="প্রকাশক ফিল্টার মুছুন">✕</button>
              </span>
            )}
          </div>
        )}

        {sortedBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>{hasFilters ? 'কোনো বই পাওয়া যায়নি' : 'এখনো কোনো বই নেই'}</h3>
            <p>{hasFilters ? 'ফিল্টার পরিবর্তন করে দেখুন' : 'আপনার সংগ্রহে প্রথম বই যোগ করুন!'}</p>
            {!hasFilters && (
              <Link href="/dashboard/books/add" className="btn btn-primary" style={{ marginTop: '16px' }}>
                ➕ বই যোগ করুন
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="books-grid">
            {sortedBooks.map((book) => (
              <Link key={book.id} href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                <div className="book-card">
                  <div className="book-card-cover">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} />
                    ) : (
                      <div className="placeholder-cover" style={{
                        background: `linear-gradient(135deg, ${BOOK_COLORS[book.title.length % BOOK_COLORS.length]}, ${BOOK_COLORS[(book.title.length + 3) % BOOK_COLORS.length]})`
                      }}>
                        <span className="book-emoji">📖</span>
                        <span className="book-title-placeholder">{book.title}</span>
                      </div>
                    )}
                    <span className="book-card-status">
                      {BOOK_STATUSES.find(s => s.value === book.status)?.icon} {book.status}
                    </span>
                  </div>
                  <div className="book-card-body">
                    <div className="book-card-title font-serif" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-serif)' }}>
                      {book.title}
                      {(book.copies || 1) > 1 && <span className="badge font-serif" style={{ fontSize: '0.65rem', padding: '2px 6px', fontFamily: 'var(--font-serif)' }}>{enToBnNumber((book.copies || 1).toString())} কপি</span>}
                    </div>
                    <div className="book-card-author">
                      {book.authorNameBn || book.authorName ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const authorObj = authors?.find(a => a.id === book.authorId);
                            if (authorObj) setViewingAuthor(authorObj);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'inherit',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title="লেখকের বিস্তারিত দেখুন"
                        >
                          ✍🏻 {book.authorNameBn || book.authorName}
                        </button>
                      ) : ''}
                    </div>
                    <div className="book-card-meta">
                      <span className="book-card-owner">
                        {book.owner === user?.id ? '⭐ ' : ''}{getOwnerLabel(book.owner)}{book.owner === user?.id ? ' (আমার)' : ''}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {book.rating && <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-serif)' }} className="font-serif">⭐ {enToBnNumber(book.rating.toString())}</span>}
                        {user?.id === book.owner && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/dashboard/books/${book.id}/edit`);
                            }}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="সম্পাদনা"
                            style={{ width: '28px', height: '28px', padding: 0 }}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    বই
                  </th>
                  <th className="hide-mobile">
                    লেখক
                  </th>
                  <th className="hide-mobile">
                    প্রকাশক
                  </th>
                  <th>মালিক</th>
                  <th>স্ট্যাটাস</th>
                  <th className="hide-mobile">রেটিং</th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <Link href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-serif)' }} className="font-serif">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} style={{ width: '32px', height: '46px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: '32px', height: '46px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid var(--border)', flexShrink: 0 }}>📚</div>
                        )}
                        <div>
                          {book.title}
                          {(book.copies || 1) > 1 && <span className="badge font-serif" style={{ fontSize: '0.65rem', padding: '2px 6px', fontFamily: 'var(--font-serif)', marginLeft: '6px' }}>{enToBnNumber((book.copies || 1).toString())} কপি</span>}
                        </div>
                      </Link>
                      <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                        {(book.authorNameBn || book.authorName) && (
                          <span className="show-mobile-inline" style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const authorObj = authors?.find(a => a.id === book.authorId);
                                if (authorObj) setViewingAuthor(authorObj);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: 'inherit',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                              title="লেখকের বিস্তারিত দেখুন"
                            >
                              {book.authorNameBn || book.authorName}
                            </button> •
                          </span>
                        )}
                        {book.isbn}
                      </div>
                    </td>
                    <td className="hide-mobile">
                      {book.authorNameBn || book.authorName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {book.authorImageUrl ? (
                            <img src={book.authorImageUrl} alt={book.authorName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✍🏻</div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const authorObj = authors?.find(a => a.id === book.authorId);
                              if (authorObj) setViewingAuthor(authorObj);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: 'inherit',
                              fontWeight: 500,
                              fontSize: 'inherit',
                              fontFamily: 'inherit',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                            title="লেখকের বিস্তারিত দেখুন"
                          >
                            {book.authorNameBn || book.authorName}
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hide-mobile">
                      {book.publisherNameBn || book.publisherName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {book.publisherImageUrl ? (
                            <img src={book.publisherImageUrl} alt={book.publisherName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏢</div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const pubObj = publishers?.find(p => p.id === book.publisherId);
                              if (pubObj) setViewingPublisher(pubObj);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: 'inherit',
                              fontWeight: 500,
                              fontSize: 'inherit',
                              fontFamily: 'inherit',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                            title="প্রকাশকের বিস্তারিত দেখুন"
                          >
                            {book.publisherNameBn || book.publisherName}
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span 
                        className={`badge ${book.owner === user?.id ? 'badge-primary' : 'badge-gray'}`}
                        style={book.owner === user?.id ? { background: 'rgba(45, 106, 79, 0.15)', color: 'var(--primary)', fontWeight: 600 } : undefined}
                      >
                        {book.owner === user?.id ? '⭐ ' : ''}{getOwnerLabel(book.owner)}{book.owner === user?.id ? ' (আমার)' : ''}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: `${BOOK_STATUSES.find(s => s.value === book.status)?.color}20`,
                        color: BOOK_STATUSES.find(s => s.value === book.status)?.color,
                      }}>
                        {BOOK_STATUSES.find(s => s.value === book.status)?.icon} {book.status}
                      </span>
                    </td>
                    <td className="hide-mobile font-serif">{book.rating ? `⭐ ${enToBnNumber(book.rating.toString())}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Shelf View */
          <div className="bookshelf">
            {Array.from({ length: Math.ceil(sortedBooks.length / 20) }, (_, shelfIdx) => (
              <div key={shelfIdx} style={{ marginBottom: '28px' }}>
                <div className="shelf-row">
                  {sortedBooks.slice(shelfIdx * 20, (shelfIdx + 1) * 20).map((book, i) => {
                    const color = BOOK_COLORS[(book.title.length + i) % BOOK_COLORS.length];
                    const height = 130 + (book.title.length % 5) * 10;
                    return (
                      <Link key={book.id} href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                        <div
                          className="shelf-book"
                          style={{ background: color, height: `${height}px`, width: `${24 + (book.pageCount ? Math.min(book.pageCount / 30, 12) : 4)}px` }}
                          title={`${book.title} — ${book.authorName || ''}`}
                        >
                          <span className="shelf-book-spine font-serif" style={{ fontFamily: 'var(--font-serif)' }}>{book.title.slice(0, 20)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Author Details Modal */}
      {viewingAuthor && (
        <div className="modal-overlay" onClick={() => setViewingAuthor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📖 লেখকের বিস্তারিত তথ্য</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewingAuthor(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '16px' }}>
                {viewingAuthor.image_url && (
                  <div style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <img src={viewingAuthor.image_url} alt={viewingAuthor.name_bn || viewingAuthor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="info-group" style={{ flexGrow: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>নাম</label>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{viewingAuthor.name_bn || viewingAuthor.name}</div>
                </div>
              </div>
              {viewingAuthor.bio && (
                <div className="info-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>জীবনী / বিবরণ</label>
                  <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{viewingAuthor.bio}</div>
                </div>
              )}
              <div className="form-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {(viewingAuthor.birth_year || viewingAuthor.death_year) && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>জীবনকাল</label>
                    <div style={{ color: 'var(--text-primary)' }}>
                      {viewingAuthor.birth_year ? enToBnNumber(viewingAuthor.birth_year.toString()) : 'অজানা'} - {viewingAuthor.death_year ? enToBnNumber(viewingAuthor.death_year.toString()) : 'বর্তমান'}
                    </div>
                  </div>
                )}
                {viewingAuthor.nationality && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>জাতীয়তা</label>
                    <div style={{ color: 'var(--text-primary)' }}>{viewingAuthor.nationality}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Link href="/dashboard/authors" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                ✍🏻 লেখকের পেইজে যান
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Publisher Details Modal */}
      {viewingPublisher && (
        <div className="modal-overlay" onClick={() => setViewingPublisher(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📖 প্রকাশকের বিস্তারিত তথ্য</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewingPublisher(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '16px' }}>
                {viewingPublisher.image_url && (
                  <div style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <img src={viewingPublisher.image_url} alt={viewingPublisher.name_bn || viewingPublisher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="info-group" style={{ flexGrow: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>নাম</label>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{viewingPublisher.name_bn || viewingPublisher.name}</div>
                </div>
              </div>
              {viewingPublisher.address && (
                <div className="info-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ঠিকানা</label>
                  <div style={{ color: 'var(--text-primary)' }}>{viewingPublisher.address}</div>
                </div>
              )}
              <div className="form-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {viewingPublisher.website && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ওয়েবসাইট</label>
                    <div><a href={viewingPublisher.website.startsWith('http') ? viewingPublisher.website : `https://${viewingPublisher.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{viewingPublisher.website}</a></div>
                  </div>
                )}
                {viewingPublisher.phone && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ফোন</label>
                    <div style={{ color: 'var(--text-primary)' }}>{viewingPublisher.phone}</div>
                  </div>
                )}
                {viewingPublisher.email && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ইমেইল</label>
                    <div><a href={`mailto:${viewingPublisher.email}`} style={{ color: 'var(--primary)' }}>{viewingPublisher.email}</a></div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Link href="/dashboard/publishers" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                🏢 প্রকাশকের পেইজে যান
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>বই মুছে ফেলবেন?</h3>
            <p>এই বইটি চিরতরে মুছে যাবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছে ফেলুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
