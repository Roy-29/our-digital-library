'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BOOK_STATUSES, OWNERS, getOwnerLabel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

type ViewMode = 'list' | 'grid';

const SORT_OPTIONS = [
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
  { value: 'createdAt', label: 'সংগ্রহে যোগের তারিখ' },
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
  const [filterPurchasedBy, setFilterPurchasedBy] = useState('all');
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
  const [activeTab, setActiveTab] = useState<'all' | 'literature' | 'ownership' | 'reading' | 'numbers'>('literature');
  const [showFilters, setShowFilters] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Translators list extracted from books or authors who have been translators
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
      if (filterPurchasedBy !== 'all' && book.purchasedBy !== filterPurchasedBy) return false;
      if (filterPurchaseSource && book.purchaseSource !== filterPurchaseSource) return false;

      if (filterYearMin && (!book.publicationYear || book.publicationYear < parseInt(filterYearMin))) return false;
      if (filterYearMax && (!book.publicationYear || book.publicationYear > parseInt(filterYearMax))) return false;

      if (filterPageMin && (!book.pageCount || book.pageCount < parseInt(filterPageMin))) return false;
      if (filterPageMax && (!book.pageCount || book.pageCount > parseInt(filterPageMax))) return false;

      if (filterPriceMin && (!book.purchaseFinalPrice || book.purchaseFinalPrice < parseFloat(filterPriceMin))) return false;
      if (filterPriceMax && (!book.purchaseFinalPrice || book.purchaseFinalPrice > parseFloat(filterPriceMax))) return false;

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
    filterPurchasedBy,
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
    if (filterFavorite) list.push({ key: 'fav', label: `⭐ শুধু প্রিয় বই`, clear: () => setFilterFavorite(false) });
    if (filterPurchased !== 'all') {
      list.push({ key: 'purchased', label: filterPurchased === 'yes' ? 'সংগ্রহে আছে (কেনা)' : 'সংগ্রহে নেই', clear: () => setFilterPurchased('all') });
    }
    if (filterCondition !== 'all') list.push({ key: 'cond', label: `অবস্থা: ${filterCondition}`, clear: () => setFilterCondition('all') });
    if (filterPurchasedBy !== 'all') list.push({ key: 'purchasedBy', label: `কে কিনেছে: ${getOwnerLabel(filterPurchasedBy)}`, clear: () => setFilterPurchasedBy('all') });
    if (filterPurchaseSource) list.push({ key: 'src', label: `উৎস: ${filterPurchaseSource}`, clear: () => setFilterPurchaseSource('') });
    if (filterYearMin || filterYearMax) list.push({ key: 'year', label: `বছর: ${filterYearMin || '০'} - ${filterYearMax || 'বর্তমান'}`, clear: () => { setFilterYearMin(''); setFilterYearMax(''); } });
    if (filterPageMin || filterPageMax) list.push({ key: 'page', label: `পৃষ্ঠা: ${filterPageMin || '০'} - ${filterPageMax || '∞'}`, clear: () => { setFilterPageMin(''); setFilterPageMax(''); } });
    if (filterPriceMin || filterPriceMax) list.push({ key: 'price', label: `দাম: ৳${filterPriceMin || '০'} - ৳${filterPriceMax || '∞'}`, clear: () => { setFilterPriceMin(''); setFilterPriceMax(''); } });
    if (filterHasReview) list.push({ key: 'hasRev', label: `রিভিউ আছে`, clear: () => setFilterHasReview(false) });
    if (filterHasQuote) list.push({ key: 'hasQuote', label: `উদ্ধৃতি আছে`, clear: () => setFilterHasQuote(false) });

    return list;
  }, [
    search, filterOwner, filterStatus, filterAuthor, filterTranslator, filterPublisher, filterCategory, filterGenre,
    filterLanguage, filterRating, filterProgress, filterFavorite, filterPurchased, filterCondition, filterPurchasedBy,
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
    setFilterPurchasedBy('all');
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
      <div className="page-header">
        <div>
          <h2>🔀 বই বাছাইকরণ ও অনুসন্ধান</h2>
          <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
            ফর্মের যেকোনো ফিল্ড অনুযায়ী বই খুঁজুন, ফিল্টার করুন এবং সাজান
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              📋 List
            </button>
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              🔲 Grid
            </button>
          </div>
          <Link href="/dashboard/books/add" className="btn btn-primary">
            ➕ বই যোগ
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Main Controls Card */}
        <div className="card" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--border)' }}>
          {/* Top Sort & Search Toolbar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            {/* Search Input */}
            <div className="books-search-box" style={{ flex: '1 1 280px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="যেকোনো তথ্য লিখুন (বই, লেখক, অনুবাদক, প্রকাশক, নোট...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>✕</button>
              )}
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>সাজান:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="minimal-select"
                style={{ fontWeight: 500 }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'ছোট থেকে বড় / ঊর্ধ্বক্রম' : 'বড় থেকে ছোট / নিম্নক্রম'}
                style={{ height: '38px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {sortOrder === 'asc' ? '🔼 ঊর্ধ্বক্রম (A-Z)' : '🔽 নিম্নক্রম (Z-A)'}
              </button>

              <button
                type="button"
                className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowFilters(!showFilters)}
                style={{ height: '38px', padding: '0 14px' }}
              >
                ⚙️ {showFilters ? 'ফিল্টার লুকান' : 'ফিল্টার প্যানেল'} {activeFilters.length > 0 && `(${activeFilters.length})`}
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters Section */}
          {showFilters && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'literature' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('literature')}
                  style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.82rem' }}
                >
                  📚 সাহিত্য ও প্রকাশনা
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'ownership' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('ownership')}
                  style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.82rem' }}
                >
                  👤 মালিকানা ও সংগ্রহ
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'reading' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('reading')}
                  style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.82rem' }}
                >
                  📖 পড়া ও রেটিং
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'numbers' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('numbers')}
                  style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.82rem' }}
                >
                  🔢 পৃষ্ঠা, বছর ও দাম
                </button>
              </div>

              {/* Tab 1: Literature & Publishing */}
              {activeTab === 'literature' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>✍️ লেখক</label>
                    <select
                      className="form-select"
                      value={filterAuthor}
                      onChange={(e) => setFilterAuthor(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব লেখক</option>
                      {authors.map((a) => (
                        <option key={a.id} value={a.id}>{a.nameBn || a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>🔄 অনুবাদক</label>
                    <select
                      className="form-select"
                      value={filterTranslator}
                      onChange={(e) => setFilterTranslator(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব (অনূদিত/মৌলিক)</option>
                      <option value="__has_translator__">✨ শুধুমাত্র অনূদিত বই</option>
                      {translatorsList.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>🏢 প্রকাশক</label>
                    <select
                      className="form-select"
                      value={filterPublisher}
                      onChange={(e) => setFilterPublisher(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব প্রকাশক</option>
                      {publishers.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameBn || p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>🏷️ ক্যাটাগরি</label>
                    <select
                      className="form-select"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব ক্যাটাগরি</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.nameBn || c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📚 ধরন (Genre)</label>
                    <select
                      className="form-select"
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব ধরন</option>
                      {genres.map((g) => (
                        <option key={g.id} value={g.id}>{g.icon ? `${g.icon} ` : ''}{g.nameBn || g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>🌐 ভাষা</label>
                    <select
                      className="form-select"
                      value={filterLanguage}
                      onChange={(e) => setFilterLanguage(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব ভাষা</option>
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 2: Ownership & Collection */}
              {activeTab === 'ownership' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>👤 মালিক</label>
                    <select
                      className="form-select"
                      value={filterOwner}
                      onChange={(e) => setFilterOwner(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব মালিক</option>
                      {OWNERS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📊 স্ট্যাটাস</label>
                    <select
                      className="form-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব স্ট্যাটাস</option>
                      {BOOK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📦 সংগ্রহের ধরন</label>
                    <select
                      className="form-select"
                      value={filterPurchased}
                      onChange={(e) => setFilterPurchased(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="all">সব বই</option>
                      <option value="yes">ফিজিক্যাল কপি কেনা আছে</option>
                      <option value="no">সংগ্রহে নেই (ই-বুক / পিডিএফ / পড়তে চাই)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>🛒 কে কিনেছে</label>
                    <select
                      className="form-select"
                      value={filterPurchasedBy}
                      onChange={(e) => setFilterPurchasedBy(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="all">সবাই</option>
                      {OWNERS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>🏷️ বইয়ের অবস্থা</label>
                    <select
                      className="form-select"
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="all">সব অবস্থা</option>
                      <option value="new">নতুন (New)</option>
                      <option value="used">পুরনো (Used)</option>
                      <option value="gift">উপহার (Gift)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📍 কেনার উৎস</label>
                    <select
                      className="form-select"
                      value={filterPurchaseSource}
                      onChange={(e) => setFilterPurchaseSource(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="">সব উৎস</option>
                      {purchaseSources.map((src) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 3: Reading & Rating */}
              {activeTab === 'reading' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>⭐ সর্বনিম্ন রেটিং</label>
                    <select
                      className="form-select"
                      value={filterRating}
                      onChange={(e) => setFilterRating(Number(e.target.value))}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value={0}>সব রেটিং</option>
                      <option value={5}>⭐⭐⭐⭐⭐ (৫ স্টার)</option>
                      <option value={4}>⭐⭐⭐⭐ (৪+ স্টার)</option>
                      <option value={3}>⭐⭐⭐ (৩+ স্টার)</option>
                      <option value={2}>⭐⭐ (২+ স্টার)</option>
                      <option value={1}>⭐ (১+ স্টার)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📈 পড়ার অগ্রগতি</label>
                    <select
                      className="form-select"
                      value={filterProgress}
                      onChange={(e) => setFilterProgress(e.target.value)}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="all">সব অগ্রগতি</option>
                      <option value="finished">✅ পড়া শেষ (১০০%)</option>
                      <option value="reading">📖 বর্তমানে পড়ছি (১-৯৯%)</option>
                      <option value="unread">⏳ এখনো পড়া শুরু হয়নি (০%)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                    <label className="form-checkbox" style={{ fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={filterFavorite}
                        onChange={(e) => setFilterFavorite(e.target.checked)}
                      />
                      ⭐ প্রিয় বই (Favorites only)
                    </label>

                    <label className="form-checkbox" style={{ fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={filterHasReview}
                        onChange={(e) => setFilterHasReview(e.target.checked)}
                      />
                      📝 নিজস্ব রিভিউ রয়েছে
                    </label>

                    <label className="form-checkbox" style={{ fontSize: '0.85rem' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📅 প্রকাশের বছর (হতে - পর্যন্ত)</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="শুরু (১৯৯০)"
                        className="form-input"
                        value={filterYearMin}
                        onChange={(e) => setFilterYearMin(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                      <span className="text-muted">-</span>
                      <input
                        type="number"
                        placeholder="শেষ (২০২৬)"
                        className="form-input"
                        value={filterYearMax}
                        onChange={(e) => setFilterYearMax(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>📄 পৃষ্ঠা সংখ্যা (কম - বেশি)</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="কমপক্ষে (৫০)"
                        className="form-input"
                        value={filterPageMin}
                        onChange={(e) => setFilterPageMin(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                      <span className="text-muted">-</span>
                      <input
                        type="number"
                        placeholder="সর্বোচ্চ (১০০০)"
                        className="form-input"
                        value={filterPageMax}
                        onChange={(e) => setFilterPageMax(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>৳ বইয়ের দাম (হতে - পর্যন্ত)</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="ন্যূনতম ৳"
                        className="form-input"
                        value={filterPriceMin}
                        onChange={(e) => setFilterPriceMin(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                      <span className="text-muted">-</span>
                      <input
                        type="number"
                        placeholder="সর্বোচ্চ ৳"
                        className="form-input"
                        value={filterPriceMax}
                        onChange={(e) => setFilterPriceMax(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>সক্রিয় ফিল্টার:</span>
              {activeFilters.map((chip) => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
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
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem' }}
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
                style={{ fontSize: '0.78rem', color: 'var(--danger)', height: '28px', padding: '0 8px' }}
              >
                ✕ সব রিসেট
              </button>
            </div>
          )}
        </div>

        {/* Results Count & Current Sort Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            🔍 ফলাফল: <span style={{ color: 'var(--accent)' }}>{sortedBooks.length}</span> টি বই পাওয়া গেছে (মোট {books.length} টির মধ্যে)
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            সাজানো হয়েছে: <strong>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</strong> ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
          </div>
        </div>

        {/* Results Rendering */}
        {sortedBooks.length === 0 ? (
          <div className="empty-state card" style={{ padding: '60px 20px', border: '1px solid var(--border)' }}>
            <div className="empty-icon" style={{ fontSize: '3rem' }}>🔍</div>
            <h3>কোনো বই পাওয়া যায়নি</h3>
            <p className="text-muted" style={{ maxWidth: '400px', margin: '8px auto 16px' }}>
              আপনার নির্বাচিত ফিল্টার বা অনুসন্ধানের শর্তাবলীর সাথে কোনো বই মেলেনি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
            </p>
            <button className="btn btn-primary" onClick={clearAllFilters}>
              ✕ সব ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="books-grid">
            {sortedBooks.map((book) => (
              <Link key={book.id} href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                <div className="book-card">
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
                  <div className="book-info">
                    <h4 className="book-title">{book.title}</h4>
                    <p className="book-author">
                      ✍️ {book.authorNameBn || book.authorName || 'অজানা লেখক'}
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
                    <div className="book-meta" style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="owner-badge">
                        {book.owner === 'swapnil' ? '⭐ স্বপ্নীল' : book.owner === 'bipro' ? '👤 বিপ্রতীব' : '👤 সৃজন'}
                      </span>
                      {book.rating ? (
                        <span style={{ fontSize: '0.8rem', color: '#F59E0B' }}>⭐ {book.rating}</span>
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
                  <th style={{ width: '50px' }}>কভার</th>
                  <th>বইয়ের নাম</th>
                  <th>লেখক ও অনুবাদক</th>
                  <th>প্রকাশক</th>
                  <th>ক্যাটাগরি ও ধরন</th>
                  <th>মালিক</th>
                  <th>স্ট্যাটাস</th>
                  <th>রেটিং</th>
                  <th>পৃষ্ঠা / বছর</th>
                  <th>দাম</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((book) => {
                  const isOwner = user?.id === book.owner;
                  return (
                    <tr key={book.id}>
                      <td>
                        <div style={{ width: '38px', height: '52px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.1rem' }}>📖</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Link href={`/dashboard/books/${book.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {book.title}
                        </Link>
                        {book.titleOriginal && (
                          <div className="text-xs text-muted">{book.titleOriginal}</div>
                        )}
                        {book.isFavorite && <span style={{ marginLeft: '4px', color: '#F59E0B' }}>⭐</span>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {book.authorNameBn || book.authorName || '—'}
                        </div>
                        {book.translatorName && (
                          <div className="text-xs text-muted">
                            🔄 {book.translatorNameBn || book.translatorName}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>
                          {book.publisherNameBn || book.publisherName || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {book.genreName && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {book.genreIcon ? `${book.genreIcon} ` : '📚 '}{book.genreNameBn || book.genreName}
                            </span>
                          )}
                          {book.categoryName && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              🏷️ {book.categoryNameBn || book.categoryName}
                            </span>
                          )}
                          {!book.genreName && !book.categoryName && <span className="text-muted">—</span>}
                        </div>
                      </td>
                      <td>
                        <span className="owner-badge">
                          {book.owner === 'swapnil' ? '⭐ স্বপ্নীল' : book.owner === 'bipro' ? '👤 বিপ্রতীব' : '👤 সৃজন'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${book.status}`}>
                          {book.status}
                        </span>
                      </td>
                      <td>
                        {book.rating ? (
                          <span style={{ fontWeight: 600, color: '#F59E0B' }}>⭐ {book.rating}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          {book.pageCount ? `${book.pageCount} পৃ.` : '—'}
                        </div>
                        {book.publicationYear && (
                          <div className="text-xs text-muted">{book.publicationYear}</div>
                        )}
                      </td>
                      <td>
                        {book.purchaseFinalPrice ? (
                          <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.85rem' }}>
                            ৳{book.purchaseFinalPrice}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <Link href={`/dashboard/books/${book.id}`} className="btn-icon" title="বিস্তারিত দেখুন">
                            👁️
                          </Link>
                          {isOwner && (
                            <Link href={`/dashboard/books/${book.id}/edit`} className="btn-icon" title="সম্পাদনা">
                              ✏️
                            </Link>
                          )}
                          {isOwner && (
                            <button
                              className="btn-icon text-danger"
                              onClick={() => setDeleteId(book.id)}
                              title="মুছে ফেলুন"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
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
