'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Book, BOOK_STATUSES, getOwnerLabel, parseDbDate, formatDateBn } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        author:authors!books_author_id_fkey(*),
        translator:authors!books_translator_id_fkey(*),
        publisher:publishers(*),
        category:categories(*),
        genre:genres(*),
        room:rooms(*),
        shelf:shelves(*),
        rack:racks(*)
      `)
      .eq('id', params.id)
      .single();
    
    if (error || !data) {
      toast.error('বই পাওয়া যায়নি');
      router.push('/dashboard/books');
      return;
    }
    setBook(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!book) return;
    if (user && book.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের বই মুছে ফেলতে পারবেন!');
      setShowDelete(false);
      return;
    }
    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) {
      toast.error('মুছতে পারা যায়নি');
    } else {
      toast.success('বই মুছে ফেলা হয়েছে');
      router.push('/dashboard/books');
    }
  };

  const statusConfig = BOOK_STATUSES.find(s => s.value === book?.status);

  if (loading) {
    return (
      <>
        <div className="page-header"><h2>📖 বই</h2></div>
        <div className="page-body"><div className="loading-inline"><div className="spinner" /></div></div>
      </>
    );
  }

  if (!book) return null;

  const isOwner = user?.id === book.owner;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.back()} 
            className="btn btn-secondary"
            title="আগের পেজে ফিরে যান"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>⬅️</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ফিরে যান</span>
          </button>
          <h2 style={{ margin: 0 }}>📖 {book.title}</h2>
        </div>
        {isOwner && (
          <div className="flex gap-2 page-header-actions">
            <Link href={`/dashboard/books/${book.id}/edit`} className="btn btn-primary">✏️ সম্পাদনা</Link>
            <button className="btn btn-danger" onClick={() => setShowDelete(true)}>🗑️ মুছুন</button>
          </div>
        )}
      </div>

      <div className="page-body">
        <div className="book-detail-layout">
          {/* Cover */}
          <div className="book-detail-cover">
            <div style={{
              aspectRatio: '2/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              boxShadow: 'var(--shadow-book)', background: 'var(--parchment)',
            }}>
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="placeholder-cover" style={{
                  height: '100%',
                  background: `linear-gradient(135deg, #1B4332, #2D6A4F)`,
                }}>
                  <span className="book-emoji">📖</span>
                  <span className="book-title-placeholder" style={{ fontSize: '1rem' }}>{book.title}</span>
                </div>
              )}
            </div>
            {/* Status badge */}
            <div style={{
              marginTop: '16px', textAlign: 'center',
              padding: '10px', borderRadius: 'var(--radius-md)',
              background: `${statusConfig?.color}15`, color: statusConfig?.color,
              fontWeight: 600, fontSize: '1rem',
            }}>
              {statusConfig?.icon} {book.status}
            </div>
            {book.is_favorite && (
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '1.2rem' }}>⭐ প্রিয় বই</div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3>📋 মূল তথ্য</h3></div>
              <div className="card-body">
                <DetailRow label="বইয়ের নাম" value={book.title} />
                <DetailRow label="Original Title" value={book.title_original} />
                <DetailRow label="লেখক" value={book.author?.name_bn || book.author?.name} />
                <DetailRow label="অনুবাদক" value={book.translator?.name_bn || book.translator?.name} />
                <DetailRow label="প্রকাশক" value={book.publisher?.name_bn || book.publisher?.name} />
                <DetailRow label="ISBN" value={book.isbn} />
                <DetailRow label="ভাষা" value={book.language} />
                <DetailRow label="সংস্করণ" value={book.edition} />
                <DetailRow label="প্রকাশের বছর" value={book.publication_year?.toString()} />
                <DetailRow label="পৃষ্ঠা" value={book.page_count?.toString()} />
                <DetailRow label="ক্যাটাগরি" value={book.category ? `${book.category.icon} ${book.category.name_bn || book.category.name}` : null} />
                <DetailRow label="ধরন" value={book.genre ? `${book.genre.icon} ${book.genre.name_bn || book.genre.name}` : null} />
                {book.description && <DetailRow label="বিবরণ" value={book.description} />}
              </div>
            </div>

            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3>👤 মালিকানা</h3></div>
              <div className="card-body">
                <DetailRow label="মালিক" value={getOwnerLabel(book.owner)} />
              </div>
            </div>

            {book.is_purchased && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header"><h3>💰 ক্রয় তথ্য</h3></div>
                <div className="card-body">
                  <DetailRow label="কেনার তারিখ" value={book.purchase_date} />
                  <DetailRow label="উৎস" value={book.purchase_source} />
                  <DetailRow label="দাম" value={book.purchase_price ? `৳${book.purchase_price}` : null} />
                  <DetailRow label="ছাড়" value={book.purchase_discount ? `৳${book.purchase_discount}` : null} />
                  <DetailRow label="চূড়ান্ত দাম" value={book.purchase_final_price ? `৳${book.purchase_final_price}` : null} />
                  <DetailRow label="অবস্থা" value={book.book_condition === 'new' ? 'নতুন' : book.book_condition === 'used' ? 'পুরনো' : book.book_condition === 'gift' ? 'উপহার' : book.book_condition} />
                </div>
              </div>
            )}

            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3>📖 পড়ার তথ্য</h3></div>
              <div className="card-body">
                <DetailRow label="পড়া শুরু" value={book.reading_start_date} />
                <DetailRow label="পড়া শেষ" value={book.reading_finish_date} />
                {book.reading_progress > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span className="text-sm text-muted">অগ্রগতি: {book.reading_progress}%</span>
                    <div className="progress-bar mt-2">
                      <div className="progress-bar-fill" style={{ width: `${book.reading_progress}%` }} />
                    </div>
                  </div>
                )}
                {book.rating && (
                  <DetailRow label="রেটিং" value={`${'⭐'.repeat(Math.floor(book.rating))} (${book.rating}/5)`} />
                )}
                {book.review && <DetailRow label="পর্যালোচনা" value={book.review} />}
                {book.notes && <DetailRow label="নোট" value={book.notes} />}
                {book.favorite_quote && (
                  <div style={{ marginTop: '12px', padding: '16px', background: 'var(--cream)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--gold)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                    &ldquo;{book.favorite_quote}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {(() => {
              const createdDate = parseDbDate(book.created_at);
              const updatedDate = parseDbDate(book.updated_at);
              const isUpdated =
                createdDate &&
                updatedDate &&
                Math.abs(updatedDate.getTime() - createdDate.getTime()) > 60000;

              return (
                <div className="text-sm text-muted" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span>
                    📅 যোগ হয়েছে: {formatDateBn(book.created_at)}
                  </span>
                  {isUpdated && (
                    <span>
                      · ✏️ সর্বশেষ পরিবর্তন: {formatDateBn(book.updated_at)}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {showDelete && (
        <div className="confirm-overlay" onClick={() => setShowDelete(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>বই মুছে ফেলবেন?</h3>
            <p>&quot;{book.title}&quot; চিরতরে মুছে যাবে।</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>বাতিল</button>
              <button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছে ফেলুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ minWidth: '140px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--charcoal)', fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}
