-- ============================================================
-- ডিজিটাল বইয়ের ঘর — Complete Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUTHORS
-- ============================================================
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT, -- Bangla name
  bio TEXT,
  birth_year INT,
  death_year INT,
  nationality TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_authors_name ON public.authors(name);
CREATE INDEX idx_authors_name_bn ON public.authors(name_bn);

-- ============================================================
-- PUBLISHERS
-- ============================================================
CREATE TABLE public.publishers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT,
  address TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publishers_name ON public.publishers(name);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_bn TEXT,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- GENRES
-- ============================================================
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_bn TEXT,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '🏷️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- LOCATIONS (Rooms)
-- ============================================================
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SHELVES
-- ============================================================
CREATE TABLE public.shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  capacity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shelves_room ON public.shelves(room_id);

-- ============================================================
-- RACKS
-- ============================================================
CREATE TABLE public.racks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  position_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_racks_shelf ON public.racks(shelf_id);

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  title TEXT NOT NULL,
  title_original TEXT,
  subtitle TEXT,
  isbn TEXT,
  language TEXT DEFAULT 'বাংলা',
  edition TEXT,
  publication_year INT,
  page_count INT,
  description TEXT,
  cover_url TEXT,
  
  -- Relations
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  translator_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  genre_id UUID REFERENCES public.genres(id) ON DELETE SET NULL,
  
  -- Ownership
  owner TEXT NOT NULL DEFAULT 'swapnil' CHECK (owner IN ('swapnil', 'bipro', 'shared')),
  
  -- Location
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  shelf_id UUID REFERENCES public.shelves(id) ON DELETE SET NULL,
  rack_id UUID REFERENCES public.racks(id) ON DELETE SET NULL,
  rack_row INT,
  rack_position INT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'আছে' CHECK (status IN (
    'আছে',
    'পড়ছি',
    'পড়া শেষ',
    'পড়া বাকি',
    'আবার পড়ব',
    'ধার দেওয়া',
    'ফেরত পাওয়া বাকি',
    'হারিয়ে গেছে',
    'কিনতে হবে'
  )),
  
  -- Purchase Info
  is_purchased BOOLEAN DEFAULT true,
  purchase_date DATE,
  purchase_source TEXT,
  purchase_price NUMERIC(10,2),
  purchase_discount NUMERIC(10,2) DEFAULT 0,
  purchase_final_price NUMERIC(10,2),
  purchased_by TEXT,
  book_condition TEXT DEFAULT 'new' CHECK (book_condition IN ('new', 'used', 'gift', 'unknown')),
  
  -- Reading Info
  reading_start_date DATE,
  reading_finish_date DATE,
  reading_progress INT DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  review TEXT,
  notes TEXT,
  favorite_quote TEXT,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Meta
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_title ON public.books(title);
CREATE INDEX idx_books_author ON public.books(author_id);
CREATE INDEX idx_books_publisher ON public.books(publisher_id);
CREATE INDEX idx_books_category ON public.books(category_id);
CREATE INDEX idx_books_genre ON public.books(genre_id);
CREATE INDEX idx_books_owner ON public.books(owner);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_isbn ON public.books(isbn);
CREATE INDEX idx_books_created ON public.books(created_at DESC);

-- Full-text search index
CREATE INDEX idx_books_search ON public.books USING GIN (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(title_original, '') || ' ' || coalesce(isbn, ''))
);

-- ============================================================
-- BOOK ↔ GENRE (many-to-many, optional extra genres)
-- ============================================================
CREATE TABLE public.book_genres (
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, genre_id)
);

-- ============================================================
-- BORROWERS (People who borrow books)
-- ============================================================
CREATE TABLE public.borrowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_borrowers_name ON public.borrowers(name);

-- ============================================================
-- LENDING RECORDS
-- ============================================================
CREATE TABLE public.lending_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES public.borrowers(id) ON DELETE CASCADE,
  lent_by TEXT NOT NULL CHECK (lent_by IN ('swapnil', 'bipro')),
  date_lent DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  date_returned DATE,
  is_returned BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lending_book ON public.lending_records(book_id);
CREATE INDEX idx_lending_borrower ON public.lending_records(borrower_id);
CREATE INDEX idx_lending_returned ON public.lending_records(is_returned);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author_name TEXT,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  publisher_name TEXT,
  isbn TEXT,
  estimated_price NUMERIC(10,2),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source TEXT,
  notes TEXT,
  requested_by TEXT NOT NULL DEFAULT 'swapnil' CHECK (requested_by IN ('swapnil', 'bipro')),
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  purchased_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  purchased_date DATE,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wishlist_purchased ON public.wishlist(is_purchased);
CREATE INDEX idx_wishlist_priority ON public.wishlist(priority);

