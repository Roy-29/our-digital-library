'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Author, Publisher, Category, Genre, Room, Shelf, Rack, BOOK_STATUSES, OWNERS, BookStatus, BookOwner, BookCondition, Book } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

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
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchData = async () => {
    const [bookRes, aRes, pRes, cRes, gRes, rRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', params.id).single(),
      supabase.from('authors').select('*').order('name'),
      supabase.from('publishers').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('genres').select('*').order('name'),
      supabase.from('rooms').select('*').order('name'),
    ]);

    if (aRes.data) setAuthors(aRes.data);
    if (pRes.data) setPublishers(pRes.data);
    if (cRes.data) setCategories(cRes.data);
    if (gRes.data) setGenres(gRes.data);
    if (rRes.data) setRooms(rRes.data);

    if (bookRes.error || !bookRes.data) {
      toast.error('বই পাওয়া যায়নি');
      router.push('/dashboard/books');
      return;
    }

    const b: Book = bookRes.data;
    setTitle(b.title);
    setTitleOriginal(b.title_original || '');
    setSubtitle(b.subtitle || '');
    setIsbn(b.isbn || '');
    setLanguage(b.language || 'বাংলা');
    setEdition(b.edition || '');
    setPubYear(b.publication_year?.toString() || '');
    setPageCount(b.page_count?.toString() || '');
    setDescription(b.description || '');
    setCoverUrl(b.cover_url || '');
    setAuthorId(b.author_id || '');
    setTranslatorId(b.translator_id || '');
    setPublisherId(b.publisher_id || '');
    setCategoryId(b.category_id || '');
    setGenreId(b.genre_id || '');
    setOwner(b.owner);
    setStatus(b.status);
    setRoomId(b.room_id || '');
    setShelfId(b.shelf_id || '');
    setRackId(b.rack_id || '');
    setRackRow(b.rack_row?.toString() || '');
    setRackPosition(b.rack_position?.toString() || '');
    setIsPurchased(b.is_purchased);
    setPurchaseDate(b.purchase_date || '');
    setPurchaseSource(b.purchase_source || '');
    setPurchasePrice(b.purchase_price?.toString() || '');
    setPurchaseDiscount(b.purchase_discount?.toString() || '');
    setPurchaseFinalPrice(b.purchase_final_price?.toString() || '');
    setPurchasedBy(b.purchased_by || '');
    setBookCondition(b.book_condition);
    setReadingStartDate(b.reading_start_date || '');
    setReadingFinishDate(b.reading_finish_date || '');
    setReadingProgress(b.reading_progress);
    setRating(b.rating || 0);
    setReview(b.review || '');
    setNotes(b.notes || '');
    setFavoriteQuote(b.favorite_quote || '');
    setIsFavorite(b.is_favorite);

    // Load shelves/racks if room/shelf is set
    if (b.room_id) {
      const { data: shelvesData } = await supabase.from('shelves').select('*').eq('room_id', b.room_id).order('name');
      if (shelvesData) setShelves(shelvesData);
    }
    if (b.shelf_id) {
      const { data: racksData } = await supabase.from('racks').select('*').eq('shelf_id', b.shelf_id).order('position_order');
      if (racksData) setRacks(racksData);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (roomId && !loading) {
      supabase.from('shelves').select('*').eq('room_id', roomId).order('name').then(({ data }: { data: any }) => setShelves(data || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (shelfId && !loading) {
      supabase.from('racks').select('*').eq('shelf_id', shelfId).order('position_order').then(({ data }: { data: any }) => setRacks(data || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfId]);

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return coverUrl || null;
    const ext = coverFile.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('covers').upload(fileName, coverFile);
    if (error) { toast.error('কভার আপলোড ব্যর্থ'); return coverUrl || null; }
    const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('বইয়ের নাম লিখুন'); return; }
    setSaving(true);
    const uploadedCoverUrl = await uploadCover();

    const bookData = {
      title: title.trim(), title_original: titleOriginal || null, subtitle: subtitle || null,
      isbn: isbn || null, language, edition: edition || null,
      publication_year: pubYear ? parseInt(pubYear) : null, page_count: pageCount ? parseInt(pageCount) : null,
      description: description || null, cover_url: uploadedCoverUrl,
      author_id: authorId || null, translator_id: translatorId || null,
      publisher_id: publisherId || null, category_id: categoryId || null, genre_id: genreId || null,
      owner, status,
      room_id: roomId || null, shelf_id: shelfId || null, rack_id: rackId || null,
      rack_row: rackRow ? parseInt(rackRow) : null, rack_position: rackPosition ? parseInt(rackPosition) : null,
      is_purchased: isPurchased, purchase_date: purchaseDate || null, purchase_source: purchaseSource || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_discount: purchaseDiscount ? parseFloat(purchaseDiscount) : null,
      purchase_final_price: purchaseFinalPrice ? parseFloat(purchaseFinalPrice) : null,
      purchased_by: purchasedBy || null, book_condition: bookCondition,
      reading_start_date: readingStartDate || null, reading_finish_date: readingFinishDate || null,
      reading_progress: readingProgress, rating: rating || null,
      review: review || null, notes: notes || null, favorite_quote: favoriteQuote || null,
      is_favorite: isFavorite,
    };

    const { error } = await supabase.from('books').update(bookData).eq('id', params.id);
    if (error) {
      toast.error('সংরক্ষণ ব্যর্থ: ' + error.message);
    } else {
      await supabase.from('activity_log').insert({
        user_id: user?.id, action: 'book_updated', entity_type: 'book',
        entity_id: params.id as string, entity_name: title,
      });
      toast.success('বই আপডেট হয়েছে! ✅');
      router.push(`/dashboard/books/${params.id}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (<><div className="page-header"><h2>✏️ সম্পাদনা</h2></div><div className="page-body"><div className="loading-inline"><div className="spinner" /></div></div></>);
  }

  const tabs = [
    { key: 'basic', label: '📋 মূল তথ্য' },
    { key: 'ownership', label: '👤 মালিকানা' },
    { key: 'location', label: '📍 অবস্থান' },
    { key: 'purchase', label: '💰 ক্রয়' },
    { key: 'reading', label: '📖 পড়া' },
    { key: 'cover', label: '🖼️ কভার' },
  ];

  return (
    <>
      <div className="page-header">
        <h2>✏️ সম্পাদনা: {title}</h2>
        <button className="btn btn-secondary" onClick={() => router.back()}>← ফিরে যান</button>
      </div>
      <div className="page-body">
        <form onSubmit={handleSubmit}>
          <div className="tabs">
            {tabs.map(t => (<button key={t.key} type="button" className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>))}
          </div>

          {activeTab === 'basic' && (
            <div className="card"><div className="card-body">
              <div className="form-group"><label className="form-label">বইয়ের নাম *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Original Title</label><input className="form-input" value={titleOriginal} onChange={e => setTitleOriginal(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Subtitle</label><input className="form-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">লেখক</label><select className="form-select" value={authorId} onChange={e => setAuthorId(e.target.value)}><option value="">—</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name_bn || a.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">অনুবাদক</label><select className="form-select" value={translatorId} onChange={e => setTranslatorId(e.target.value)}><option value="">—</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name_bn || a.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">প্রকাশক</label><select className="form-select" value={publisherId} onChange={e => setPublisherId(e.target.value)}><option value="">—</option>{publishers.map(p => <option key={p.id} value={p.id}>{p.name_bn || p.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">ISBN</label><input className="form-input" value={isbn} onChange={e => setIsbn(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">ক্যাটাগরি</label><select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">—</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_bn || c.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Genre</label><select className="form-select" value={genreId} onChange={e => setGenreId(e.target.value)}><option value="">—</option>{genres.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name_bn || g.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">ভাষা</label><input className="form-input" value={language} onChange={e => setLanguage(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">সংস্করণ</label><input className="form-input" value={edition} onChange={e => setEdition(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">প্রকাশের বছর</label><input className="form-input" type="number" value={pubYear} onChange={e => setPubYear(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">পৃষ্ঠা</label><input className="form-input" type="number" value={pageCount} onChange={e => setPageCount(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">বিবরণ</label><textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} /></div>
            </div></div>
          )}

          {activeTab === 'ownership' && (
            <div className="card"><div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">মালিক</label><select className="form-select" value={owner} onChange={e => setOwner(e.target.value as BookOwner)}>{OWNERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <div className="form-group"><label className="form-label">স্ট্যাটাস</label><select className="form-select" value={status} onChange={e => setStatus(e.target.value as BookStatus)}>{BOOK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-checkbox"><input type="checkbox" checked={isFavorite} onChange={e => setIsFavorite(e.target.checked)} /> ⭐ প্রিয় বই</label></div>
            </div></div>
          )}

          {activeTab === 'location' && (
            <div className="card"><div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">ঘর</label><select className="form-select" value={roomId} onChange={e => setRoomId(e.target.value)}><option value="">—</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name_bn || r.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">শেলফ</label><select className="form-select" value={shelfId} onChange={e => setShelfId(e.target.value)} disabled={!roomId}><option value="">—</option>{shelves.map(s => <option key={s.id} value={s.id}>{s.name_bn || s.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">র‍্যাক</label><select className="form-select" value={rackId} onChange={e => setRackId(e.target.value)} disabled={!shelfId}><option value="">—</option>{racks.map(r => <option key={r.id} value={r.id}>{r.name_bn || r.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">সারি</label><input className="form-input" type="number" value={rackRow} onChange={e => setRackRow(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">অবস্থান</label><input className="form-input" type="number" value={rackPosition} onChange={e => setRackPosition(e.target.value)} /></div>
              </div>
            </div></div>
          )}

          {activeTab === 'purchase' && (
            <div className="card"><div className="card-body">
              <div className="form-group"><label className="form-checkbox"><input type="checkbox" checked={isPurchased} onChange={e => setIsPurchased(e.target.checked)} /> কেনা হয়েছে</label></div>
              {isPurchased && (<>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">তারিখ</label><input className="form-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">উৎস</label><input className="form-input" value={purchaseSource} onChange={e => setPurchaseSource(e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">দাম (৳)</label><input className="form-input" type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">ছাড় (৳)</label><input className="form-input" type="number" step="0.01" value={purchaseDiscount} onChange={e => setPurchaseDiscount(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">চূড়ান্ত দাম (৳)</label><input className="form-input" type="number" step="0.01" value={purchaseFinalPrice} onChange={e => setPurchaseFinalPrice(e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">কে কিনেছে</label><select className="form-select" value={purchasedBy} onChange={e => setPurchasedBy(e.target.value)}><option value="">—</option><option value="swapnil">Swapnil</option><option value="bipro">Bipro</option></select></div>
                  <div className="form-group"><label className="form-label">অবস্থা</label><select className="form-select" value={bookCondition} onChange={e => setBookCondition(e.target.value as BookCondition)}><option value="new">নতুন</option><option value="used">পুরনো</option><option value="gift">উপহার</option><option value="unknown">অজানা</option></select></div>
                </div>
              </>)}
            </div></div>
          )}

          {activeTab === 'reading' && (
            <div className="card"><div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">পড়া শুরু</label><input className="form-input" type="date" value={readingStartDate} onChange={e => setReadingStartDate(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">পড়া শেষ</label><input className="form-input" type="date" value={readingFinishDate} onChange={e => setReadingFinishDate(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">অগ্রগতি ({readingProgress}%)</label>
                <input type="range" min="0" max="100" value={readingProgress} onChange={e => setReadingProgress(parseInt(e.target.value))} style={{ width: '100%' }} />
                <div className="progress-bar mt-2"><div className="progress-bar-fill" style={{ width: `${readingProgress}%` }} /></div>
              </div>
              <div className="form-group"><label className="form-label">রেটিং</label>
                <div className="star-rating">{[1,2,3,4,5].map(s => (<button key={s} type="button" onClick={() => setRating(rating === s ? 0 : s)}>{s <= rating ? '⭐' : '☆'}</button>))}</div>
              </div>
              <div className="form-group"><label className="form-label">পর্যালোচনা</label><textarea className="form-textarea" value={review} onChange={e => setReview(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">নোট</label><textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">প্রিয় উদ্ধৃতি</label><textarea className="form-textarea" value={favoriteQuote} onChange={e => setFavoriteQuote(e.target.value)} /></div>
            </div></div>
          )}

          {activeTab === 'cover' && (
            <div className="card"><div className="card-body">
              <div className="form-group"><label className="form-label">কভার আপলোড</label><input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="form-input" /></div>
              <div className="form-group"><label className="form-label">অথবা URL</label><input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} /></div>
              {(coverFile || coverUrl) && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <img src={coverFile ? URL.createObjectURL(coverFile) : coverUrl} alt="Preview" style={{ maxWidth: '200px', maxHeight: '300px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }} />
                </div>
              )}
            </div></div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>বাতিল</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? '⏳ সংরক্ষণ করছি...' : '✅ আপডেট করুন'}</button>
          </div>
        </form>
      </div>
    </>
  );
}
