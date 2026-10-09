'use client';

import { useState, useMemo } from 'react';
import { CustomSelect } from '@/components/CustomSelect';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BOOK_STATUSES, OWNERS, getOwnerLabel, enToBnNumber, bnToEnNumber } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

type ViewMode = 'list' | 'grid';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'সংগ্রহে যোগের তারিখ' },
  { value: 'title', label: 'বইয়ের নাম (ক-হ / A-Z)' },
  { value: 'authorName', label: 'লেখক' },
  { value: 'translatorName', label: 'অনুবাদক' },
  { value: 'publisherName', label: 'প্রকাশক' },
  { value: 'categoryName', label: 'ক্যাটাগরি' },
  { value: 'genreName', label: 'ধরন (Genre)' },
  { value: 'rating', label: 'রেটিং (⭐ স্টার)' },
  { value: 'publicationYear', label: 'প্রকাশের বছর' },
  { value: 'pageCount', label: 'পৃষ্ঠা সংখ্যা' },
  { value: 'readingProgress', label: 'পড়ার অগ্রগতি (%)' },
  { value: 'purchaseFinalPrice', label: 'বইয়ের দাম (৳)' },
];

export default function SortClient({
  initialBooks,
  authors,
  publishers,
  categories,
  genres,
  languages,
  purchaseSources,
}: {
  initialBooks: any[];
  authors: any[];
  publishers: any[];
  categories: any[];
  genres: any[];
  languages: string[];
  purchaseSources: string[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [books, setBooks] = useState(initialBooks);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter states
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterTranslator, setFilterTranslator] = useState('');
  const [filterPublisher, setFilterPublisher] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterProgress, setFilterProgress] = useState('all');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterPurchased, setFilterPurchased] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterPurchaseSource, setFilterPurchaseSource] = useState('');
  const [filterYearMin, setFilterYearMin] = useState('');
  const [filterYearMax, setFilterYearMax] = useState('');
  const [filterPageMin, setFilterPageMin] = useState('');
  const [filterPageMax, setFilterPageMax] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterHasReview, setFilterHasReview] = useState(false);
  const [filterHasQuote, setFilterHasQuote] = useState(false);

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'literature' | 'ownership' | 'reading' | 'numbers'>('literature');
  const [showFilters, setShowFilters] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Translators list extracted from books
  const translatorsList = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    books.forEach(b => {
      if (b.translatorId && !seen.has(b.translatorId)) {
        seen.add(b.translatorId);
        list.push({
          id: b.translatorId,
          name: b.translatorNameBn || b.translatorName || 'অনুবাদক',
        });
      }
    });
    return list;
  }, [books]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const targetBook = books.find(b => b.id === deleteId);

    const { error } = await supabase.from('books').delete().eq('id', deleteId);
    if (error) {
      toast.error('মুছতে সমস্যা হয়েছে: ' + error.message);
      return;
    }
    toast.success('বই সফলভাবে মুছে ফেলা হয়েছে');
    setBooks(books.filter(b => b.id !== deleteId));
    setDeleteId(null);
  };

  // Filter logic
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (filterOwner && book.owner !== filterOwner) return false;
      if (filterStatus && book.status !== filterStatus) return false;
      if (filterAuthor && book.authorId !== filterAuthor) return false;
      
      if (filterTranslator) {
        if (filterTranslator === '__has_translator__') {
          if (!book.translatorId) return false;
        } else if (book.translatorId !== filterTranslator) {
          return false;
        }
      }

      if (filterPublisher && book.publisherId !== filterPublisher && book.publisherName !== filterPublisher) return false;
      if (filterCategory && book.categoryId !== filterCategory) return false;
      if (filterGenre && book.genreId !== filterGenre) return false;
      if (filterLanguage && book.language !== filterLanguage) return false;
      
      if (filterRating > 0 && (!book.rating || book.rating < filterRating)) return false;

      if (filterProgress === 'finished' && book.readingProgress !== 100 && book.status !== 'পড়া শেষ') return false;
      if (filterProgress === 'reading' && (book.readingProgress <= 0 || book.readingProgress >= 100) && book.status !== 'পড়ছি') return false;
      if (filterProgress === 'unread' && (book.readingProgress > 0 || book.status === 'পড়া শেষ' || book.status === 'পড়ছি')) return false;

      if (filterFavorite && !book.isFavorite) return false;

      if (filterPurchased === 'yes' && !book.isPurchased) return false;
      if (filterPurchased === 'no' && book.isPurchased) return false;

      if (filterCondition !== 'all' && book.bookCondition !== filterCondition) return false;
      if (filterPurchaseSource && book.purchaseSource !== filterPurchaseSource) return false;

      if (filterYearMin && (!book.publicationYear || book.publicationYear < parseInt(bnToEnNumber(filterYearMin)))) return false;
      if (filterYearMax && (!book.publicationYear || book.publicationYear > parseInt(bnToEnNumber(filterYearMax)))) return false;

      if (filterPageMin && (!book.pageCount || book.pageCount < parseInt(bnToEnNumber(filterPageMin)))) return false;
      if (filterPageMax && (!book.pageCount || book.pageCount > parseInt(bnToEnNumber(filterPageMax)))) return false;

      if (filterPriceMin && (!book.purchaseFinalPrice || book.purchaseFinalPrice < parseFloat(bnToEnNumber(filterPriceMin)))) return false;
      if (filterPriceMax && (!book.purchaseFinalPrice || book.purchaseFinalPrice > parseFloat(bnToEnNumber(filterPriceMax)))) return false;

      if (filterHasReview && !book.review?.trim()) return false;
      if (filterHasQuote && !book.favoriteQuote?.trim()) return false;

      if (search) {
        const q = search.toLowerCase();
        const match =
          book.title?.toLowerCase().includes(q) ||
          book.titleOriginal?.toLowerCase().includes(q) ||
          book.subtitle?.toLowerCase().includes(q) ||
          book.isbn?.toLowerCase().includes(q) ||
          book.authorName?.toLowerCase().includes(q) ||
          book.authorNameBn?.toLowerCase().includes(q) ||
          book.translatorName?.toLowerCase().includes(q) ||
          book.translatorNameBn?.toLowerCase().includes(q) ||
          book.publisherName?.toLowerCase().includes(q) ||
          book.description?.toLowerCase().includes(q) ||
          book.notes?.toLowerCase().includes(q) ||
          book.review?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    books,
    search,
    filterOwner,
    filterStatus,
    filterAuthor,
    filterTranslator,
    filterPublisher,
    filterCategory,
    filterGenre,
    filterLanguage,
    filterRating,
    filterProgress,
    filterFavorite,
    filterPurchased,
    filterCondition,
    filterPurchaseSource,
    filterYearMin,
    filterYearMax,
    filterPageMin,
    filterPageMax,
    filterPriceMin,
    filterPriceMax,
    filterHasReview,
    filterHasQuote,
  ]);

  // Sorting logic
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'authorName') {
        valA = a.authorNameBn || a.authorName || '';
        valB = b.authorNameBn || b.authorName || '';
      } else if (sortBy === 'translatorName') {
        valA = a.translatorNameBn || a.translatorName || '';
        valB = b.translatorNameBn || b.translatorName || '';
      } else if (sortBy === 'publisherName') {
        valA = a.publisherNameBn || a.publisherName || '';
        valB = b.publisherNameBn || b.publisherName || '';
      } else if (sortBy === 'categoryName') {
        valA = a.categoryNameBn || a.categoryName || '';
        valB = b.categoryNameBn || b.categoryName || '';
      } else if (sortBy === 'genreName') {
        valA = a.genreNameBn || a.genreName || '';
        valB = b.genreNameBn || b.genreName || '';
      }

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      const comp = strA.localeCompare(strB, 'bn');
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredBooks, sortBy, sortOrder]);

  // Active filters count & chips
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (search) list.push({ key: 'search', label: `সার্চ: "${search}"`, clear: () => setSearch('') });
    if (filterOwner) list.push({ key: 'owner', label: `মালিক: ${getOwnerLabel(filterOwner)}`, clear: () => setFilterOwner('') });
    if (filterStatus) list.push({ key: 'status', label: `স্ট্যাটাস: ${filterStatus}`, clear: () => setFilterStatus('') });
    
    if (filterAuthor) {
      const a = authors.find(x => x.id === filterAuthor);
      list.push({ key: 'author', label: `লেখক: ${a?.nameBn || a?.name || filterAuthor}`, clear: () => setFilterAuthor('') });
    }
    if (filterTranslator) {
      if (filterTranslator === '__has_translator__') {
        list.push({ key: 'translator', label: `অনুবাদক: শুধু অনূদিত বই`, clear: () => setFilterTranslator('') });
      } else {
        const t = translatorsList.find(x => x.id === filterTranslator);
        list.push({ key: 'translator', label: `অনুবাদক: ${t?.name || filterTranslator}`, clear: () => setFilterTranslator('') });
      }
    }
    if (filterPublisher) {
      const p = publishers.find(x => x.id === filterPublisher);
      list.push({ key: 'publisher', label: `প্রকাশক: ${p?.nameBn || p?.name || filterPublisher}`, clear: () => setFilterPublisher('') });
    }
    if (filterCategory) {
      const c = categories.find(x => x.id === filterCategory);
      list.push({ key: 'category', label: `ক্যাটাগরি: ${c?.nameBn || c?.name || filterCategory}`, clear: () => setFilterCategory('') });
    }
    if (filterGenre) {
      const g = genres.find(x => x.id === filterGenre);
      list.push({ key: 'genre', label: `ধরন: ${g?.nameBn || g?.name || filterGenre}`, clear: () => setFilterGenre('') });
    }
    if (filterLanguage) list.push({ key: 'lang', label: `ভাষা: ${filterLanguage}`, clear: () => setFilterLanguage('') });
    if (filterRating > 0) list.push({ key: 'rating', label: `রেটিং: ${filterRating}★+`, clear: () => setFilterRating(0) });
    if (filterProgress !== 'all') {
      const lbl = filterProgress === 'finished' ? 'পড়া শেষ' : filterProgress === 'reading' ? 'পড়ছি' : 'পড়া হয়নি';
      list.push({ key: 'progress', label: `অগ্রগতি: ${lbl}`, clear: () => setFilterProgress('all') });
    }
    if (filterFavorite) list.push({ key: 'fav', label: `⭐ প্রিয় বই`, clear: () => setFilterFavorite(false) });
    if (filterPurchased !== 'all') {
      list.push({ key: 'purchased', label: filterPurchased === 'yes' ? 'সংগ্রহে কেনা আছে' : 'সংগ্রহে নেই', clear: () => setFilterPurchased('all') });
    }
    if (filterCondition !== 'all') list.push({ key: 'cond', label: `অবস্থা: ${filterCondition}`, clear: () => setFilterCondition('all') });
    if (filterPurchaseSource) list.push({ key: 'src', label: `উৎস: ${filterPurchaseSource}`, clear: () => setFilterPurchaseSource('') });
    if (filterYearMin || filterYearMax) list.push({ key: 'year', label: `বছর: ${filterYearMin || '০'} - ${filterYearMax || 'বর্তমান'}`, clear: () => { setFilterYearMin(''); setFilterYearMax(''); } });
    if (filterPageMin || filterPageMax) list.push({ key: 'page', label: `পৃষ্ঠা: ${filterPageMin || '০'} - ${filterPageMax || '∞'}`, clear: () => { setFilterPageMin(''); setFilterPageMax(''); } });
    if (filterPriceMin || filterPriceMax) list.push({ key: 'price', label: `দাম: ৳${filterPriceMin || '০'} - ৳${filterPriceMax || '∞'}`, clear: () => { setFilterPriceMin(''); setFilterPriceMax(''); } });
    if (filterHasReview) list.push({ key: 'hasRev', label: `রিভিউ আছে`, clear: () => setFilterHasReview(false) });
    if (filterHasQuote) list.push({ key: 'hasQuote', label: `উদ্ধৃতি আছে`, clear: () => setFilterHasQuote(false) });

    return list;
  }, [
    search, filterOwner, filterStatus, filterAuthor, filterTranslator, filterPublisher, filterCategory, filterGenre,
    filterLanguage, filterRating, filterProgress, filterFavorite, filterPurchased, filterCondition,
    filterPurchaseSource, filterYearMin, filterYearMax, filterPageMin, filterPageMax, filterPriceMin, filterPriceMax,
    filterHasReview, filterHasQuote, authors, publishers, categories, genres, translatorsList
  ]);

  const clearAllFilters = () => {
    setSearch('');
    setFilterOwner('');
    setFilterStatus('');
    setFilterAuthor('');
    setFilterTranslator('');
    setFilterPublisher('');
    setFilterCategory('');
    setFilterGenre('');
    setFilterLanguage('');
    setFilterRating(0);
    setFilterProgress('all');
    setFilterFavorite(false);
    setFilterPurchased('all');
    setFilterCondition('all');
    setFilterPurchaseSource('');
    setFilterYearMin('');
    setFilterYearMax('');
    setFilterPageMin('');
    setFilterPageMax('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterHasReview(false);
    setFilterHasQuote(false);
  };

  return (
    <>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>🔀 বই বাছাইকরণ ও অনুসন্ধান</h2>
          <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
            বইয়ের যেকোনো তথ্যের ওপর ভিত্তি করে খুঁজুন, ফিল্টার করুন এবং সাজান
          </p>
        </div>
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              📋 তালিকা
            </button>
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              🔲 গ্রিড
            </button>
          </div>
          <Link href="/dashboard/books/add" className="btn btn-primary">
            ➕ বই যোগ
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Main Controls Card */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', border: '1px solid var(--border)' }}>
          {/* Row 1: Search Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div className="books-search-box" style={{ width: '100%', height: '42px' }}>
              <span className="search-icon" style={{ fontSize: '1rem' }}>🔍</span>
              <input
                type="text"
                placeholder="বইয়ের নাম, মূল নাম, লেখক, অনুবাদক, প্রকাশক, ক্যাটাগরি, নোট বা বিবরণ দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
              {search && (
                <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Row 2: Sort Control Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                সাজানোর মাধ্যম:
              </span>
              <CustomSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={SORT_OPTIONS}
              />

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'ছোট থেকে বড় / ঊর্ধ্বক্রম' : 'বড় থেকে ছোট / নিম্নক্রম'}
                style={{ height: '42px', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, borderRadius: 'var(--radius-md)' }}
              >
                {sortOrder === 'asc' ? '🔼 ঊর্ধ্বক্রম (A-Z)' : '🔽 নিম্নক্রম (Z-A)'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowFilters(!showFilters)}
                style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-md)' }}
              >
                <span>⚙️</span>
                <span>{showFilters ? 'ফিল্টার লুকান' : 'ফিল্টার খুলুন'}</span>
                {activeFilters.length > 0 && (
                  <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 7px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {activeFilters.length}
                  </span>
                )}
              </button>

              {activeFilters.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearAllFilters}
                  style={{ color: 'var(--danger)', height: '42px', padding: '0 12px' }}
                >
                  ✕ সব রিসেট
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters Section */}
          {showFilters && (
            <div style={{ paddingTop: '20px' }}>
              {/* Segmented Filter Category Tabs */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'literature' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('literature')}
                  style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.88rem', fontWeight: 500 }}
                >
                  📚 সাহিত্য ও বইয়ের তথ্য
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'ownership' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('ownership')}
                  style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.88rem', fontWeight: 500 }}
                >
                  👤 মালিকানা ও সংগ্রহ
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'reading' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('reading')}
                  style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.88rem', fontWeight: 500 }}
                >
                  📖 পড়া ও রেটিং
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'numbers' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('numbers')}
                  style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.88rem', fontWeight: 500 }}
                >
                  🔢 পৃষ্ঠা, বছর ও দাম
                </button>
              </div>

              {/* Tab 1: Literature & Publishing */}
              {activeTab === 'literature' && (
                <div className="sort-filters-grid-3">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ✍🏻 লেখক
                    </label>
                    <CustomSelect
                      value={filterAuthor}
                      onChange={(val) => setFilterAuthor(val)}
                      options={[
                        { value: '', label: 'সব লেখক' },
                        ...authors.map((a) => ({ value: a.id, label: a.nameBn || a.name }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      🔄 অনুবাদক
                    </label>
                    <CustomSelect
                      value={filterTranslator}
                      onChange={(val) => setFilterTranslator(val)}
                      options={[
                        { value: '', label: 'সব (অনূদিত/মৌলিক)' },
                        { value: '__has_translator__', label: '✨ শুধুমাত্র অনূদিত বই' },
                        ...translatorsList.map((t) => ({ value: t.id, label: t.name }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      🏢 প্রকাশক
                    </label>
                    <CustomSelect
                      value={filterPublisher}
                      onChange={(val) => setFilterPublisher(val)}
                      options={[
                        { value: '', label: 'সব প্রকাশক' },
                        ...publishers.map((p) => ({ value: p.id, label: p.nameBn || p.name }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      🏷️ ক্যাটাগরি
                    </label>
                    <CustomSelect
                      value={filterCategory}
                      onChange={(val) => setFilterCategory(val)}
                      options={[
                        { value: '', label: 'সব ক্যাটাগরি' },
                        ...categories.map((c) => ({ value: c.id, label: `${c.icon ? c.icon + ' ' : ''}${c.nameBn || c.name}` }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📚 ধরন (Genre)
                    </label>
                    <CustomSelect
                      value={filterGenre}
                      onChange={(val) => setFilterGenre(val)}
                      options={[
                        { value: '', label: 'সব ধরন' },
                        ...genres.map((g) => ({ value: g.id, label: `${g.icon ? g.icon + ' ' : ''}${g.nameBn || g.name}` }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      🌐 ভাষা
                    </label>
                    <CustomSelect
                      value={filterLanguage}
                      onChange={(val) => setFilterLanguage(val)}
                      options={[
                        { value: '', label: 'সব ভাষা' },
                        ...languages.map((lang) => ({ value: lang, label: lang }))
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Ownership & Collection */}
              {activeTab === 'ownership' && (
                <div className="sort-filters-grid-3">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      👤 বইয়ের মালিক
                    </label>
                    <CustomSelect
                      value={filterOwner}
                      onChange={(val) => setFilterOwner(val)}
                      options={[
                        { value: '', label: 'সব মালিক' },
                        ...OWNERS.map((o) => ({ value: o.value, label: o.label }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📊 বর্তমান স্ট্যাটাস
                    </label>
                    <CustomSelect
                      value={filterStatus}
                      onChange={(val) => setFilterStatus(val)}
                      options={[
                        { value: '', label: 'সব স্ট্যাটাস' },
                        ...BOOK_STATUSES.map((s) => ({ value: s.value, label: `${s.icon} ${s.label}` }))
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📦 সংগ্রহের ধরন
                    </label>
                    <CustomSelect
                      value={filterPurchased}
                      onChange={(val) => setFilterPurchased(val)}
                      options={[
                        { value: 'all', label: 'সব বই (কেনা ও অ-কেনা)' },
                        { value: 'yes', label: 'ফিজিক্যাল কেনা কপি আছে' },
                        { value: 'no', label: 'সংগ্রহে নেই (ই-বুক / পিডিএফ / পড়তে চাই)' }
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ⭐ প্রিয় বই
                    </label>
                    <CustomSelect
                      value={filterFavorite ? 'fav' : 'all'}
                      onChange={(val) => setFilterFavorite(val === 'fav')}
                      options={[
                        { value: 'all', label: 'সব বই' },
                        { value: 'fav', label: '⭐ শুধুমাত্র প্রিয় বই' }
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      🏷️ বইয়ের অবস্থা
                    </label>
                    <CustomSelect
                      value={filterCondition}
                      onChange={(val) => setFilterCondition(val)}
                      options={[
                        { value: 'all', label: 'সব অবস্থা' },
                        { value: 'new', label: 'নতুন (New)' },
                        { value: 'used', label: 'পুরনো (Used)' },
                        { value: 'gift', label: 'উপহার (Gift)' }
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📍 কেনার উৎস
                    </label>
                    <CustomSelect
                      value={filterPurchaseSource}
                      onChange={(val) => setFilterPurchaseSource(val)}
                      options={[
                        { value: '', label: 'সব উৎস' },
                        ...purchaseSources.map((src) => ({ value: src, label: src }))
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Reading & Rating */}
              {activeTab === 'reading' && (
                <div className="sort-filters-grid-3">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ⭐ সর্বনিম্ন রেটিং
                    </label>
                    <CustomSelect
                      value={filterRating.toString()}
                      onChange={(val) => setFilterRating(Number(val))}
                      options={[
                        { value: '0', label: 'সব রেটিং' },
                        { value: '5', label: '⭐⭐⭐⭐⭐ (৫ স্টার)' },
                        { value: '4', label: '⭐⭐⭐⭐ (৪+ স্টার)' },
                        { value: '3', label: '⭐⭐⭐ (৩+ স্টার)' },
                        { value: '2', label: '⭐⭐ (২+ স্টার)' },
                        { value: '1', label: '⭐ (১+ স্টার)' }
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📈 পড়ার অগ্রগতি
                    </label>
                    <CustomSelect
                      value={filterProgress}
                      onChange={(val) => setFilterProgress(val)}
                      options={[
                        { value: 'all', label: 'সব অগ্রগতি' },
                        { value: 'finished', label: '✅ পড়া শেষ (১০০%)' },
                        { value: 'reading', label: '📖 বর্তমানে পড়ছি (১-৯৯%)' },
                        { value: 'unread', label: '⏳ এখনো পড়া শুরু হয়নি (০%)' }
                      ]}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                    <label className="form-checkbox" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={filterFavorite}
                        onChange={(e) => setFilterFavorite(e.target.checked)}
                      />
                      ⭐ প্রিয় বই (Favorites only)
                    </label>

                    <label className="form-checkbox" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={filterHasReview}
                        onChange={(e) => setFilterHasReview(e.target.checked)}
                      />
                      📝 নিজস্ব রিভিউ রয়েছে
                    </label>

                    <label className="form-checkbox" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={filterHasQuote}
                        onChange={(e) => setFilterHasQuote(e.target.checked)}
                      />
                      💬 পছন্দের উদ্ধৃতি যুক্ত আছে
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: Numbers & Ranges */}
              {activeTab === 'numbers' && (
                <div className="sort-filters-grid-3">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📅 প্রকাশের বছর (হতে - পর্যন্ত)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="শুরু (১৯৯০)"
                        className="filter-input"
                        value={filterYearMin}
                        onChange={(e) => setFilterYearMin(enToBnNumber(e.target.value.replace(/[^0-9০-৯]/g, '')))}
                      />
                      <span className="text-muted" style={{ fontWeight: 'bold' }}>—</span>
                      <input
                        type="text"
                        placeholder="শেষ (২০২৬)"
                        className="filter-input"
                        value={filterYearMax}
                        onChange={(e) => setFilterYearMax(enToBnNumber(e.target.value.replace(/[^0-9০-৯]/g, '')))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📄 পৃষ্ঠা সংখ্যা (কম - বেশি)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="কমপক্ষে (৫০)"
                        className="filter-input"
                        value={filterPageMin}
                        onChange={(e) => setFilterPageMin(enToBnNumber(e.target.value.replace(/[^0-9০-৯]/g, '')))}
                      />
                      <span className="text-muted" style={{ fontWeight: 'bold' }}>—</span>
                      <input
                        type="text"
                        placeholder="সর্বোচ্চ (১০০০)"
                        className="filter-input"
                        value={filterPageMax}
                        onChange={(e) => setFilterPageMax(enToBnNumber(e.target.value.replace(/[^0-9০-৯]/g, '')))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ৳ বইয়ের দাম (হতে - পর্যন্ত)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="ন্যূনতম ৳"
                        className="filter-input"
                        value={filterPriceMin}
                        onChange={(e) => setFilterPriceMin(enToBnNumber(e.target.value.replace(/[^0-9০-৯.]/g, '')))}
                      />
                      <span className="text-muted" style={{ fontWeight: 'bold' }}>—</span>
                      <input
                        type="text"
                        placeholder="সর্বোচ্চ ৳"
                        className="filter-input"
                        value={filterPriceMax}
                        onChange={(e) => setFilterPriceMax(enToBnNumber(e.target.value.replace(/[^0-9০-৯.]/g, '')))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>সক্রিয় ফিল্টার:</span>
              {activeFilters.map((chip) => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    background: 'rgba(79, 161, 115, 0.12)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(79, 161, 115, 0.25)',
                    fontWeight: 500,
                  }}
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.clear}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', fontSize: '0.85rem' }}
                    title="মুছুন"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearAllFilters}
                style={{ fontSize: '0.8rem', color: 'var(--danger)', height: '28px', padding: '0 8px' }}
              >
                ✕ সব ক্লিয়ার
              </button>
            </div>
          )}
        </div>

        {/* Results Counter & Active Sort Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            🔍 ফলাফল: <span style={{ color: 'var(--accent)' }}>{sortedBooks.length}</span> টি বই পাওয়া গেছে (মোট {books.length} টির মধ্যে)
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            সাজানো হয়েছে: <strong style={{ color: 'var(--text-secondary)' }}>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</strong> ({sortOrder === 'asc' ? 'A-Z / ছোট থেকে বড়' : 'Z-A / বড় থেকে ছোট'})
          </div>
        </div>

        {/* Results Content */}
        {sortedBooks.length === 0 ? (
          <div className="empty-state card" style={{ padding: '60px 20px', border: '1px solid var(--border)' }}>
            <div className="empty-icon" style={{ fontSize: '3rem' }}>🔍</div>
            <h3>কোনো বই পাওয়া যায়নি</h3>
            <p className="text-muted" style={{ maxWidth: '400px', margin: '8px auto 16px' }}>
              আপনার ফিল্টার বা অনুসন্ধানের শর্তাবলীর সাথে কোনো বই মেলেনি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
            </p>
            <button className="btn btn-primary" onClick={clearAllFilters}>
              ✕ সব ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="books-grid">
            {sortedBooks.map((book) => (
              <Link key={book.id} href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                <div className="book-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="book-cover">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} />
                    ) : (
                      <div className="book-cover-placeholder">
                        <span className="placeholder-icon">📖</span>
                        <span className="placeholder-title">{book.title}</span>
                      </div>
                    )}
                    <span className={`status-badge status-${book.status}`}>{book.status}</span>
                  </div>
                  <div className="book-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 className="book-title">{book.title}</h4>
                    <p className="book-author">
                      ✍🏻 {book.authorNameBn || book.authorName || 'অজানা লেখক'}
                    </p>
                    {book.translatorName && (
                      <p className="text-xs text-muted" style={{ margin: '2px 0' }}>
                        🔄 {book.translatorNameBn || book.translatorName}
                      </p>
                    )}
                    {book.publisherName && (
                      <p className="text-xs text-muted" style={{ margin: '2px 0' }}>
                        🏢 {book.publisherNameBn || book.publisherName}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {book.genreName && (
                        <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                          {book.genreIcon ? `${book.genreIcon} ` : ''}{book.genreNameBn || book.genreName}
                        </span>
                      )}
                      {book.categoryName && (
                        <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                          {book.categoryIcon ? `${book.categoryIcon} ` : ''}{book.categoryNameBn || book.categoryName}
                        </span>
                      )}
                    </div>
                    <div className="book-meta" style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="owner-badge">
                        {book.owner === 'swapnil' ? '⭐ স্বপ্নীল' : book.owner === 'bipro' ? '👤 বিপ্রতীব' : '👤 সৃজন'}
                      </span>
                      {book.rating ? (
                        <span style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 600 }}>⭐ {book.rating}</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: '260px' }}>বই ও লেখক</th>
                  <th style={{ minWidth: '140px' }}>প্রকাশক ও বছর</th>
                  <th style={{ minWidth: '130px' }}>ক্যাটাগরি ও ধরন</th>
                  <th style={{ minWidth: '120px' }}>মালিক ও স্ট্যাটাস</th>
                  <th style={{ minWidth: '90px' }}>রেটিং ও পৃষ্ঠা</th>
                  <th style={{ minWidth: '80px' }}>দাম</th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((book) => {
                  const isOwner = user?.id === book.owner;
                  return (
                    <tr key={book.id}>
                      {/* Column 1: Combined Book & Author details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '1rem', marginTop: '1px', opacity: 0.8 }}>📖</span>
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/dashboard/books/${book.id}`} className="font-serif" style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-serif)' }}>
                              <span>{book.title}</span>
                              {book.isFavorite && <span style={{ color: '#F59E0B' }}>⭐</span>}
                            </Link>
                            {book.titleOriginal && (
                              <div className="text-xs text-muted" style={{ fontStyle: 'italic' }}>{book.titleOriginal}</div>
                            )}
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              ✍🏻 {book.authorNameBn || book.authorName || '—'}
                              {book.translatorName && (
                                <span className="text-xs text-muted" style={{ marginLeft: '6px' }}>
                                  (🔄 {book.translatorNameBn || book.translatorName})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Publisher & Year */}
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {book.publisherNameBn || book.publisherName || '—'}
                        </div>
                        {book.publicationYear ? (
                          <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                            📅 {book.publicationYear} {book.edition && `• ${book.edition}`}
                          </div>
                        ) : null}
                      </td>

                      {/* Column 3: Category & Genre */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {book.genreName && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {book.genreIcon ? `${book.genreIcon} ` : '📚 '}{book.genreNameBn || book.genreName}
                            </span>
                          )}
                          {book.categoryName && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              🏷️ {book.categoryNameBn || book.categoryName}
                            </span>
                          )}
                          {!book.genreName && !book.categoryName && <span className="text-muted">—</span>}
                        </div>
                      </td>

                      {/* Column 4: Owner & Status */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="owner-badge">
                            {book.owner === 'swapnil' ? '⭐ স্বপ্নীল' : book.owner === 'bipro' ? '👤 বিপ্রতীব' : '👤 সৃজন'}
                          </span>
                          <span className={`status-badge status-${book.status}`} style={{ width: 'fit-content' }}>
                            {book.status}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Rating & Pages */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {book.rating ? (
                            <span style={{ fontWeight: 600, color: '#F59E0B', fontSize: '0.85rem' }}>
                              ⭐ {book.rating}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                          {book.pageCount ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {book.pageCount} পৃ.
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Column 6: Price */}
                      <td>
                        {book.purchaseFinalPrice ? (
                          <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.88rem' }}>
                            ৳{book.purchaseFinalPrice}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>বই মুছে ফেলুন</h3>
                <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
              </div>
              <div className="modal-body">
                <p>আপনি কি নিশ্চিত যে এই বইটি সংগ্রহ থেকে মুছে ফেলতে চান?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button>
                <button className="btn btn-danger" onClick={handleDelete}>মুছে ফেলুন</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