-- ============================================================
-- READING SESSIONS (track reading over time)
-- ============================================================
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  reader TEXT NOT NULL CHECK (reader IN ('swapnil', 'bipro')),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pages_read INT,
  duration_minutes INT,
  progress_percent INT CHECK (progress_percent >= 0 AND progress_percent <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_sessions_book ON public.reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_date ON public.reading_sessions(session_date DESC);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'book', 'author', 'lending', etc.
  entity_id UUID,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can do everything (private family library)
CREATE POLICY "Authenticated users full access" ON public.profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.authors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.publishers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.genres
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.rooms
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.shelves
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.racks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.books
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.book_genres
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.borrowers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.lending_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.wishlist
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.reading_sessions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.activity_log
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET for book covers
-- ============================================================
-- Run in Supabase Dashboard → Storage → Create bucket: "covers"
-- Set to public bucket

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.publishers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.borrowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lending_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.wishlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Dashboard statistics function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_books', (SELECT COUNT(*) FROM public.books),
    'swapnil_books', (SELECT COUNT(*) FROM public.books WHERE owner = 'swapnil'),
    'bipro_books', (SELECT COUNT(*) FROM public.books WHERE owner = 'bipro'),
    'shared_books', (SELECT COUNT(*) FROM public.books WHERE owner = 'shared'),
    'read_books', (SELECT COUNT(*) FROM public.books WHERE status = 'পড়া শেষ'),
    'unread_books', (SELECT COUNT(*) FROM public.books WHERE status = 'পড়া বাকি'),
    'reading_books', (SELECT COUNT(*) FROM public.books WHERE status = 'পড়ছি'),
    'lent_books', (SELECT COUNT(*) FROM public.books WHERE status IN ('ধার দেওয়া', 'ফেরত পাওয়া বাকি')),
    'lost_books', (SELECT COUNT(*) FROM public.books WHERE status = 'হারিয়ে গেছে'),
    'wishlist_count', (SELECT COUNT(*) FROM public.wishlist WHERE is_purchased = false),
    'total_value', (SELECT COALESCE(SUM(purchase_final_price), 0) FROM public.books WHERE purchase_final_price IS NOT NULL),
    'total_spent', (SELECT COALESCE(SUM(purchase_final_price), 0) FROM public.books WHERE is_purchased = true AND purchase_final_price IS NOT NULL),
    'books_this_month', (SELECT COUNT(*) FROM public.books WHERE created_at >= date_trunc('month', now())),
    'books_this_year', (SELECT COUNT(*) FROM public.books WHERE is_purchased = true AND purchase_date >= date_trunc('year', now())),
    'total_authors', (SELECT COUNT(*) FROM public.authors),
    'total_publishers', (SELECT COUNT(*) FROM public.publishers),
    'favorite_books', (SELECT COUNT(*) FROM public.books WHERE is_favorite = true),
    'overdue_lendings', (SELECT COUNT(*) FROM public.lending_records WHERE is_returned = false AND expected_return_date < CURRENT_DATE)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA: Default categories
-- ============================================================
INSERT INTO public.categories (name, name_bn, icon, color) VALUES
  ('Fiction', 'কথাসাহিত্য', '📖', '#4F46E5'),
  ('Non-Fiction', 'নন-ফিকশন', '📚', '#059669'),
  ('Poetry', 'কবিতা', '🎭', '#D97706'),
  ('Drama', 'নাটক', '🎪', '#DC2626'),
  ('Children', 'শিশুসাহিত্য', '🧒', '#7C3AED'),
  ('Academic', 'একাডেমিক', '🎓', '#0891B2'),
  ('Religious', 'ধর্মীয়', '🕌', '#65A30D'),
  ('Self-Help', 'আত্মউন্নয়ন', '💡', '#EA580C'),
  ('Science', 'বিজ্ঞান', '🔬', '#2563EB'),
  ('History', 'ইতিহাস', '🏛️', '#9333EA'),
  ('Philosophy', 'দর্শন', '🤔', '#475569'),
  ('Travel', 'ভ্রমণ', '✈️', '#0D9488'),
  ('Biography', 'জীবনী', '👤', '#B45309'),
  ('Comics', 'কমিক্স', '💬', '#E11D48'),
  ('Thriller', 'থ্রিলার', '🔍', '#1D4ED8'),
  ('Reference', 'রেফারেন্স', '📋', '#64748B')
ON CONFLICT (name) DO NOTHING;

-- Seed genres
INSERT INTO public.genres (name, name_bn, icon, color) VALUES
  ('Novel', 'উপন্যাস', '📕', '#4F46E5'),
  ('Short Story', 'ছোটগল্প', '📄', '#059669'),
  ('Poetry Collection', 'কাব্যগ্রন্থ', '🌹', '#D97706'),
  ('Essay', 'প্রবন্ধ', '✍️', '#DC2626'),
  ('Memoir', 'স্মৃতিকথা', '💭', '#7C3AED'),
  ('Autobiography', 'আত্মজীবনী', '📝', '#0891B2'),
  ('Mystery', 'রহস্য', '🔮', '#65A30D'),
  ('Science Fiction', 'কল্পবিজ্ঞান', '🚀', '#EA580C'),
  ('Fantasy', 'ফ্যান্টাসি', '🧙', '#2563EB'),
  ('Horror', 'ভৌতিক', '👻', '#9333EA'),
  ('Romance', 'রোমান্টিক', '❤️', '#E11D48'),
  ('Historical Fiction', 'ঐতিহাসিক উপন্যাস', '⚔️', '#B45309'),
  ('Adventure', 'অ্যাডভেঞ্চার', '🗺️', '#0D9488'),
  ('Classic', 'ক্লাসিক', '🏆', '#475569'),
  ('Liberation War', 'মুক্তিযুদ্ধ', '🇧🇩', '#15803D'),
  ('Translation', 'অনুবাদ', '🌍', '#1D4ED8')
ON CONFLICT (name) DO NOTHING;
