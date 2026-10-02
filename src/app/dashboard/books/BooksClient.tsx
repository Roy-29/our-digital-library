'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BOOK_STATUSES, OWNERS, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  authors 
}: { 
  initialBooks: any[], 
  categories: any[], 
  genres: any[], 
  authors: any[] 
}) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [books, setBooks] = useState(initialBooks);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  // Priority sorting: Logged in user's books first ("আগে আসবে")!
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (user?.id) {
      const aIsMine = a.owner === user.id ? 1 : 0;
      const bIsMine = b.owner === user.id ? 1 : 0;
      if (aIsMine !== bIsMine) {
        return bIsMine - aIsMine; // Logged-in user's books come first
      }
    }
    return 0; // preserve original order (createdAt desc)
  });

  const clearFilters = () => {
    setSearch('');
    setFilterOwner('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterGenre('');
    setFilterAuthor('');
  };

  const hasFilters = search || filterOwner || filterStatus || filterCategory || filterGenre || filterAuthor;

  return (
    <>
      <div className="page-header">
        <h2>📚 সব বই ({sortedBooks.length})</h2>
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
          <Link href="/dashboard/books/add" className="btn btn-primary">
            ➕ বই যোগ
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Quick Owner Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button"
            className={`btn btn-sm ${filterOwner === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterOwner('')}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem' }}
          >
            📚 সব বই ({books.length})
          </button>
          {user && (
            <button 
              type="button"
              className={`btn btn-sm ${filterOwner === user.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterOwner(filterOwner === user.id ? '' : user.id)}
              style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              ⭐ আমার বই ({books.filter(b => b.owner === user.id).length})
            </button>
          )}
          {OWNERS.filter(o => o.value !== user?.id).map(o => {
            const count = books.filter(b => b.owner === o.value).length;
            return (
              <button
                key={o.value}
                type="button"
                className={`btn btn-sm ${filterOwner === o.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterOwner(filterOwner === o.value ? '' : o.value)}
                style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                👤 {o.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="search-bar" style={{ marginBottom: '12px', maxWidth: '100%' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="বই, লেখক, ISBN, প্রকাশক খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-bar">
          <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
            <option value="">সব মালিক</option>
            {user && (
              <option value={user.id}>⭐ আমার বই ({getOwnerLabel(user.id)})</option>
            )}
            {OWNERS.filter(o => o.value !== user?.id).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">সব স্ট্যাটাস</option>
            {BOOK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">সব ক্যাটাগরি</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.nameBn || c.name}</option>)}
          </select>
          <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
            <option value="">সব ধরন</option>
            {genres.map(g => <option key={g.id} value={g.id}>{g.icon} {g.nameBn || g.name}</option>)}
          </select>
          <select value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)}>
            <option value="">সব লেখক</option>
            {authors.map(a => <option key={a.id} value={a.id}>{a.nameBn || a.name}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              ✕ ফিল্টার মুছুন
            </button>
          )}
        </div>

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
                    <div className="book-card-title">{book.title}</div>
                    <div className="book-card-author">{book.authorNameBn || book.authorName || ''}</div>
                    <div className="book-card-meta">
                      <span className="book-card-owner">
                        {book.owner === user?.id ? '⭐ ' : ''}{getOwnerLabel(book.owner)}{book.owner === user?.id ? ' (আমার)' : ''}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {book.rating && <span style={{ fontSize: '0.75rem' }}>⭐ {book.rating}</span>}
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
                  <th>বই</th>
                  <th className="hide-mobile">লেখক</th>
                  <th className="hide-mobile">প্রকাশক</th>
                  <th>মালিক</th>
                  <th>স্ট্যাটাস</th>
                  <th className="hide-mobile">রেটিং</th>
                  <th className="table-actions-cell" style={{ textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <Link href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {book.title}
                      </Link>
                      <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                        {(book.authorNameBn || book.authorName) && (
                          <span className="show-mobile-inline" style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>
                            {book.authorNameBn || book.authorName} •
                          </span>
                        )}
                        {book.isbn}
                      </div>
                    </td>
                    <td className="hide-mobile">{book.authorNameBn || book.authorName || '—'}</td>
                    <td className="hide-mobile">{book.publisherNameBn || book.publisherName || '—'}</td>
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
                    <td className="hide-mobile">{book.rating ? `⭐ ${book.rating}` : '—'}</td>
                    <td className="table-actions-cell">
                      <div className="actions">
                        <Link href={`/dashboard/books/${book.id}`} className="btn btn-ghost btn-icon btn-sm" title="দেখুন">👁️</Link>
                        {user?.id === book.owner && (
                          <>
                            <Link href={`/dashboard/books/${book.id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="সম্পাদনা">✏️</Link>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.preventDefault(); setDeleteId(book.id); }} title="মুছুন">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
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
                          <span className="shelf-book-spine">{book.title.slice(0, 20)}</span>
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
