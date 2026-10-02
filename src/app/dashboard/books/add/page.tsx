'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Author, Publisher, Category, Genre, Room, Shelf, Rack, BOOK_STATUSES, OWNERS, BookStatus, BookOwner, BookCondition, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AddBookPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  // Reference data
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [titleOriginal, setTitleOriginal] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [language, setLanguage] = useState('বাংলা');
  const [edition, setEdition] = useState('');
  const [pubYear, setPubYear] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [translatorId, setTranslatorId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [genreId, setGenreId] = useState('');
  const [owner, setOwner] = useState<BookOwner>('swapnil');
  const [status, setStatus] = useState<BookStatus>('আছে');
  const [roomId, setRoomId] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [rackId, setRackId] = useState('');
  const [rackRow, setRackRow] = useState('');
  const [rackPosition, setRackPosition] = useState('');
  const [isPurchased, setIsPurchased] = useState(true);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseSource, setPurchaseSource] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDiscount, setPurchaseDiscount] = useState('');
  const [purchaseFinalPrice, setPurchaseFinalPrice] = useState('');
  const [purchasedBy, setPurchasedBy] = useState('');
  const [bookCondition, setBookCondition] = useState<BookCondition>('new');
  const [readingStartDate, setReadingStartDate] = useState('');
  const [readingFinishDate, setReadingFinishDate] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [notes, setNotes] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setOwner(user.id as BookOwner);
      setPurchasedBy(user.id);
    }
  }, [user]);

  useEffect(() => {
    fetchReferenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (roomId) {
      supabase.from('shelves').select('*').eq('room_id', roomId).order('name').then(({ data }: { data: any }) => {
        setShelves(data || []);
        setShelfId('');
        setRackId('');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (shelfId) {
      supabase.from('racks').select('*').eq('shelf_id', shelfId).order('position_order').then(({ data }: { data: any }) => {
        setRacks(data || []);
        setRackId('');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfId]);

  const fetchReferenceData = async () => {
    const [a, p, c, g, r] = await Promise.all([
      supabase.from('authors').select('*').order('name'),
      supabase.from('publishers').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('genres').select('*').order('name'),
      supabase.from('rooms').select('*').order('name'),
    ]);
    if (a.data) setAuthors(a.data);
    if (p.data) setPublishers(p.data);
    if (c.data) setCategories(c.data);
    if (g.data) setGenres(g.data);
    if (r.data) setRooms(r.data);
  };

  const uploadCover = async (): Promise<string | null> => {
    return coverUrl.trim() || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('বইয়ের নাম লিখুন');
      return;
    }

    // Check for duplicate title
    const { data: dupBooks, error: dupError } = await supabase
      .from('books')
      .select('id')
      .eq('title', title.trim());

    if (dupError) {
      toast.error('ডুপ্লিকেট চেক করতে ত্রুটি: ' + dupError.message);
      return;
    }

    if (dupBooks && dupBooks.length > 0) {
      const confirmAdd = window.confirm(
        'এই নামের একটি বই ইতিমধ্যে সংগ্রহে আছে, আপনি কি তবুও আরেকটি কপি যোগ করতে চান?'
      );
      if (!confirmAdd) {
        return;
      }
    }

    setSaving(true);
    
    const resolveAuthor = async (name: string) => {
      if (!name) return null;
      const t = name.trim();
      if (!t) return null;
      const existing = authors.find(a => a.name_bn === t || a.name === t);
      if (existing) return existing.id;
      const { data } = await supabase.from('authors').insert({ name_bn: t, name: t });
      return data?.id || null;
    };
    
    const resolvePublisher = async (name: string) => {
      if (!name) return null;
      const t = name.trim();
      if (!t) return null;
      const existing = publishers.find(p => p.name_bn === t || p.name === t);
      if (existing) return existing.id;
      const { data } = await supabase.from('publishers').insert({ name_bn: t, name: t });
      return data?.id || null;
    };

    const resolveCategory = async (name: string) => {
      if (!name) return null;
      const t = name.trim();
      if (!t) return null;
      const existing = categories.find(c => c.name_bn === t || c.name === t);
      if (existing) return existing.id;
      const { data } = await supabase.from('categories').insert({ name_bn: t, name: t, icon: '🏷️' });
      return data?.id || null;
    };

    const resolveGenre = async (name: string) => {
      if (!name) return null;
      const t = name.trim();
      if (!t) return null;
      const existing = genres.find(g => g.name_bn === t || g.name === t);
      if (existing) return existing.id;
      const { data } = await supabase.from('genres').insert({ name_bn: t, name: t, icon: '📚' });
      return data?.id || null;
    };

    const finalAuthorId = await resolveAuthor(authorId);
    const finalTranslatorId = await resolveAuthor(translatorId);
    const finalPublisherId = await resolvePublisher(publisherId);
    const finalCategoryId = await resolveCategory(categoryId);
    const finalGenreId = await resolveGenre(genreId);
    
    const uploadedCoverUrl = await uploadCover();

    const bookData = {
      title: title.trim(),
      title_original: titleOriginal || null,
      subtitle: subtitle || null,
      isbn: isbn || null,
      language,
      edition: edition || null,
      publication_year: pubYear ? parseInt(pubYear) : null,
      page_count: pageCount ? parseInt(pageCount) : null,
      description: description || null,
      cover_url: uploadedCoverUrl,
      author_id: finalAuthorId || null,
      translator_id: finalTranslatorId || null,
      publisher_id: finalPublisherId || null,
      category_id: finalCategoryId || null,
      genre_id: finalGenreId || null,
      owner: (user?.id as BookOwner) || owner,
      status,
      room_id: roomId || null,
      shelf_id: shelfId || null,
      rack_id: rackId || null,
      rack_row: rackRow ? parseInt(rackRow) : null,
      rack_position: rackPosition ? parseInt(rackPosition) : null,
      is_purchased: isPurchased,
      purchase_date: purchaseDate || null,
      purchase_source: purchaseSource || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_discount: purchaseDiscount ? parseFloat(purchaseDiscount) : null,
      purchase_final_price: purchaseFinalPrice ? parseFloat(purchaseFinalPrice) : null,
      purchased_by: purchasedBy || null,
      book_condition: bookCondition,
      reading_start_date: readingStartDate || null,
      reading_finish_date: readingFinishDate || null,
      reading_progress: readingProgress,
      rating: rating || null,
      review: review || null,
      notes: notes || null,
      favorite_quote: favoriteQuote || null,
      is_favorite: isFavorite,
      added_by: user?.id || null,
    };

    const { data, error } = await supabase.from('books').insert(bookData);
    
    if (error) {
      toast.error('বই যোগ করতে সমস্যা: ' + error.message);
    } else {
      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'book_added',
        entity_type: 'book',
        entity_id: data.id,
        entity_name: title,
        details: { owner, status },
      });
      toast.success('বই সফলভাবে যোগ হয়েছে! 📚');
      router.push(`/dashboard/books/${data.id}`);
    }
    setSaving(false);
  };

  return (
    <>
      <div className="page-header">
        <h2>➕ নতুন বই যোগ করুন</h2>
        <button className="btn btn-secondary" onClick={() => router.back()}>← ফিরে যান</button>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit}>
          <div className="form-sections" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
<div className="card">
              <div className="card-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>📋 মূল তথ্য</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">বইয়ের নাম *</label>
                  <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="বইয়ের নাম লিখুন" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Original Title</label>
                    <input className="form-input" value={titleOriginal} onChange={e => setTitleOriginal(e.target.value)} placeholder="English title" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subtitle</label>
                    <input className="form-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">✍️ লেখক</label>
                    <input className="form-input" value={authorId} onChange={e => setAuthorId(e.target.value)} placeholder="লেখকের নাম লিখুন" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">🔄 অনুবাদক</label>
                    <input className="form-input" value={translatorId} onChange={e => setTranslatorId(e.target.value)} placeholder="অনুবাদকের নাম লিখুন" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">🏢 প্রকাশক</label>
                    <input className="form-input" value={publisherId} onChange={e => setPublisherId(e.target.value)} placeholder="প্রকাশকের নাম লিখুন" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ISBN</label>
                    <input className="form-input" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-..." />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">🏷️ ক্যাটাগরি</label>
                    <input 
                      className="form-input" 
                      value={categoryId} 
                      onChange={e => setCategoryId(e.target.value)} 
                      list="category-options"
                      placeholder="ক্যাটাগরি লিখুন বা নির্বাচন করুন"
                    />
                    <datalist id="category-options">
                      {/* From DB */}
                      {categories.map(c => <option key={c.id} value={c.name_bn || c.name} />)}
                      {/* Defaults */}
                      <option value="ফিকশন" />
                      <option value="নন-ফিকশন" />
                      <option value="কবিতা" />
                      <option value="প্রবন্ধ" />
                      <option value="জীবনী" />
                      <option value="ধর্মীয়" />
                      <option value="শিশু-কিশোর" />
                      <option value="বিজ্ঞান" />
                      <option value="অনুবাদ" />
                      <option value="ইতিহাস" />
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">📚 ধরন (Genre)</label>
                    <input 
                      className="form-input" 
                      value={genreId} 
                      onChange={e => setGenreId(e.target.value)} 
                      list="genre-options"
                      placeholder="ধরন লিখুন বা নির্বাচন করুন"
                    />
                    <datalist id="genre-options">
                      {/* From DB */}
                      {genres.map(g => <option key={g.id} value={g.name_bn || g.name} />)}
                      {/* Defaults */}
                      <option value="উপন্যাস" />
                      <option value="ছোটগল্প" />
                      <option value="থ্রিলার/গোয়েন্দা" />
                      <option value="কল্পবিজ্ঞান" />
                      <option value="হরর" />
                      <option value="নাটক" />
                      <option value="আত্মজীবনী" />
                      <option value="রম্য রচনা" />
                    </datalist>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ভাষা</label>
                    <input className="form-input" value={language} onChange={e => setLanguage(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">সংস্করণ</label>
                    <input className="form-input" value={edition} onChange={e => setEdition(e.target.value)} placeholder="1st, 2nd..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">প্রকাশের বছর</label>
                    <input className="form-input" type="number" value={pubYear} onChange={e => setPubYear(e.target.value)} placeholder="2024" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">পৃষ্ঠা সংখ্যা</label>
                    <input className="form-input" type="number" value={pageCount} onChange={e => setPageCount(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">বিবরণ</label>
                  <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="বইয়ের সংক্ষিপ্ত বিবরণ..." />
                </div>
              </div>
            </div>

          <div className="card">
              <div className="card-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>👤 মালিকানা</h3>
              </div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">👤 মালিক</label>
                    <select 
                      className="form-select" 
                      value={owner} 
                      disabled 
                      style={{ opacity: 0.9, cursor: 'not-allowed', background: 'var(--bg-secondary)', fontWeight: 600 }}
                    >
                      {OWNERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>
                      🔒 আপনি শুধুমাত্র নিজের নামে ({getOwnerLabel(user?.id || owner)}) বইটি যোগ করতে পারবেন
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">📊 স্ট্যাটাস</label>
                    <select className="form-select" value={status} onChange={e => setStatus(e.target.value as BookStatus)}>
                      {BOOK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input type="checkbox" checked={isFavorite} onChange={e => setIsFavorite(e.target.checked)} />
                    ⭐ প্রিয় বই
                  </label>
                </div>
              </div>
            </div>

          <div className="card">
              <div className="card-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>💰 ক্রয়</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-checkbox">
                    <input type="checkbox" checked={isPurchased} onChange={e => setIsPurchased(e.target.checked)} />
                    কেনা হয়েছে
                  </label>
                </div>
                {isPurchased && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">কেনার তারিখ</label>
                        <input className="form-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">কোথা থেকে কেনা</label>
                        <input className="form-input" value={purchaseSource} onChange={e => setPurchaseSource(e.target.value)} placeholder="রকমারি, একুশে বইমেলা..." />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">দাম (৳)</label>
                        <input className="form-input" type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ছাড় (৳)</label>
                        <input className="form-input" type="number" step="0.01" value={purchaseDiscount} onChange={e => setPurchaseDiscount(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">চূড়ান্ত দাম (৳)</label>
                        <input className="form-input" type="number" step="0.01" value={purchaseFinalPrice} onChange={e => setPurchaseFinalPrice(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">কে কিনেছে</label>
                        <select className="form-select" value={purchasedBy} onChange={e => setPurchasedBy(e.target.value)}>
                          <option value="">— নির্বাচন —</option>
                          <option value="swapnil">স্বপ্নীল</option>
                          <option value="bipro">বিপ্রতীব</option>
                          <option value="srrijan">সৃজন</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">অবস্থা</label>
                        <select className="form-select" value={bookCondition} onChange={e => setBookCondition(e.target.value as BookCondition)}>
                          <option value="new">নতুন</option>
                          <option value="used">পুরনো</option>
                          <option value="gift">উপহার</option>
                          <option value="unknown">অজানা</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          <div className="card">
              <div className="card-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>📖 পড়া</h3>
              </div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">পড়া শুরু</label>
                    <input className="form-input" type="date" value={readingStartDate} onChange={e => setReadingStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">পড়া শেষ</label>
                    <input className="form-input" type="date" value={readingFinishDate} onChange={e => setReadingFinishDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">পড়ার অগ্রগতি ({readingProgress}%)</label>
                  <input type="range" min="0" max="100" value={readingProgress} onChange={e => setReadingProgress(parseInt(e.target.value))} style={{ width: '100%' }} />
                  <div className="progress-bar mt-2">
                    <div className="progress-bar-fill" style={{ width: `${readingProgress}%` }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">⭐ রেটিং</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setRating(rating === star ? 0 : star)}>
                        {star <= rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">📝 পর্যালোচনা</label>
                  <textarea className="form-textarea" value={review} onChange={e => setReview(e.target.value)} placeholder="আপনার মতামত..." />
                </div>
                <div className="form-group">
                  <label className="form-label">📝 নোট</label>
                  <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="ব্যক্তিগত নোট..." />
                </div>
                <div className="form-group">
                  <label className="form-label">💬 প্রিয় উদ্ধৃতি</label>
                  <textarea className="form-textarea" value={favoriteQuote} onChange={e => setFavoriteQuote(e.target.value)} placeholder="পছন্দের উক্তি..." />
                </div>
              </div>
            </div>

          <div className="card">
              <div className="card-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>🖼️ কভার</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">🖼️ কভার ছবির URL</label>
                  <input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
                </div>
                {coverUrl && (
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <p className="text-sm text-muted mb-2">প্রিভিউ:</p>
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      style={{ maxWidth: '200px', maxHeight: '300px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>বাতিল</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? '⏳ সংরক্ষণ করছি...' : '📚 বই যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}



