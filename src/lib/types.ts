// Database types for ডিজিটাল বইয়ের ঘর

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  name: string;
  name_bn: string | null;
  bio: string | null;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Publisher {
  id: string;
  name: string;
  name_bn: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  created_at: string;
}

export interface Shelf {
  id: string;
  room_id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  capacity: number | null;
  created_at: string;
  room?: Room;
}

export interface Rack {
  id: string;
  shelf_id: string;
  name: string;
  name_bn: string | null;
  position_order: number;
  created_at: string;
  shelf?: Shelf;
}

export type BookOwner = 'swapnil' | 'bipro' | 'srrijan';

export type BookStatus = 
  | 'আছে'
  | 'পড়ছি'
  | 'পড়া শেষ'
  | 'পড়া বাকি'
  | 'আবার পড়ব'
  | 'ধার দেওয়া'
  | 'ফেরত পাওয়া বাকি'
  | 'হারিয়ে গেছে'
  | 'কিনতে হবে'
  | 'পড়া শেষ (কাছে নেই)'
  | 'কিনবো'
  | 'পড়ছি (কাছে নেই)'
  | 'ধার করে পড়া'
  | 'ই-বুক / পিডিএফ';

export type BookCondition = 'new' | 'used' | 'gift' | 'unknown';

export interface Book {
  id: string;
  title: string;
  title_original: string | null;
  subtitle: string | null;
  isbn: string | null;
  language: string;
  edition: string | null;
  publication_year: number | null;
  page_count: number | null;
  description: string | null;
  cover_url: string | null;
  
  author_id: string | null;
  translator_id: string | null;
  publisher_id: string | null;
  category_id: string | null;
  genre_id: string | null;
  
  owner: BookOwner;
  
  room_id: string | null;
  shelf_id: string | null;
  rack_id: string | null;
  rack_row: number | null;
  rack_position: number | null;
  
  status: BookStatus;
  
  is_purchased: boolean;
  purchase_date: string | null;
  purchase_source: string | null;
  purchase_price: number | null;
  purchase_discount: number | null;
  purchase_final_price: number | null;
  purchased_by: string | null;
  book_condition: BookCondition;
  
  reading_start_date: string | null;
  reading_finish_date: string | null;
  reading_progress: number;
  rating: number | null;
  review: string | null;
  notes: string | null;
  favorite_quote: string | null;
  is_favorite: boolean;
  
  added_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  author?: Author;
  translator?: Author;
  publisher?: Publisher;
  category?: Category;
  genre?: Genre;
  room?: Room;
  shelf?: Shelf;
  rack?: Rack;
}

export interface Borrower {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LendingRecord {
  id: string;
  book_id: string;
  borrower_id: string;
  lent_by: string;
  date_lent: string;
  expected_return_date: string | null;
  date_returned: string | null;
  is_returned: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  book?: Book;
  borrower?: Borrower;
}

export type WishlistPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WishlistItem {
  id: string;
  title: string;
  author_name: string | null;
  author_id: string | null;
  publisher_name: string | null;
  isbn: string | null;
  estimated_price: number | null;
  priority: WishlistPriority;
  source: string | null;
  notes: string | null;
  requested_by: string;
  is_purchased: boolean;
  purchased_book_id: string | null;
  purchased_date: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  
  author?: Author;
}

export interface ReadingSession {
  id: string;
  book_id: string;
  reader: string;
  session_date: string;
  pages_read: number | null;
  duration_minutes: number | null;
  progress_percent: number | null;
  notes: string | null;
  created_at: string;
  
  book?: Book;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  
  profile?: Profile;
}

export interface DashboardStats {
  total_books: number;
  swapnil_books: number;
  bipro_books: number;
  srrijan_books: number;
  read_books: number;
  unread_books: number;
  reading_books: number;
  lent_books: number;
  lost_books: number;
  wishlist_count: number;
  total_value: number;
  total_spent: number;
  books_this_month: number;
  books_this_year: number;
  total_authors: number;
  total_publishers: number;
  favorite_books: number;
  overdue_lendings: number;
}

// Status display config
export const BOOK_STATUSES: { value: BookStatus; label: string; icon: string; color: string }[] = [
  { value: 'আছে', label: 'আছে', icon: '🟢', color: '#22C55E' },
  { value: 'পড়ছি', label: 'পড়ছি', icon: '📖', color: '#3B82F6' },
  { value: 'পড়া শেষ', label: 'পড়া শেষ', icon: '✅', color: '#10B981' },
  { value: 'পড়া বাকি', label: 'পড়া বাকি', icon: '📕', color: '#EF4444' },
  { value: 'আবার পড়ব', label: 'আবার পড়ব', icon: '🔄', color: '#8B5CF6' },
  { value: 'ধার দেওয়া', label: 'ধার দেওয়া', icon: '📤', color: '#F59E0B' },
  { value: 'ফেরত পাওয়া বাকি', label: 'ফেরত পাওয়া বাকি', icon: '⏰', color: '#EF4444' },
  { value: 'হারিয়ে গেছে', label: 'হারিয়ে গেছে', icon: '❌', color: '#DC2626' },
  { value: 'কিনতে হবে', label: 'উইশলিস্ট (কিনতে হবে)', icon: '🛒', color: '#06B6D4' },
  { value: 'পড়া শেষ (কাছে নেই)', label: 'পড়া শেষ (কাছে নেই)', icon: '📘', color: '#0284C7' },
  { value: 'কিনবো', label: 'কিনবো', icon: '🛒', color: '#D97706' },
  { value: 'পড়ছি (কাছে নেই)', label: 'পড়ছি (কাছে নেই)', icon: '📖', color: '#2563EB' },
  { value: 'ধার করে পড়া', label: 'ধার করে পড়া', icon: '🤝', color: '#7C3AED' },
  { value: 'ই-বুক / পিডিএফ', label: 'ই-বুক / পিডিএফ', icon: '📱', color: '#059669' },
];

export const UNOWNED_STATUSES: BookStatus[] = [
  'পড়া শেষ (কাছে নেই)',
  'কিনবো',
  'পড়ছি (কাছে নেই)',
  'ধার করে পড়া',
  'ই-বুক / পিডিএফ',
];

export const OWNERS: { value: BookOwner; label: string }[] = [
  { value: 'swapnil', label: 'স্বপ্নীল' },
  { value: 'bipro', label: 'বিপ্রতীব' },
  { value: 'srrijan', label: 'সৃজন' },
];

export const OWNER_LABELS: Record<string, string> = {
  swapnil: 'স্বপ্নীল',
  bipro: 'বিপ্রতীব',
  srrijan: 'সৃজন',
};

export function getOwnerLabel(owner: string | null | undefined): string {
  if (!owner) return '—';
  return OWNER_LABELS[owner] || owner;
}

export const PRIORITIES: { value: WishlistPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'জরুরি', color: '#DC2626' },
  { value: 'high', label: 'বেশি', color: '#F59E0B' },
  { value: 'medium', label: 'মাঝারি', color: '#3B82F6' },
  { value: 'low', label: 'কম', color: '#6B7280' },
];
