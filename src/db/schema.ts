import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// USERS (profiles)
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('member'), // admin, member
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// AUTHORS
export const authors = sqliteTable('authors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  nameBn: text('name_bn'),
  bio: text('bio'),
  birthYear: integer('birth_year'),
  deathYear: integer('death_year'),
  nationality: text('nationality'),
  imageUrl: text('image_url'),
  isAuthor: integer('is_author', { mode: 'boolean' }).notNull().default(true),
  isTranslator: integer('is_translator', { mode: 'boolean' }).notNull().default(false),
  isIllustrator: integer('is_illustrator', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// PUBLISHERS
export const publishers = sqliteTable('publishers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  nameBn: text('name_bn'),
  address: text('address'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// CATEGORIES
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  nameBn: text('name_bn'),
  description: text('description'),
  color: text('color').default('#6B7280'),
  icon: text('icon').default('📁'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// GENRES
export const genres = sqliteTable('genres', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  nameBn: text('name_bn'),
  description: text('description'),
  color: text('color').default('#6B7280'),
  icon: text('icon').default('🏷️'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ROOMS
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameBn: text('name_bn'),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// SHELVES
export const shelves = sqliteTable('shelves', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameBn: text('name_bn'),
  description: text('description'),
  capacity: integer('capacity'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// RACKS
export const racks = sqliteTable('racks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shelfId: text('shelf_id').notNull().references(() => shelves.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameBn: text('name_bn'),
  positionOrder: integer('position_order').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// BOOKS
export const books = sqliteTable('books', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  titleOriginal: text('title_original'),
  subtitle: text('subtitle'),
  isbn: text('isbn'),
  language: text('language').default('বাংলা'),
  edition: text('edition'),
  publicationYear: integer('publication_year'),
  pageCount: integer('page_count'),
  description: text('description'),
  coverUrl: text('cover_url'),
  copies: integer('copies').default(1),
  
  authorId: text('author_id').references(() => authors.id, { onDelete: 'set null' }),
  translatorId: text('translator_id').references(() => authors.id, { onDelete: 'set null' }),
  illustratorId: text('illustrator_id').references(() => authors.id, { onDelete: 'set null' }),
  publisherId: text('publisher_id').references(() => publishers.id, { onDelete: 'set null' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  genreId: text('genre_id').references(() => genres.id, { onDelete: 'set null' }),
  
  owner: text('owner').notNull().default('swapnil'),
  
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  shelfId: text('shelf_id').references(() => shelves.id, { onDelete: 'set null' }),
  rackId: text('rack_id').references(() => racks.id, { onDelete: 'set null' }),
  rackRow: integer('rack_row'),
  rackPosition: integer('rack_position'),
  
  status: text('status').notNull().default('আছে'),
  
  isPurchased: integer('is_purchased', { mode: 'boolean' }).default(true),
  purchaseDate: text('purchase_date'),
  purchaseSource: text('purchase_source'),
  purchasePrice: real('purchase_price'),
  purchaseDiscount: real('purchase_discount').default(0),
  purchaseFinalPrice: real('purchase_final_price'),
  purchasedBy: text('purchased_by'),
  bookCondition: text('book_condition').default('new'),
  
  readingStatus: text('reading_status'),
  readingStartDate: text('reading_start_date'),
  readingFinishDate: text('reading_finish_date'),
  readingProgress: integer('reading_progress').default(0),
  rating: real('rating'),
  review: text('review'),
  notes: text('notes'),
  favoriteQuote: text('favorite_quote'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  
  addedBy: text('added_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// BORROWERS
export const borrowers = sqliteTable('borrowers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// LENDING RECORDS
export const lendingRecords = sqliteTable('lending_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  borrowerId: text('borrower_id').notNull().references(() => borrowers.id, { onDelete: 'cascade' }),
  lentBy: text('lent_by').notNull(),
  dateLent: text('date_lent').notNull(),
  expectedReturnDate: text('expected_return_date'),
  dateReturned: text('date_returned'),
  isReturned: integer('is_returned', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// WISHLIST
export const wishlist = sqliteTable('wishlist', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  authorName: text('author_name'),
  authorId: text('author_id').references(() => authors.id, { onDelete: 'set null' }),
  publisherName: text('publisher_name'),
  isbn: text('isbn'),
  estimatedPrice: real('estimated_price'),
  priority: text('priority').default('medium'),
  source: text('source'),
  notes: text('notes'),
  requestedBy: text('requested_by').notNull().default('swapnil'),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(false),
  purchasedBookId: text('purchased_book_id').references(() => books.id, { onDelete: 'set null' }),
  purchasedDate: text('purchased_date'),
  coverUrl: text('cover_url'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ACTIVITY LOG
export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  entityName: text('entity_name'),
  details: text('details', { mode: 'json' }), // stores JSON as string in sqlite
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// MAGAZINE SERIES
export const magazines = sqliteTable('magazines', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  publisherId: text('publisher_id').references(() => publishers.id, { onDelete: 'set null' }),
  coverUrl: text('cover_url'),
  
  owner: text('owner').notNull().default('swapnil'),
  addedBy: text('added_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// MAGAZINE ISSUES
export const magazineIssues = sqliteTable('magazine_issues', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  magazineId: text('magazine_id').notNull().references(() => magazines.id, { onDelete: 'cascade' }),
  issueMonth: text('issue_month'),
  issueYear: integer('issue_year'),
  volume: text('volume'),
  
  copies: integer('copies').default(1),
  status: text('status').notNull().default('আছে'),
  
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
