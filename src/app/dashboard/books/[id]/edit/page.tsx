'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Author, Publisher, Category, Genre, Room, Shelf, Rack, BOOK_STATUSES, OWNERS, BookStatus, BookOwner, BookCondition, Book, getOwnerLabel } from '@/lib/types';
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
  const [translators, setTranslators] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  // Memoized unique dropdown lists
  const uniqueAuthors = useMemo(() => {
    const set = new Set<string>();
    authors.forEach((a) => {
      const bn = a.name_bn?.trim();
      const en = a.name?.trim();
      if (bn) set.add(bn);
      if (en) set.add(en);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [authors]);

  const uniqueTranslators = useMemo(() => {
    const set = new Set<string>();
    translators.forEach((t) => {
      const bn = t.name_bn?.trim();
      const en = t.name?.trim();
      if (bn) set.add(bn);
      if (en) set.add(en);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [translators]);

  const uniquePublishers = useMemo(() => {
    const set = new Set<string>();
    publishers.forEach((p) => {
      const bn = p.name_bn?.trim();
      const en = p.name?.trim();
      if (bn) set.add(bn);
      if (en) set.add(en);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [publishers]);

  const uniqueCategories = useMemo(() => {
    const defaults = [
      'ফিকশন', 'নন-ফিকশন', 'কবিতা', 'প্রবন্ধ', 'জীবনী', 'আত্মজীবনী',
      'ধর্মীয় ও আধ্যাত্মিক', 'শিশু-কিশোর', 'বিজ্ঞান ও প্রযুক্তি', 'অনুবাদ সাহিত্য',
      'ইতিহাস ও ঐতিহ্য', 'দর্শন', 'রাজনীতি ও সমাজ', 'মনস্তত্ত্ব ও আত্মউন্নয়ন', 'ভ্রমণ কাহিনী'
    ];
    const set = new Set<string>();
    categories.forEach((c) => {
      const bn = c.name_bn?.trim();
      const en = c.name?.trim();
      if (bn) set.add(bn);
      if (en) set.add(en);
    });
    defaults.forEach((d) => set.add(d));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [categories]);

  const uniqueGenres = useMemo(() => {
    const defaults = [
      'উপন্যাস', 'ছোটগল্প', 'থ্রিলার ও গোয়েন্দা', 'রহস্য ও রোমাঞ্চ', 'কল্পবিজ্ঞান (Sci-Fi)',
      'হরর ও ভৌতিক', 'নাটক', 'রম্য ও ব্যঙ্গ রচনা', 'ঐতিহাসিক উপন্যাস', 'ফ্যান্টাসি',
      'স্মৃতিকথা', 'প্রেম ও রোমান্স', 'সামাজিক', 'এডভেঞ্চার'
    ];
    const set = new Set<string>();
    genres.forEach((g) => {
      const bn = g.name_bn?.trim();
      const en = g.name?.trim();
      if (bn) set.add(bn);
      if (en) set.add(en);
    });
    defaults.forEach((d) => set.add(d));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [genres]);

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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchData = async () => {
    const [bookRes, aRes, pRes, cRes, gRes, rRes, bRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', params.id).single(),
      supabase.from('authors').select('*').order('name'),
      supabase.from('publishers').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('genres').select('*').order('name'),
      supabase.from('rooms').select('*').order('name'),
      supabase.from('books').select('*'),
    ]);

    if (aRes.data) setAuthors(aRes.data);
    if (pRes.data) setPublishers(pRes.data);
    if (cRes.data) setCategories(cRes.data);
    if (gRes.data) setGenres(gRes.data);
    if (rRes.data) setRooms(rRes.data);
    if (bRes.data && aRes.data) {
      const transIds = new Set(
        (bRes.data as any[])
          .map((book: any) => book.translator_id || book.translatorId)
          .filter(Boolean)
      );
      const transList = (aRes.data as Author[]).filter((auth: Author) => transIds.has(auth.id));
      setTranslators(transList);
    }

    if (bookRes.error || !bookRes.data) {
      toast.error('বই পাওয়া যায়নি');
      router.push('/dashboard/books');
      return;
    }

    const b: Book = bookRes.data;
    if (user && b.owner && b.owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের বই সম্পাদনা করতে পারবেন!');
      router.push(`/dashboard/books/${params.id}`);
      return;
    }
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
    setAuthorId(aRes.data?.find((a: any) => a.id === b.author_id)?.name_bn || aRes.data?.find((a: any) => a.id === b.author_id)?.name || '');
    setTranslatorId(aRes.data?.find((a: any) => a.id === b.translator_id)?.name_bn || aRes.data?.find((a: any) => a.id === b.translator_id)?.name || '');
    setPublisherId(pRes.data?.find((p: any) => p.id === b.publisher_id)?.name_bn || pRes.data?.find((p: any) => p.id === b.publisher_id)?.name || '');
    setCategoryId(cRes.data?.find((c: any) => c.id === b.category_id)?.name_bn || cRes.data?.find((c: any) => c.id === b.category_id)?.name || '');
    setGenreId(gRes.data?.find((g: any) => g.id === b.genre_id)?.name_bn || gRes.data?.find((g: any) => g.id === b.genre_id)?.name || '');
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
    return coverUrl.trim() || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && owner !== user.id) {
      toast.error('আপনি শুধুমাত্র নিজের বই সম্পাদনা করতে পারবেন!');
      return;
    }
    if (!title.trim()) { toast.error('বইয়ের নাম লিখুন'); return; }
    setSaving(true);
    const resolveAuthor = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = authors.find(
        a => (a.name_bn && a.name_bn.trim().toLowerCase() === lower) ||
             (a.name && a.name.trim().toLowerCase() === lower)
      );
      if (existing) return existing.id;
      
      const { data } = await supabase.from('authors').insert({ name_bn: t, name: t });
      if (data?.id) return data.id;
      
      const { data: all } = await supabase.from('authors').select('*');
      const found = (all as any[])?.find(
        a => (a.name_bn && a.name_bn.trim().toLowerCase() === lower) ||
             (a.name && a.name.trim().toLowerCase() === lower)
      );
      return found?.id || null;
    };
    
    const resolvePublisher = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = publishers.find(
        p => (p.name_bn && p.name_bn.trim().toLowerCase() === lower) ||
             (p.name && p.name.trim().toLowerCase() === lower)
      );
      if (existing) return existing.id;
      
      const { data } = await supabase.from('publishers').insert({ name_bn: t, name: t });
      if (data?.id) return data.id;

      const { data: all } = await supabase.from('publishers').select('*');
      const found = (all as any[])?.find(
        p => (p.name_bn && p.name_bn.trim().toLowerCase() === lower) ||
             (p.name && p.name.trim().toLowerCase() === lower)
      );
      return found?.id || null;
    };

    const resolveCategory = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = categories.find(
        c => (c.name_bn && c.name_bn.trim().toLowerCase() === lower) ||
             (c.name && c.name.trim().toLowerCase() === lower)
      );
      if (existing) return existing.id;
      
      const { data } = await supabase.from('categories').insert({ name_bn: t, name: t, icon: '🏷️' });
      if (data?.id) return data.id;

      const { data: all } = await supabase.from('categories').select('*');
      const found = (all as any[])?.find(
        c => (c.name_bn && c.name_bn.trim().toLowerCase() === lower) ||
             (c.name && c.name.trim().toLowerCase() === lower)
      );
      return found?.id || null;
    };

    const resolveGenre = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = genres.find(
        g => (g.name_bn && g.name_bn.trim().toLowerCase() === lower) ||
             (g.name && g.name.trim().toLowerCase() === lower)
      );
      if (existing) return existing.id;
      
      const { data } = await supabase.from('genres').insert({ name_bn: t, name: t, icon: '📚' });
      if (data?.id) return data.id;

      const { data: all } = await supabase.from('genres').select('*');
      const found = (all as any[])?.find(
        g => (g.name_bn && g.name_bn.trim().toLowerCase() === lower) ||
             (g.name && g.name.trim().toLowerCase() === lower)
      );
      return found?.id || null;
    };

    const finalAuthorId = await resolveAuthor(authorId);
    const finalTranslatorId = await resolveAuthor(translatorId);
    const finalPublisherId = await resolvePublisher(publisherId);
    const finalCategoryId = await resolveCategory(categoryId);
    const finalGenreId = await resolveGenre(genreId);

    const uploadedCoverUrl = await uploadCover();

    const bookData = {
      title: title.trim(), title_original: titleOriginal || null, subtitle: subtitle || null,
      isbn: isbn || null, language, edition: edition || null,
      publication_year: pubYear ? parseInt(pubYear) : null, page_count: pageCount ? parseInt(pageCount) : null,
      description: description || null, cover_url: uploadedCoverUrl,
      author_id: finalAuthorId || null, translator_id: finalTranslatorId || null,
      publisher_id: finalPublisherId || null, category_id: finalCategoryId || null, genre_id: finalGenreId || null,
      owner, status,
      room_id: roomId || null, shelf_id: shelfId || null, rack_id: rackId || null,
      rack_row: rackRow ? parseInt(rackRow) : null, rack_position: rackPosition ? parseInt(rackPosition) : null,
      is_purchased: isPurchased, purchase_date: purchaseDate || null, purchase_source: purchaseSource || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_discount: purchaseDiscount ? parseFloat(purchaseDiscount) : null,
      purchase_final_price: purchaseFinalPrice ? parseFloat(purchaseFinalPrice) : null,
      purchased_by: owner || user?.id || null, book_condition: bookCondition,
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
                    <input 
                      className="form-input" 
                      value={authorId} 
                      onChange={e => setAuthorId(e.target.value)} 
                      list="author-options"
                      placeholder="লেখকের নাম লিখুন বা নির্বাচন করুন" 
                    />
                    <datalist id="author-options">
                      {uniqueAuthors.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">🔄 অনুবাদক</label>
                    <input 
                      className="form-input" 
                      value={translatorId} 
                      onChange={e => setTranslatorId(e.target.value)} 
                      list="translator-options"
                      placeholder="অনুবাদকের নাম লিখুন বা নির্বাচন করুন" 
                    />
                    <datalist id="translator-options">
                      {uniqueTranslators.map(name => (
                        <option key={`trans-${name}`} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">🏢 প্রকাশক</label>
                    <input 
                      className="form-input" 
                      value={publisherId} 
                      onChange={e => setPublisherId(e.target.value)} 
                      list="publisher-options"
                      placeholder="প্রকাশকের নাম লিখুন বা নির্বাচন করুন" 
                    />
                    <datalist id="publisher-options">
                      {uniquePublishers.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
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
                      {uniqueCategories.map(name => (
                        <option key={name} value={name} />
                      ))}
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
                      {uniqueGenres.map(name => (
                        <option key={name} value={name} />
                      ))}
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
                      🔒 এই বইটির মালিক {getOwnerLabel(owner)}
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">📊 স্ট্যাটাস</label>
                    <select 
                      className="form-select" 
                      value={status} 
                      onChange={e => {
                        const s = e.target.value as BookStatus;
                        setStatus(s);
                        if (['পড়া শেষ (কাছে নেই)', 'কিনবো', 'পড়ছি (কাছে নেই)', 'ধার করে পড়া', 'ই-বুক / পিডিএফ'].includes(s)) {
                          setIsPurchased(false);
                        } else if (s === 'আছে') {
                          setIsPurchased(true);
                        }
                      }}
                    >
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
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>💰 ক্রয় ও সংগ্রহ</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-checkbox">
                    <input type="checkbox" checked={isPurchased} onChange={e => setIsPurchased(e.target.checked)} />
                    ফিজিক্যাল কপি কেনা হয়েছে (সংগ্রহে আছে)
                  </label>
                </div>
                {!isPurchased && (
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">📍 কোথা থেকে পড়া / উৎস</label>
                    <input 
                      className="form-input" 
                      value={purchaseSource} 
                      onChange={e => setPurchaseSource(e.target.value)} 
                      placeholder="যেমন: বিশ্বসাহিত্য কেন্দ্র লাইব্রেরি, বন্ধুর বই, অনলাইন/পিডিএফ..." 
                    />
                  </div>
                )}
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
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? '⏳ সংরক্ষণ করছি...' : '✅ আপডেট করুন'}</button>
          </div>
        </form>
      </div>
    </>
  );
}
