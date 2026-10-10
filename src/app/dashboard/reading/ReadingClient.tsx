'use client';

import { useState } from 'react';
import { Book, BOOK_STATUSES, getOwnerLabel, READING_STATUSES, ReadingStatus } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CustomSelect } from '@/components/CustomSelect';
import { updateBookStatus, updateBookProgress, addActivity, removeFromReadingList } from './actions';

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
  const [selectedFinishedBook, setSelectedFinishedBook] = useState<any>(null);
  const [selectedReadingBook, setSelectedReadingBook] = useState<any>(null);
  const [bookToDelete, setBookToDelete] = useState<any>(null);

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
      await updateBookStatus(book.id, 'পড়া শেষ', 100, undefined, today);
      if (userId) {
        await addActivity(userId, 'book_finished', 'book', book.id, book.title);
      }
      toast.success(`"${book.title}" পড়া শেষ! 🎉`);
      
      // Optmistic UI update
      setCurrentlyReading(prev => prev.filter(b => b.id !== book.id));
      setRecentlyFinished(prev => [{ ...book, readingStatus: 'পড়া শেষ', readingProgress: 100, readingFinishDate: today }, ...prev].slice(0, 20));
    } catch (e) {
      toast.error('Failed to finish book');
    }
  };

  const startReading = async (book: any) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateBookStatus(book.id, 'পড়ছি', 0, today, undefined);
      toast.success('পড়া শুরু হয়েছে! 📖');
      
      // Optmistic UI update
      setRecentlyFinished(prev => prev.filter(b => b.id !== book.id));
      setCurrentlyReading(prev => [{ ...book, readingStatus: 'পড়ছি', readingProgress: 0, readingStartDate: today }, ...prev]);
    } catch (e) {
      toast.error('Failed to start book');
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📖 পড়ছি ({currentlyReading.length})</h2>
        <Link href="/dashboard/books" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
          📚 সংগ্রহ থেকে বই খুঁজুন
        </Link>
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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>বই</th>
                  <th>লেখক</th>
                  <th>পড়া শুরু</th>
                  <th>অগ্রগতি</th>
                </tr>
              </thead>
              <tbody>
                {currentlyReading.map((book) => (
                  <tr 
                    key={book.id} 
                    onClick={() => setSelectedReadingBook(book)}
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Link 
                          href={`/dashboard/books/${book.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}
                          className="hover-underline"
                        >
                          {book.title}
                        </Link>
                        <div className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{getOwnerLabel(book.owner)}</div>
                      </div>
                    </td>
                    <td>{book.authorNameBn || book.authorName || '—'}</td>
                    <td>{book.readingStartDate || '—'}</td>
                    <td style={{ minWidth: '120px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{book.readingProgress || 0}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent)', width: `${book.readingProgress || 0}%`, transition: 'width 0.3s' }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                </tr>
              </thead>
              <tbody>
                {recentlyFinished.map((book) => (
                  <tr 
                    key={book.id} 
                    onClick={() => setSelectedFinishedBook(book)}
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Link 
                          href={`/dashboard/books/${book.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}
                          className="hover-underline"
                        >
                          {book.title}
                        </Link>
                        <div className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{getOwnerLabel(book.owner)}</div>
                      </div>
                    </td>
                    <td>{book.authorNameBn || book.authorName || '—'}</td>
                    <td>{book.readingFinishDate || '—'}</td>
                    <td>{book.rating ? `⭐ ${book.rating}` : '—'}</td>
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

      {selectedFinishedBook && (
        <div className="modal-overlay" onClick={() => setSelectedFinishedBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '92%' }}>
            <div className="modal-header">
              <h3>{selectedFinishedBook.title}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-danger btn-icon" 
                  style={{ padding: '4px' }}
                  onClick={() => {
                    setBookToDelete(selectedFinishedBook);
                  }}
                  title="তালিকা থেকে মুছুন"
                >
                  🗑️
                </button>
                <Link 
                  href={`/dashboard/books/${selectedFinishedBook.id}/edit`}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px' }}
                  title="বিস্তারিত সম্পাদনা"
                >
                  ✏️
                </Link>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedFinishedBook(null)}>
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>পড়ার অবস্থা</label>
                <CustomSelect
                  options={READING_STATUSES.filter(rs => ['পড়ছি', 'পড়া শেষ'].includes(rs.value)).map(rs => ({ value: rs.value, label: `${rs.icon} ${rs.label}` }))}
                  value={selectedFinishedBook.readingStatus || ''}
                  onChange={async (val) => {
                    try {
                      if (val === 'পড়ছি') {
                        startReading(selectedFinishedBook);
                        setSelectedFinishedBook(null);
                      } else {
                        await updateBookStatus(selectedFinishedBook.id, val);
                        setSelectedFinishedBook((prev: any) => prev ? ({ ...prev, readingStatus: val }) : null);
                        toast.success('অবস্থা আপডেট হয়েছে');
                        setRecentlyFinished(prev => prev.map(b => b.id === selectedFinishedBook.id ? { ...b, readingStatus: val } : b));
                      }
                    } catch (e) {
                      toast.error('আপডেট করতে সমস্যা হয়েছে');
                    }
                  }}
                />
              </div>

              {/* Footer removed since edit is now in header */}
            </div>
          </div>
        </div>
      )}

      {selectedReadingBook && (
        <div className="modal-overlay" onClick={() => setSelectedReadingBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '92%' }}>
            <div className="modal-header">
              <h3>{selectedReadingBook.title}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-danger btn-icon" 
                  style={{ padding: '4px' }}
                  onClick={() => {
                    setBookToDelete(selectedReadingBook);
                  }}
                  title="তালিকা থেকে মুছুন"
                >
                  🗑️
                </button>
                <Link 
                  href={`/dashboard/books/${selectedReadingBook.id}/edit`}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px' }}
                  title="বিস্তারিত সম্পাদনা"
                >
                  ✏️
                </Link>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedReadingBook(null)}>
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>পড়ার অবস্থা</label>
                  <CustomSelect
                    options={READING_STATUSES.filter(rs => ['পড়ছি', 'পড়া শেষ'].includes(rs.value)).map(rs => ({ value: rs.value, label: `${rs.icon} ${rs.label}` }))}
                    value={selectedReadingBook.readingStatus || ''}
                    onChange={async (val) => {
                      try {
                        if (val === 'পড়া শেষ') {
                          finishReading(selectedReadingBook);
                          setSelectedReadingBook(null);
                        } else {
                          await updateBookStatus(selectedReadingBook.id, val);
                          setSelectedReadingBook((prev: any) => prev ? ({ ...prev, readingStatus: val }) : null);
                          setCurrentlyReading(prev => prev.map(b => b.id === selectedReadingBook.id ? { ...b, readingStatus: val } : b));
                          toast.success('অবস্থা আপডেট হয়েছে');
                        }
                      } catch (e) {
                        toast.error('আপডেট করতে সমস্যা হয়েছে');
                      }
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>বর্তমান অগ্রগতি</span>
                  <span style={{ fontWeight: 600 }}>{selectedReadingBook.readingProgress || 0}%</span>
                </div>
                <div style={{ height: '10px', background: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${selectedReadingBook.readingProgress || 0}%`, transition: 'width 0.3s' }}></div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[25, 50, 75, 100].map(p => (
                    <button 
                      key={p} 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1, padding: '8px 0', fontSize: '0.85rem' }}
                      onClick={() => {
                        if (p === 100) {
                          finishReading(selectedReadingBook);
                          setSelectedReadingBook(null);
                        } else {
                          updateProgress(selectedReadingBook.id, p);
                          setSelectedReadingBook((prev: any) => prev ? ({ ...prev, readingProgress: p }) : null);
                        }
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer removed since edit is now in header */}
            </div>
          </div>
        </div>
      )}

      {bookToDelete && (
        <div className="modal-overlay" onClick={() => setBookToDelete(null)} style={{ zIndex: 9999 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px', width: '90%', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗑️</div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>আপনি কি নিশ্চিত?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>"{bookToDelete.title}"</strong><br/>
              বইটিকে তালিকা থেকে মুছে ফেলতে চান?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }} 
                onClick={() => setBookToDelete(null)}
              >
                বাতিল
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1, justifyContent: 'center' }} 
                onClick={async () => {
                  try {
                    await removeFromReadingList(bookToDelete.id);
                    setCurrentlyReading(prev => prev.filter(b => b.id !== bookToDelete.id));
                    setRecentlyFinished(prev => prev.filter(b => b.id !== bookToDelete.id));
                    setBookToDelete(null);
                    setSelectedFinishedBook(null);
                    setSelectedReadingBook(null);
                    toast.success('তালিকা থেকে মুছে ফেলা হয়েছে');
                  } catch (e) {
                    toast.error('মুছতে সমস্যা হয়েছে');
                  }
                }}
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
