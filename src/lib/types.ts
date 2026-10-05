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
  is_author?: boolean | number;
  is_translator?: boolean | number;
  isAuthor?: boolean | number;
  isTranslator?: boolean | number;
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
  | 'নাই'
  | 'উইশলিস্ট'
  | 'ধার দেওয়া'
  | 'হারিয়ে গেছে'
  | 'পড়া শেষ (কাছে নেই)';

export type ReadingStatus = 
  | 'পড়বো'
  | 'পড়ছি'
  | 'পড়া শেষ'
  | 'পড়া বাকি'
  | 'আবার পড়বো'
  | 'পড়া শেষ (কাছে নেই)'
  | 'পড়ছি (কাছে নেই)'
  | 'ধার করে পড়া'
  | 'লাইব্রেরি থেকে পড়া';

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
  copies?: number;
  
  author_id: string | null;
  translator_id: string | null;
  illustrator_id: string | null;
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
  
  reading_status: ReadingStatus | null;
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
  illustrator?: Author;
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
  { value: 'নাই', label: 'নাই', icon: '❌', color: '#EF4444' },
  { value: 'উইশলিস্ট', label: 'উইশলিস্ট', icon: '🛒', color: '#06B6D4' },
  { value: 'ধার দেওয়া', label: 'ধার দেওয়া', icon: '📤', color: '#F59E0B' },
  { value: 'হারিয়ে গেছে', label: 'হারিয়ে গেছে', icon: '❌', color: '#DC2626' },
];

export const READING_STATUSES: { value: ReadingStatus; label: string; icon: string; color: string }[] = [
  { value: 'পড়বো', label: 'পড়বো / এখনো শুরু করিনি', icon: '📌', color: '#64748B' },
  { value: 'পড়ছি', label: 'পড়ছি', icon: '📖', color: '#3B82F6' },
  { value: 'পড়া শেষ', label: 'পড়া শেষ', icon: '✅', color: '#10B981' },
  { value: 'পড়া বাকি', label: 'পড়া বাকি', icon: '📕', color: '#EF4444' },
  { value: 'আবার পড়বো', label: 'আবার পড়বো', icon: '🔄', color: '#8B5CF6' },
  { value: 'পড়া শেষ (কাছে নেই)', label: 'পড়া শেষ (কাছে নেই)', icon: '📘', color: '#0284C7' },
  { value: 'পড়ছি (কাছে নেই)', label: 'পড়ছি (কাছে নেই)', icon: '📖', color: '#2563EB' },
  { value: 'ধার করে পড়া', label: 'ধার করে পড়া', icon: '🤝', color: '#7C3AED' },
  { value: 'লাইব্রেরি থেকে পড়া', label: 'লাইব্রেরি থেকে পড়া', icon: '🏛️', color: '#D97706' },
];

export const UNOWNED_STATUSES: BookStatus[] = [
  'নাই',
  'উইশলিস্ট',
  'হারিয়ে গেছে',
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

/**
 * Safely parse a database timestamp string.
 * SQLite's CURRENT_TIMESTAMP produces 'YYYY-MM-DD HH:MM:SS' in UTC without a 'Z'.
 * If parsed directly without 'Z', browsers parse it in local time, skewing the date/time by timezone offset.
 */
export function parseDbDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // If format is 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD HH:MM:SS.SSS'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return new Date(trimmed.replace(' ', 'T') + 'Z');
  }
  // If format is 'YYYY-MM-DDTHH:MM:SS' without timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'Z');
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateBn(
  dateStr: string | null | undefined, 
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
): string {
  const d = parseDbDate(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString('bn-BD', options);
}

export function formatRelativeTimeBn(dateStr: string | null | undefined): string {
  const d = parseDbDate(dateStr);
  if (!d) return '—';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${mins.toLocaleString('bn-BD')} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours.toLocaleString('bn-BD')} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days.toLocaleString('bn-BD')} দিন আগে`;
  return formatDateBn(dateStr);
}

export const BACKUP_TABLES = [
  'profiles',
  'categories',
  'genres',
  'rooms',
  'shelves',
  'racks',
  'authors',
  'publishers',
  'borrowers',
  'books',
  'lending_records',
  'wishlist',
  'activity_log',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function enToBnNumber(number: number | string | null | undefined): string {
  if (number === null || number === undefined || number === '') return '';
  const str = number.toString();
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const idx = enDigits.indexOf(str[i]);
    if (idx !== -1) {
      result += bnDigits[idx];
    } else {
      result += str[i];
    }
  }
  return result;
}

export function bnToEnNumber(numberStr: string | null | undefined): string {
  if (!numberStr) return '';
  let result = '';
  for (let i = 0; i < numberStr.length; i++) {
    const idx = bnDigits.indexOf(numberStr[i]);
    if (idx !== -1) {
      result += enDigits[idx];
    } else {
      result += numberStr[i];
    }
  }
  return result;
}
