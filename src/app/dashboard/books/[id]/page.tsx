'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Book, BOOK_STATUSES, READING_STATUSES, getOwnerLabel, parseDbDate, formatDateBn, enToBnNumber } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
// @ts-ignore
import * as ISBN from 'isbn3';

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

  const formatDateToDdMmYyyyBn = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      const formatted = `${dd}-${mm}-${yyyy}`;
      return <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(formatted)}</span>;
    }
    return <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(dateStr)}</span>;
  };

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error || !data) {
      toast.error('বই পাওয়া যায়নি');
      router.push('/dashboard/books');
      return;
    }

    // Since our mock client doesn't support PostgREST joins, fetch relations manually
    const [authorRes, translatorRes, illustratorRes, publisherRes, categoryRes, genreRes] = await Promise.all([
      data.author_id ? supabase.from('authors').select('*').eq('id', data.author_id).single() : Promise.resolve({ data: null }),
      data.translator_id ? supabase.from('authors').select('*').eq('id', data.translator_id).single() : Promise.resolve({ data: null }),
      data.illustrator_id ? supabase.from('authors').select('*').eq('id', data.illustrator_id).single() : Promise.resolve({ data: null }),
      data.publisher_id ? supabase.from('publishers').select('*').eq('id', data.publisher_id).single() : Promise.resolve({ data: null }),
      data.category_id ? supabase.from('categories').select('*').eq('id', data.category_id).single() : Promise.resolve({ data: null }),
      data.genre_id ? supabase.from('genres').select('*').eq('id', data.genre_id).single() : Promise.resolve({ data: null }),
    ]);

    data.author = authorRes.data;
    data.translator = translatorRes.data;
    data.illustrator = illustratorRes.data;
    data.publisher = publisherRes.data;
    data.category = categoryRes.data;
    data.genre = genreRes.data;

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
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📖 {book.title}
            {(book.copies || 1) > 1 && <span className="badge" style={{ fontSize: '0.8rem', padding: '4px 8px', fontFamily: 'var(--font-serif)' }}>{enToBnNumber((book.copies || 1).toString())} কপি</span>}
          </h2>
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
                <DetailRow label="Subtitle" value={book.subtitle} />
                <DetailRow label="লেখক" value={book.author?.name_bn || book.author?.name} />
                <DetailRow label="অনুবাদক" value={book.translator?.name_bn || book.translator?.name} />
                <DetailRow label="আঁকিয়ে" value={book.illustrator?.name_bn || book.illustrator?.name} />
                <DetailRow label="প্রকাশক" value={book.publisher?.name_bn || book.publisher?.name} />
                <DetailRow label="ISBN" value={
                  book.isbn ? (() => {
                    const numOnly = book.isbn.replace(/-/g, '');
                    if (numOnly.length === 10 || numOnly.length === 13) {
                      const parsed = ISBN.parse(numOnly);
                      if (parsed) return parsed.isIsbn13 ? parsed.isbn13h : parsed.isbn10h;
                      const audited = ISBN.audit(numOnly);
                      if (audited && audited.clues && audited.clues.length > 0) {
                        const clue = audited.clues.find((c: any) => c.candidate);
                        if (clue && clue.candidate) {
                          const candidateStr = numOnly.length === 13 ? (clue.candidate as any).isbn13h : (clue.candidate as any).isbn10h;
                          if (candidateStr) return candidateStr.slice(0, -1) + numOnly.slice(-1).toUpperCase();
                        }
                      }
                      if (numOnly.length === 13) return numOnly.replace(/^(\d{3})(\d)(\d{4})(\d{4})(\d)$/, '$1-$2-$3-$4-$5');
                      if (numOnly.length === 10) return numOnly.replace(/^(\d)(\d{4})(\d{4})([\dXx])$/, '$1-$2-$3-$4').toUpperCase();
                    }
                    return book.isbn;
                  })() : null
                } />
                <DetailRow label="ভাষা" value={book.language} />
                <DetailRow label="সংস্করণ" value={book.edition} />
                <DetailRow label="কপি" value={book.copies ? <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.copies.toString())} কপি</span> : null} />
                <DetailRow label="প্রকাশের বছর" value={book.publication_year ? <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.publication_year.toString())}</span> : null} />
                <DetailRow label="পৃষ্ঠা" value={book.page_count ? <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.page_count.toString())}</span> : null} />
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

            {(book.is_purchased || book.purchase_source || book.purchase_date || book.purchase_price || book.purchase_discount || book.purchase_final_price || (book.book_condition && book.book_condition !== 'unknown')) && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header"><h3>💰 সংগ্রহ ও উৎস</h3></div>
                <div className="card-body">
                  <DetailRow label="সংগ্রহের ধরণ" value={book.is_purchased ? 'কেনা হয়েছে (সংগ্রহে আছে)' : 'পড়ার উৎস'} />
                  <DetailRow label={book.is_purchased ? 'কেনার তারিখ' : 'সংগ্রহের তারিখ'} value={formatDateToDdMmYyyyBn(book.purchase_date)} />
                  <DetailRow label="উৎস" value={book.purchase_source} />
                  <DetailRow label="দাম" value={book.purchase_price ? <span style={{ fontFamily: 'var(--font-serif)' }}>৳{enToBnNumber(book.purchase_price.toString())}</span> : null} />
                  <DetailRow label="ছাড়" value={book.purchase_discount ? <span style={{ fontFamily: 'var(--font-serif)' }}>৳{enToBnNumber(book.purchase_discount.toString())}</span> : null} />
                  <DetailRow label="চূড়ান্ত দাম" value={book.purchase_final_price ? <span style={{ fontFamily: 'var(--font-serif)' }}>৳{enToBnNumber(book.purchase_final_price.toString())}</span> : null} />
                  {book.book_condition !== 'unknown' && (
                    <DetailRow label="অবস্থা" value={book.book_condition === 'new' ? 'নতুন' : book.book_condition === 'used' ? 'পুরনো' : book.book_condition === 'gift' ? 'উপহার' : book.book_condition} />
                  )}
                </div>
              </div>
            )}

            {(book.reading_status || book.reading_start_date || book.reading_finish_date || book.reading_progress > 0 || book.rating || book.review || book.notes || book.favorite_quote) && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header"><h3>📖 পড়ার তথ্য</h3></div>
                <div className="card-body">
                {book.reading_status && (
                  <DetailRow 
                    label="পড়ার অবস্থা" 
                    value={
                      (() => {
                        const statusObj = READING_STATUSES.find(s => s.value === book.reading_status);
                        return statusObj ? `${statusObj.icon} ${statusObj.label}` : book.reading_status;
                      })()
                    } 
                  />
                )}
                <DetailRow label="পড়া শুরু" value={formatDateToDdMmYyyyBn(book.reading_start_date)} />
                <DetailRow label="পড়া শেষ" value={formatDateToDdMmYyyyBn(book.reading_finish_date)} />
                {book.reading_progress > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span className="text-sm text-muted">অগ্রগতি: <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.reading_progress.toString())}</span>%</span>
                    <div className="progress-bar mt-2">
                      <div className="progress-bar-fill" style={{ width: `${book.reading_progress}%` }} />
                    </div>
                  </div>
                )}
                {book.rating && (
                  <DetailRow label="রেটিং" value={
                    <span style={{ fontFamily: 'var(--font-serif)' }}>
                      {'⭐'.repeat(Math.floor(book.rating))} ({enToBnNumber(book.rating.toString())}/৫)
                    </span>
                  } />
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
            )}

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ minWidth: '140px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--charcoal)', fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}
