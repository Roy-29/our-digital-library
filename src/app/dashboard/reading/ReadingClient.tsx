'use client';

import { useState } from 'react';
import { Book, BOOK_STATUSES, getOwnerLabel } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { updateBookStatus, updateBookProgress, addActivity } from './actions';

export default function ReadingClient({ 
  initialCurrentlyReading, 
  initialRecentlyFinished,
  userId
}: {
  initialCurrentlyReading: any[];
  initialRecentlyFinished: any[];
  userId: string | undefined;
}) {
  const [currentlyReading, setCurrentlyReading] = useState(initialCurrentlyReading);
  const [recentlyFinished, setRecentlyFinished] = useState(initialRecentlyFinished);

  const updateProgress = async (bookId: string, progress: number) => {
    try {
      await updateBookProgress(bookId, progress);
      setCurrentlyReading(prev => prev.map(b => b.id === bookId ? { ...b, readingProgress: progress } : b));
    } catch (e) {
      toast.error('Progress update failed');
    }
  };

  const finishReading = async (book: any) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateBookStatus(book.id, 'পড়া শেষ', 100, undefined, today);
      if (userId) {
        await addActivity(userId, 'book_finished', 'book', book.id, book.title);
      }
      toast.success(`"${book.title}" পড়া শেষ! 🎉`);
      
      // Optmistic UI update
      setCurrentlyReading(prev => prev.filter(b => b.id !== book.id));
      setRecentlyFinished(prev => [{ ...book, status: 'পড়া শেষ', readingProgress: 100, readingFinishDate: today }, ...prev].slice(0, 20));
    } catch (e) {
      toast.error('Failed to finish book');
    }
  };

  const startReading = async (bookId: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateBookStatus(bookId, 'পড়ছি', 0, today, undefined);
      toast.success('পড়া শুরু হয়েছে! 📖');
      // Optmistic refresh requires full refetch if we want accurate data, but Next.js will revalidate the page.
      window.location.reload();
    } catch (e) {
      toast.error('Failed to start book');
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>📖 পড়ছি ({currentlyReading.length})</h2>
      </div>

      <div className="page-body">
        {currentlyReading.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛋️</div>
            <h3>বর্তমানে কোনো বই পড়ছেন না</h3>
            <p>আপনার সংগ্রহ থেকে একটি বই পড়া শুরু করুন!</p>
            <Link href="/dashboard/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
              📚 বই খুঁজুন
            </Link>
          </div>
        ) : (
          <div className="books-grid">
            {currentlyReading.map((book) => (
              <div key={book.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '80px', height: '120px', background: 'var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="placeholder-cover" style={{ width: '100%', height: '100%', padding: '8px', fontSize: '10px' }}>
                        <span className="book-emoji" style={{ fontSize: '20px' }}>📖</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{book.title}</h3>
                    </Link>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      {book.authorNameBn || book.authorName || 'অজানা লেখক'}
                    </div>
                    <div className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{getOwnerLabel(book.owner)}</div>
                    {book.readingStartDate && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                        শুরু: {book.readingStartDate}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>অগ্রগতি</span>
                    <span style={{ fontWeight: 600 }}>{book.readingProgress || 0}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent)', width: `${book.readingProgress || 0}%`, transition: 'width 0.3s' }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[25, 50, 75, 100].map(p => (
                      <button 
                        key={p} 
                        className="btn btn-ghost btn-sm" 
                        style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem' }}
                        onClick={() => p === 100 ? finishReading(book) : updateProgress(book.id, p)}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: '40px', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>
          ✅ সম্প্রতি পড়া শেষ ({recentlyFinished.length})
        </h3>
        
        {recentlyFinished.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>বই</th>
                  <th>লেখক</th>
                  <th>পড়া শেষ</th>
                  <th>রেটিং</th>
                  <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {recentlyFinished.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <Link href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {book.title}
                      </Link>
                    </td>
                    <td>{book.authorNameBn || book.authorName || '—'}</td>
                    <td>{book.readingFinishDate || '—'}</td>
                    <td>{book.rating ? `⭐ ${book.rating}` : '—'}</td>
                    <td>
                      <div className="actions">
                        <Link href={`/dashboard/books/${book.id}`} className="btn btn-ghost btn-icon btn-sm">👁️</Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => startReading(book.id)}>আবার পড়ুন</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
            এখনো কোনো বই পড়া শেষ হয়নি
          </div>
        )}
      </div>
    </>
  );
}
