'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { dbGetBookCopies } from '@/app/actions';
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
  const [copies, setCopies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

    const parentIdToSearch = data.parent_book_id || data.id;
    const allCopies = await dbGetBookCopies(parentIdToSearch);

    if (allCopies && allCopies.length > 0) {
      // Convert Drizzle camelCase response to snake_case so the UI code doesn't break
      const snakeCopies = allCopies.map(c => {
        const copy: any = { ...c };
        copy.is_favorite = c.isFavorite;
        copy.is_purchased = c.isPurchased;
        copy.purchase_date = c.purchaseDate;
        copy.purchase_source = c.purchaseSource;
        copy.purchase_price = c.purchasePrice;
        copy.purchase_discount = c.purchaseDiscount;
        copy.purchase_final_price = c.purchaseFinalPrice;
        copy.book_condition = c.bookCondition;
        copy.reading_status = c.readingStatus;
        copy.reading_start_date = c.readingStartDate;
        copy.reading_finish_date = c.readingFinishDate;
        copy.reading_progress = c.readingProgress;
        copy.favorite_quote = c.favoriteQuote;
        return copy;
      });
      setCopies(snakeCopies);
    }

    setBook(data);
    setLoading(false);
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

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-serif)' }} className="font-serif">
            📖 {book.title}
            {(book.copies || 1) > 1 && <span className="badge" style={{ fontSize: '0.8rem', padding: '4px 8px', fontFamily: 'var(--font-serif)' }}>{enToBnNumber((book.copies || 1).toString())} কপি</span>}
          </h2>
        </div>
        <div className="flex gap-2 page-header-actions">
          <Link 
            href="/dashboard/books"
            className="btn btn-secondary"
            title="সব বইয়ের তালিকায় ফিরে যান"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <span>⬅️</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ফিরে যান</span>
          </Link>
        </div>
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
                  <span className="book-title-placeholder font-serif" style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>{book.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3>📋 মূল তথ্য</h3></div>
              <div className="card-body">
                <DetailRow label="বইয়ের নাম" value={<span className="font-serif" style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>{book.title}</span>} />
                <DetailRow label="Original Title" value={book.title_original} />
                <DetailRow label="Subtitle" value={book.subtitle} />
                <DetailRow label="লেখক" value={
                  (book.author?.name_bn || book.author?.name) ? (
                    <Link href={`/dashboard/books?author=${book.author?.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'} title="এই লেখকের সব বই দেখুন">
                      {book.author?.name_bn || book.author?.name}
                    </Link>
                  ) : null
                } />
                <DetailRow label="অনুবাদক" value={book.translator?.name_bn || book.translator?.name} />
                <DetailRow label="আঁকিয়ে" value={book.illustrator?.name_bn || book.illustrator?.name} />
                <DetailRow label="প্রকাশক" value={
                  (book.publisher?.name_bn || book.publisher?.name) ? (
                    <Link href={`/dashboard/books?publisher=${book.publisher?.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'} title="এই প্রকাশকের সব বই দেখুন">
                      {book.publisher?.name_bn || book.publisher?.name}
                    </Link>
                  ) : null
                } />
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
                <DetailRow label="বইয়ের ধরন (প্রিন্ট)" value={book.print_type} />
                <DetailRow label="কপি" value={book.copies ? <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.copies.toString())} কপি</span> : null} />
                <DetailRow label="প্রকাশের বছর" value={book.publication_year ? <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.publication_year.toString())}</span> : null} />
                <DetailRow label="পৃষ্ঠা" value={book.page_count ? <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(book.page_count.toString())}</span> : null} />
                <DetailRow label="ক্যাটাগরি" value={book.category ? `${book.category.icon} ${book.category.name_bn || book.category.name}` : null} />
                <DetailRow label="ধরন" value={book.genre ? `${book.genre.icon} ${book.genre.name_bn || book.genre.name}` : null} />
                {book.description && <DetailRow label="বিবরণ" value={book.description} />}
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 className="font-serif" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)' }}>
                📚 মালিকানা ও বিস্তারিত তথ্য 
                <span className="badge" style={{ fontSize: '1rem', padding: '2px 8px' }}>{enToBnNumber((copies?.length || 1).toString())} টি কপি</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(copies && copies.length > 0 ? copies : [book]).map((c) => {
                  const cStatusConfig = BOOK_STATUSES.find(s => s.value === c.status);
                  
                  return (
                    <div key={c.id} className="card" style={{ 
                      border: c.id === book.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div className="card-header" style={{ background: c.id === book.id ? 'var(--primary-light)' : 'var(--bg-secondary)', padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👤 {getOwnerLabel(c.owner)}
                            {c.owner === user?.id && <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>আমার বই</span>}
                          </h3>
                          <Link href={`/dashboard/books/${c.id}/edit`} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                            ✏️ সম্পাদনা
                          </Link>
                        </div>
                      </div>
                      
                      <div className="card-body" style={{ padding: 0 }}>
                        {/* Status Section */}
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>🔖 স্ট্যাটাস</h4>
                          <DetailRow label="বর্তমান স্ট্যাটাস" value={
                            <span style={{ color: cStatusConfig?.color, fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: `${cStatusConfig?.color}15` }}>
                              {cStatusConfig?.icon} {c.status}
                            </span>
                          } />
                          {c.is_favorite && <DetailRow label="প্রিয় বই" value="⭐ হ্যাঁ" />}
                        </div>

                        {/* Collection Section */}
                        {(c.is_purchased || c.purchase_source || c.purchase_date || c.purchase_price || c.purchase_discount || c.purchase_final_price || (c.book_condition && c.book_condition !== 'unknown')) && (
                          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-subtle)' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>💰 সংগ্রহ ও উৎস</h4>
                            <DetailRow label="সংগ্রহের ধরণ" value={c.is_purchased ? 'কেনা হয়েছে (সংগ্রহে আছে)' : 'পড়ার উৎস'} />
                            <DetailRow label={c.is_purchased ? 'কেনার তারিখ' : 'সংগ্রহের তারিখ'} value={formatDateToDdMmYyyyBn(c.purchase_date)} />
                            <DetailRow label="উৎস" value={c.purchase_source} />
                            <DetailRow label="দাম" value={c.purchase_price ? <span style={{ fontFamily: 'var(--font-serif)' }}>৳{enToBnNumber(c.purchase_price.toString())}</span> : null} />
                            <DetailRow 
                              label="ছাড়" 
                              value={c.purchase_discount ? (
                                <span style={{ fontFamily: 'var(--font-serif)' }}>
                                  ৳{enToBnNumber(c.purchase_discount.toString())}
                                  {c.purchase_price ? ` (${enToBnNumber(Number(((c.purchase_discount / c.purchase_price) * 100).toFixed(1)).toString().replace(/\.0$/, ''))}%)` : ''}
                                </span>
                              ) : null} 
                            />
                            <DetailRow label="চূড়ান্ত দাম" value={c.purchase_final_price ? <span style={{ fontFamily: 'var(--font-serif)' }}>৳{enToBnNumber(c.purchase_final_price.toString())}</span> : null} />
                            {c.book_condition !== 'unknown' && (
                              <DetailRow label="অবস্থা" value={c.book_condition === 'new' ? 'নতুন' : c.book_condition === 'used' ? 'পুরনো' : c.book_condition === 'gift' ? 'উপহার' : c.book_condition} />
                            )}
                          </div>
                        )}

                        {/* Reading Info Section */}
                        {(c.reading_status || c.reading_start_date || c.reading_finish_date || c.reading_progress > 0 || c.rating || c.review || c.notes || c.favorite_quote) && (
                          <div style={{ padding: '16px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>📖 পড়ার তথ্য</h4>
                            {c.reading_status && (
                              <DetailRow 
                                label="পড়ার অবস্থা" 
                                value={
                                  (() => {
                                    const statusObj = READING_STATUSES.find(s => s.value === c.reading_status);
                                    return statusObj ? `${statusObj.icon} ${statusObj.label}` : c.reading_status;
                                  })()
                                } 
                              />
                            )}
                            <DetailRow label="পড়া শুরু" value={formatDateToDdMmYyyyBn(c.reading_start_date)} />
                            <DetailRow label="পড়া শেষ" value={formatDateToDdMmYyyyBn(c.reading_finish_date)} />
                            {c.reading_progress > 0 && (
                              <div style={{ marginBottom: '12px' }}>
                                <span className="text-sm text-muted">অগ্রগতি: <span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(c.reading_progress.toString())}</span>%</span>
                                <div className="progress-bar mt-2">
                                  <div className="progress-bar-fill" style={{ width: `${c.reading_progress}%` }} />
                                </div>
                              </div>
                            )}
                            {c.rating && (
                              <DetailRow label="রেটিং" value={
                                <span style={{ fontFamily: 'var(--font-serif)' }}>
                                  {'⭐'.repeat(Math.floor(c.rating))} ({enToBnNumber(c.rating.toString())}/৫)
                                </span>
                              } />
                            )}
                            {c.review && <DetailRow label="পর্যালোচনা" value={c.review} />}
                            {c.notes && <DetailRow label="নোট" value={c.notes} />}
                            {c.favorite_quote && (
                              <div style={{ marginTop: '12px', padding: '16px', background: 'var(--cream)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--gold)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                                &ldquo;{c.favorite_quote}&rdquo;
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
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
