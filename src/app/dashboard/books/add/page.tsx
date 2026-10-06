'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Author, Publisher, Category, Genre, Room, Shelf, Rack, BOOK_STATUSES, READING_STATUSES, OWNERS, BookStatus, ReadingStatus, BookOwner, BookCondition, getOwnerLabel, enToBnNumber, bnToEnNumber } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
// @ts-ignore
import * as ISBN from 'isbn3';
import { BanglaDateInput } from '@/components/BanglaDateInput';

export default function AddBookPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  // Reference data
  const [allPersons, setAllPersons] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  // Unique sorted lists for datalist dropdowns
  const uniqueAuthors = useMemo(() => {
    const set = new Set<string>();
    allPersons
      .filter((a: any) => a.is_author !== 0 && a.is_author !== false && a.isAuthor !== 0 && a.isAuthor !== false)
      .forEach((a) => {
        const bn = a.name_bn?.trim();
        const en = a.name?.trim();
        if (bn) set.add(bn);
        if (en) set.add(en);
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [allPersons]);

  const uniqueTranslators = useMemo(() => {
    const set = new Set<string>();
    allPersons
      .filter((t: any) => t.is_translator === 1 || t.is_translator === true || t.isTranslator === 1 || t.isTranslator === true)
      .forEach((t) => {
        const bn = t.name_bn?.trim();
        const en = t.name?.trim();
        if (bn) set.add(bn);
        if (en) set.add(en);
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [allPersons]);

  const uniqueIllustrators = useMemo(() => {
    const set = new Set<string>();
    allPersons
      .filter((i: any) => i.is_illustrator === 1 || i.is_illustrator === true || i.isIllustrator === 1 || i.isIllustrator === true)
      .forEach((i) => {
        const bn = i.name_bn?.trim();
        const en = i.name?.trim();
        if (bn) set.add(bn);
        if (en) set.add(en);
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [allPersons]);

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

  // Form state
  const [title, setTitle] = useState('');
  const [titleOriginal, setTitleOriginal] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [language, setLanguage] = useState('বাংলা');
  const [isCustomLanguage, setIsCustomLanguage] = useState(false);
  const [edition, setEdition] = useState('');
  const [pubYear, setPubYear] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [translatorId, setTranslatorId] = useState('');
  const [illustratorId, setIllustratorId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [genreId, setGenreId] = useState('');
  const [copies, setCopies] = useState(1);
  const [isCustomCopies, setIsCustomCopies] = useState(false);
  const [owner, setOwner] = useState<BookOwner>('swapnil');
  const [status, setStatus] = useState<BookStatus>('আছে');
  const [isPurchased, setIsPurchased] = useState(true);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseSource, setPurchaseSource] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDiscountPercent, setPurchaseDiscountPercent] = useState('');
  const [purchaseDiscount, setPurchaseDiscount] = useState('');
  const [purchaseFinalPrice, setPurchaseFinalPrice] = useState('');
  const [bookCondition, setBookCondition] = useState<BookCondition>('new');
  const [printType, setPrintType] = useState('');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus | ''>('');
  const [readingStartDate, setReadingStartDate] = useState('');
  const [readingFinishDate, setReadingFinishDate] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [notes, setNotes] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [parentBookId, setParentBookId] = useState<string | null>(null);
  const [duplicateBookSuggestion, setDuplicateBookSuggestion] = useState<any | null>(null);

  useEffect(() => {
    if (!title || title.trim().length < 2 || !user) {
      setDuplicateBookSuggestion(null);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('books')
          .select('*, author:authors(name, name_bn), publisher:publishers(name, name_bn)')
          .ilike('title', title.trim())
          .neq('owner', user.id)
          .limit(1)
          .single();
          
        if (data) {
          setDuplicateBookSuggestion(data);
        } else {
          setDuplicateBookSuggestion(null);
        }
      } catch (err) {
        setDuplicateBookSuggestion(null);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [title, user]);

  const copyDuplicateBookDetails = () => {
    if (!duplicateBookSuggestion) return;
    const b = duplicateBookSuggestion;
    
    if (b.title_original) setTitleOriginal(b.title_original);
    if (b.subtitle) setSubtitle(b.subtitle);
    if (b.isbn) setIsbn(b.isbn);
    if (b.language) setLanguage(b.language);
    if (b.edition) setEdition(b.edition);
    if (b.publication_year) setPubYear(b.publication_year.toString());
    if (b.page_count) setPageCount(b.page_count.toString());
    if (b.description) setDescription(b.description);
    if (b.cover_url) setCoverUrl(b.cover_url);
    if (b.author_id) setAuthorId(b.author_id);
    if (b.translator_id) setTranslatorId(b.translator_id);
    if (b.illustrator_id) setIllustratorId(b.illustrator_id);
    if (b.publisher_id) setPublisherId(b.publisher_id);
    if (b.category_id) setCategoryId(b.category_id);
    if (b.genre_id) setGenreId(b.genre_id);
    
    setParentBookId(b.id);
    setDuplicateBookSuggestion(null);
    toast.success('বইয়ের তথ্য কপি করা হয়েছে!');
  };

  const formatPriceNum = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) return '';
    return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  };

  const handlePriceChange = (val: string) => {
    const cleanVal = enToBnNumber(val.replace(/[^0-9০-৯.]/g, ''));
    setPurchasePrice(cleanVal);
    const p = parseFloat(bnToEnNumber(cleanVal));

    if (!isNaN(p) && p > 0) {
      const pct = parseFloat(bnToEnNumber(purchaseDiscountPercent));
      const d = parseFloat(bnToEnNumber(purchaseDiscount));
      
      if (!isNaN(pct) && pct > 0) {
        const newD = (p * pct) / 100;
        const newF = Math.max(0, p - newD);
        setPurchaseDiscount(enToBnNumber(formatPriceNum(newD)));
        setPurchaseFinalPrice(enToBnNumber(formatPriceNum(newF)));
      } else if (!isNaN(d) && d > 0) {
        const newF = Math.max(0, p - d);
        const newPct = (d / p) * 100;
        setPurchaseFinalPrice(enToBnNumber(formatPriceNum(newF)));
        setPurchaseDiscountPercent(enToBnNumber(formatPriceNum(newPct)));
      } else {
        if (!purchaseFinalPrice || purchaseFinalPrice === purchasePrice) {
          setPurchaseFinalPrice(cleanVal);
        }
      }
    } else if (!cleanVal) {
      if (purchaseDiscountPercent) {
        setPurchaseDiscount('');
        setPurchaseFinalPrice('');
      }
    }
  };

  const handleDiscountPercentChange = (val: string) => {
    const cleanVal = enToBnNumber(val.replace(/[^0-9০-৯.]/g, ''));
    setPurchaseDiscountPercent(cleanVal);
    const pct = parseFloat(bnToEnNumber(cleanVal));
    const p = parseFloat(bnToEnNumber(purchasePrice));

    if (!isNaN(pct) && pct >= 0) {
      if (!isNaN(p) && p > 0) {
        const d = (p * pct) / 100;
        const f = Math.max(0, p - d);
        setPurchaseDiscount(enToBnNumber(formatPriceNum(d)));
        setPurchaseFinalPrice(enToBnNumber(formatPriceNum(f)));
      }
    } else {
      setPurchaseDiscount('');
      if (!isNaN(p) && p > 0) {
        setPurchaseFinalPrice(enToBnNumber(formatPriceNum(p)));
      }
    }
  };

  const handleDiscountAmountChange = (val: string) => {
    const cleanVal = enToBnNumber(val.replace(/[^0-9০-৯.]/g, ''));
    setPurchaseDiscount(cleanVal);
    const d = parseFloat(bnToEnNumber(cleanVal));
    const p = parseFloat(bnToEnNumber(purchasePrice));

    if (!isNaN(d) && d >= 0) {
      if (!isNaN(p) && p > 0) {
        const f = Math.max(0, p - d);
        const pct = (d / p) * 100;
        setPurchaseFinalPrice(enToBnNumber(formatPriceNum(f)));
        setPurchaseDiscountPercent(enToBnNumber(formatPriceNum(pct)));
      }
    } else {
      setPurchaseDiscountPercent('');
      if (!isNaN(p) && p > 0) {
        setPurchaseFinalPrice(enToBnNumber(formatPriceNum(p)));
      }
    }
  };

  const handleFinalPriceChange = (val: string) => {
    const cleanVal = enToBnNumber(val.replace(/[^0-9০-৯.]/g, ''));
    setPurchaseFinalPrice(cleanVal);
    const f = parseFloat(bnToEnNumber(cleanVal));
    const p = parseFloat(bnToEnNumber(purchasePrice));

    if (!isNaN(f) && !isNaN(p) && p > 0) {
      const d = Math.max(0, p - f);
      const pct = (d / p) * 100;
      setPurchaseDiscount(enToBnNumber(formatPriceNum(d)));
      setPurchaseDiscountPercent(enToBnNumber(formatPriceNum(pct)));
    }
  };

  const handleNumericInput = (inputVal: string, setter: (val: string) => void, maxLength?: number) => {
    const englishVal = bnToEnNumber(inputVal);
    let cleanVal = englishVal.replace(/\D/g, '');
    if (maxLength) {
      cleanVal = cleanVal.slice(0, maxLength);
    }
    setter(cleanVal);
  };

  const handleIsbnChange = (inputVal: string, setter: (val: string) => void) => {
    let cleanVal = inputVal.replace(/[^0-9Xx-]/g, '');
    let numOnly = cleanVal.replace(/-/g, '');
    
    if (numOnly.length > 13) {
      numOnly = numOnly.slice(0, 13);
      cleanVal = numOnly;
    }

    if (numOnly.length === 10 || numOnly.length === 13) {
      const parsed = ISBN.parse(numOnly);
      if (parsed) {
        cleanVal = (parsed.isIsbn13 ? parsed.isbn13h : parsed.isbn10h) || cleanVal;
      } else {
        const audited = ISBN.audit(numOnly);
        if (audited && audited.clues && audited.clues.length > 0) {
          const clue = audited.clues.find((c: any) => c.candidate);
          if (clue && clue.candidate) {
            const is13 = numOnly.length === 13;
            const candidateStr = is13 ? (clue.candidate as any).isbn13h : (clue.candidate as any).isbn10h;
            if (candidateStr) {
              cleanVal = candidateStr.slice(0, -1) + numOnly.slice(-1).toUpperCase();
            }
          } else {
            if (numOnly.length === 13) {
              cleanVal = numOnly.replace(/^(\d{3})(\d)(\d{4})(\d{4})(\d)$/, '$1-$2-$3-$4-$5');
            } else {
              cleanVal = numOnly.replace(/^(\d)(\d{4})(\d{4})([\dXx])$/, '$1-$2-$3-$4').toUpperCase();
            }
          }
        } else {
          if (numOnly.length === 13) {
            cleanVal = numOnly.replace(/^(\d{3})(\d)(\d{4})(\d{4})(\d)$/, '$1-$2-$3-$4-$5');
          } else {
            cleanVal = numOnly.replace(/^(\d)(\d{4})(\d{4})([\dXx])$/, '$1-$2-$3-$4').toUpperCase();
          }
        }
      }
    }
    setter(cleanVal);
  };

  useEffect(() => {
    if (user?.id) {
      setOwner(user.id as BookOwner);
    }
  }, [user]);

  useEffect(() => {
    fetchReferenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReferenceData = async () => {
    const [a, p, c, g] = await Promise.all([
      supabase.from('authors').select('*').order('name'),
      supabase.from('publishers').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('genres').select('*').order('name'),
    ]);
    if (a.data) setAllPersons(a.data);
    if (p.data) setPublishers(p.data);
    if (c.data) setCategories(c.data);
    if (g.data) setGenres(g.data);
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

    // Check for duplicate title for the same owner
    const { data: dupBooks, error: dupError } = await supabase
      .from('books')
      .select('id, copies')
      .eq('title', title.trim())
      .eq('owner', owner);

    if (dupError) {
      toast.error('ডুপ্লিকেট চেক করতে ত্রুটি: ' + dupError.message);
      return;
    }

    if (dupBooks && dupBooks.length > 0) {
      const existingBook = dupBooks[0];
      const currentCopies = existingBook.copies || 1;
      const confirmAdd = window.confirm(
        `এই নামের একটি বই ইতিমধ্যে আপনার সংগ্রহে আছে (বর্তমান কপি: ${currentCopies})। আপনি কি এর সাথে আরও ${copies}টি কপি যোগ করতে চান?`
      );
      if (!confirmAdd) {
        return;
      }
      
      // Update copies count
      setSaving(true);
      const { error: updateError } = await supabase
        .from('books')
        .update({ copies: currentCopies + copies })
        .eq('id', existingBook.id);
        
      if (updateError) {
        toast.error('কপি যোগ করতে সমস্যা হয়েছে');
        setSaving(false);
        return;
      }
      
      toast.success('আরেকটি কপি সফলভাবে যোগ হয়েছে ✅');
      router.push(`/dashboard/books/${existingBook.id}`);
      return;
    }

    setSaving(true);
    
    const resolveAuthor = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = allPersons.find(
        a => (a.name_bn && a.name_bn.trim().toLowerCase() === lower) ||
             (a.name && a.name.trim().toLowerCase() === lower)
      );
      if (existing) {
        if ((existing as any).is_author === 0 || (existing as any).isAuthor === 0) {
          await supabase.from('authors').update({ is_author: 1 }).eq('id', existing.id);
        }
        return existing.id;
      }
      
      const { data } = await supabase.from('authors').insert({ name_bn: t, name: t, is_author: 1, is_translator: 0 });
      if (data?.id) return data.id;
      
      const { data: all } = await supabase.from('authors').select('*');
      const found = (all as any[])?.find(
        a => (a.name_bn && a.name_bn.trim().toLowerCase() === lower) ||
             (a.name && a.name.trim().toLowerCase() === lower)
      );
      return found?.id || null;
    };

    const resolveTranslator = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = allPersons.find(
        p => (p.name_bn && p.name_bn.trim().toLowerCase() === lower) ||
             (p.name && p.name.trim().toLowerCase() === lower)
      );
      if (existing) {
        if ((existing as any).is_translator !== 1 && (existing as any).isTranslator !== 1) {
          await supabase.from('authors').update({ is_translator: 1 }).eq('id', existing.id);
        }
        return existing.id;
      }
      
      // Explicitly is_author = 0, is_translator = 1 so they are NEVER added to authors!
      const { data } = await supabase.from('authors').insert({ name_bn: t, name: t, is_author: 0, is_translator: 1 });
      if (data?.id) return data.id;

      const { data: all } = await supabase.from('authors').select('*');
      const found = (all as any[])?.find(
        p => (p.name_bn && p.name_bn.trim().toLowerCase() === lower) ||
             (p.name && p.name.trim().toLowerCase() === lower)
      );
      return found?.id || null;
      return found?.id || null;
    };
    
    const resolveIllustrator = async (name: string) => {
      if (!name) return null;
      const t = name.trim().replace(/\s+/g, ' ');
      if (!t) return null;
      const lower = t.toLowerCase();
      const existing = allPersons.find(
        p => (p.name_bn && p.name_bn.trim().toLowerCase() === lower) ||
             (p.name && p.name.trim().toLowerCase() === lower)
      );
      if (existing) {
        if ((existing as any).is_illustrator !== 1 && (existing as any).isIllustrator !== 1) {
          await supabase.from('authors').update({ is_illustrator: 1 }).eq('id', existing.id);
        }
        return existing.id;
      }
      
      const { data } = await supabase.from('authors').insert({ name_bn: t, name: t, is_author: 0, is_translator: 0, is_illustrator: 1 });
      if (data?.id) return data.id;

      const { data: all } = await supabase.from('authors').select('*');
      const found = (all as any[])?.find(
        p => (p.name_bn && p.name_bn.trim().toLowerCase() === lower) ||
             (p.name && p.name.trim().toLowerCase() === lower)
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
    const finalTranslatorId = await resolveTranslator(translatorId);
    const finalIllustratorId = await resolveIllustrator(illustratorId);
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
      publication_year: pubYear ? parseInt(bnToEnNumber(pubYear)) : null,
      page_count: pageCount ? parseInt(bnToEnNumber(pageCount)) : null,
      description: description || null,
      cover_url: uploadedCoverUrl,
      author_id: finalAuthorId || null,
      translator_id: finalTranslatorId || null,
      illustrator_id: finalIllustratorId || null,
      publisher_id: finalPublisherId || null,
      category_id: finalCategoryId || null,
      genre_id: finalGenreId || null,
      owner: (user?.id as BookOwner) || owner,
      status,
      is_purchased: isPurchased,
      purchase_date: purchaseDate || null,
      purchase_source: purchaseSource || null,
      purchase_price: purchasePrice ? parseFloat(bnToEnNumber(purchasePrice)) : null,
      purchase_discount: purchaseDiscount ? parseFloat(bnToEnNumber(purchaseDiscount)) : null,
      purchase_final_price: purchaseFinalPrice ? parseFloat(bnToEnNumber(purchaseFinalPrice)) : null,
      purchased_by: owner || user?.id || null,
      book_condition: bookCondition,
      print_type: printType.trim() || null,
      reading_status: readingStatus || null,
      reading_start_date: readingStartDate || null,
      reading_finish_date: readingFinishDate || null,
      reading_progress: readingProgress,
      rating: rating || null,
      review: review || null,
      notes: notes || null,
      favorite_quote: favoriteQuote || null,
      is_favorite: isFavorite,
      copies,
      parent_book_id: parentBookId,
      added_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === 'Enter' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
      e.preventDefault();
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 style={{ fontFamily: 'var(--font-serif)' }} className="font-serif">➕ নতুন বই যোগ করুন</h2>
        <button className="btn btn-secondary" onClick={() => router.back()}>← ফিরে যান</button>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="form-sections" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
<div className="card">
              <div className="card-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>📋 মূল তথ্য</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">বইয়ের নাম *</label>
                  <input className="form-input font-serif" style={{ fontFamily: 'var(--font-serif)' }} value={title} onChange={e => setTitle(e.target.value)} placeholder="বইয়ের নাম লিখুন" required />
                  
                  {duplicateBookSuggestion && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        <strong style={{ fontFamily: 'var(--font-serif)' }}>{duplicateBookSuggestion.title}</strong> বইটি ইতিমধ্যে <strong>{getOwnerLabel(duplicateBookSuggestion.owner)}</strong>-এর সংগ্রহে আছে!
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        আপনি কি বইটির কভার ছবি, লেখক, প্রকাশক এবং অন্যান্য তথ্য কপি করে ফর্মটি পূরণ করতে চান?
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button 
                          type="button" 
                          onClick={copyDuplicateBookDetails}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.85rem'
                          }}
                        >
                          ✅ তথ্যগুলো কপি করুন
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setDuplicateBookSuggestion(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          না, ধন্যবাদ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">কপির সংখ্যা</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        className="form-select font-serif" 
                        value={isCustomCopies ? 'custom' : copies} 
                        onChange={e => {
                          if (e.target.value === 'custom') {
                            setIsCustomCopies(true);
                          } else {
                            setIsCustomCopies(false);
                            setCopies(parseInt(e.target.value));
                          }
                        }}
                        style={{ fontFamily: 'var(--font-serif)', flex: 1 }}
                      >
                        <option value={1} style={{ fontFamily: 'var(--font-serif)' }}>১ কপি</option>
                        <option value={2} style={{ fontFamily: 'var(--font-serif)' }}>২ কপি</option>
                        <option value={3} style={{ fontFamily: 'var(--font-serif)' }}>৩ কপি</option>
                        <option value={4} style={{ fontFamily: 'var(--font-serif)' }}>৪ কপি</option>
                        <option value={5} style={{ fontFamily: 'var(--font-serif)' }}>৫ কপি</option>
                        <option value="custom" style={{ fontFamily: 'var(--font-serif)' }}>✏️ নিজের সংখ্যা লিখুন...</option>
                      </select>
                      {isCustomCopies && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            className="form-input font-serif"
                            type="text"
                            inputMode="numeric"
                            value={copies === 0 ? '' : enToBnNumber(copies.toString())}
                            onChange={e => handleNumericInput(e.target.value, val => setCopies(val ? parseInt(val) : 0))}
                            placeholder="সংখ্যা"
                            style={{ fontFamily: 'var(--font-serif)', width: '90px' }}
                            autoFocus
                          />
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>কপি</span>
                        </div>
                      )}
                    </div>
                  </div>
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
                    <label className="form-label">✍🏻 লেখক</label>
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
                    <label className="form-label">🎨 আঁকিয়ে (Illustrator)</label>
                    <input 
                      className="form-input" 
                      value={illustratorId} 
                      onChange={e => setIllustratorId(e.target.value)} 
                      list="illustrator-options"
                      placeholder="আঁকিয়ের নাম লিখুন বা নির্বাচন করুন" 
                    />
                    <datalist id="illustrator-options">
                      {uniqueIllustrators.map(name => (
                        <option key={`ill-${name}`} value={name} />
                      ))}
                    </datalist>
                  </div>
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
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ISBN</label>
                    <input className="form-input" value={isbn} onChange={e => handleIsbnChange(e.target.value, setIsbn)} placeholder="978-..." maxLength={17} />
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
                    <div style={{ display: 'flex', flexDirection: isCustomLanguage ? 'column' : 'row', gap: '8px' }}>
                      <select 
                        className="form-select" 
                        value={isCustomLanguage ? 'custom' : (['বাংলা', 'English'].includes(language) ? language : 'custom')} 
                        onChange={e => {
                          if (e.target.value === 'custom') {
                            setIsCustomLanguage(true);
                            if (language === 'বাংলা' || language === 'English') {
                              setLanguage('');
                            }
                          } else {
                            setIsCustomLanguage(false);
                            setLanguage(e.target.value);
                          }
                        }}
                        style={{ height: '42px', width: '100%' }}
                      >
                        <option value="বাংলা">বাংলা</option>
                        <option value="English">English</option>
                        <option value="custom">✏️ অন্যান্য (নিজে লিখুন)...</option>
                      </select>
                      {isCustomLanguage && (
                        <input 
                          className="form-input" 
                          type="text"
                          value={language} 
                          onChange={e => setLanguage(e.target.value)} 
                          placeholder="ভাষার নাম লিখুন (যেমন: আরবি, ফারসি)" 
                          style={{ height: '42px', width: '100%' }}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">সংস্করণ</label>
                    <input className="form-input" value={edition} onChange={e => setEdition(e.target.value)} placeholder="1st, 2nd..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">প্রকাশের বছর</label>
                    <input className="form-input" type="text" inputMode="numeric" value={enToBnNumber(pubYear)} onChange={e => handleNumericInput(e.target.value, setPubYear, 4)} placeholder="যেমন: ২০২৪" style={{ fontFamily: 'var(--font-serif)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">পৃষ্ঠা সংখ্যা</label>
                    <input className="form-input" type="text" inputMode="numeric" value={enToBnNumber(pageCount)} onChange={e => handleNumericInput(e.target.value, setPageCount)} style={{ fontFamily: 'var(--font-serif)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">বইয়ের ধরন (প্রিন্ট)</label>
                    <input 
                      className="form-input" 
                      value={printType} 
                      onChange={e => setPrintType(e.target.value)} 
                      list="print-type-options"
                      placeholder="অরিজিনাল, পাইরেটেড..." 
                    />
                    <datalist id="print-type-options">
                      <option value="অরিজিনাল (Original)" />
                      <option value="পাইরেটেড (Pirated)" />
                      <option value="প্রিমিয়াম পাইরেটেড (Premium Pirated)" />
                      <option value="প্রিন্টেড (Printed)" />
                      <option value="নিউজপ্রিন্ট (Newsprint)" />
                      <option value="সাদা কাগজ (White Paper)" />
                    </datalist>
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
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>👤 মালিকানা ও স্ট্যাটাস</h3>
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
                    <label className="form-label">📍 সংগ্রহের মাধ্যম / উৎস</label>
                    <input 
                      className="form-input" 
                      value={purchaseSource} 
                      onChange={e => setPurchaseSource(e.target.value)} 
                      list="unpurchased-source-options"
                      placeholder="যেমন: উপহার, চুরি করা, ধার করা..." 
                    />
                    <datalist id="unpurchased-source-options">
                      <option value="উপহার (Gift)" />
                      <option value="পুরস্কার (Prize)" />
                      <option value="চুরি করা (Stolen 🥷)" />
                      <option value="ধার করে আর ফেরত দেইনি" />
                      <option value="অনলাইন / পিডিএফ" />
                      <option value="বিশ্বসাহিত্য কেন্দ্র লাইব্রেরি" />
                    </datalist>
                  </div>
                )}
                {isPurchased && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">কেনার তারিখ</label>
                        <BanglaDateInput value={purchaseDate} onChange={setPurchaseDate} />
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
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">দাম (৳)</label>
                        <input className="form-input font-serif" type="text" inputMode="decimal" value={purchasePrice} onChange={e => handlePriceChange(e.target.value)} placeholder="যেমন: ৫০০" style={{ fontFamily: 'var(--font-serif)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ছাড় (%)</label>
                        <input className="form-input font-serif" type="text" inputMode="decimal" value={purchaseDiscountPercent} onChange={e => handleDiscountPercentChange(e.target.value)} placeholder="যেমন: ২৫" style={{ fontFamily: 'var(--font-serif)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ছাড় (৳)</label>
                        <input className="form-input font-serif" type="text" inputMode="decimal" value={purchaseDiscount} onChange={e => handleDiscountAmountChange(e.target.value)} placeholder="যেমন: ১২৫" style={{ fontFamily: 'var(--font-serif)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">চূড়ান্ত দাম (৳)</label>
                        <input className="form-input font-serif" type="text" inputMode="decimal" value={purchaseFinalPrice} onChange={e => handleFinalPriceChange(e.target.value)} placeholder="যেমন: ৩৭৫" style={{ fontFamily: 'var(--font-serif)' }} />
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
                <div className="form-group">
                  <label className="form-label">পড়ার অবস্থা (Reading Status)</label>
                  <select 
                    className="form-select" 
                    value={readingStatus} 
                    onChange={e => {
                      const val = e.target.value as ReadingStatus | '';
                      setReadingStatus(val);
                      if (val === 'পড়বো' || val === 'পড়া বাকি' || val === 'আবার পড়বো') {
                        setReadingProgress(0);
                      } else if (val === 'পড়া শেষ' || val === 'পড়া শেষ (কাছে নেই)') {
                        setReadingProgress(100);
                      } else if (val === 'পড়ছি' || val === 'পড়ছি (কাছে নেই)' || val === 'ধার করে পড়া' || val === 'লাইব্রেরি থেকে পড়া') {
                        if (readingProgress === 0) setReadingProgress(10);
                      }
                    }}
                  >
                    <option value="">নির্বাচন করুন...</option>
                    {READING_STATUSES.map(rs => <option key={rs.value} value={rs.value}>{rs.icon} {rs.label}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">পড়া শুরু</label>
                    <BanglaDateInput value={readingStartDate} onChange={setReadingStartDate} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">পড়া শেষ</label>
                    <BanglaDateInput value={readingFinishDate} onChange={setReadingFinishDate} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">পড়ার অগ্রগতি (<span style={{ fontFamily: 'var(--font-serif)' }}>{enToBnNumber(readingProgress.toString())}</span>%)</label>
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



