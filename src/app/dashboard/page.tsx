import { db } from '@/db';
import { books, authors, publishers, lendingRecords, wishlist } from '@/db/schema';
import { sql, desc, eq, and, isNotNull } from 'drizzle-orm';
import Link from 'next/link';
import { getOwnerLabel } from '@/lib/types';

export const dynamic = 'force-dynamic'; // Prevent caching so dashboard is always fresh

export default async function DashboardPage() {
  const [
    total_books, swapnil_books, bipro_books, srrijan_books, shared_books, 
    read_books, unread_books, reading_books, lent_books, lost_books, 
    wishlist_count, total_value, total_spent, books_this_month, 
    books_this_year, overdue_lendings
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(books).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'swapnil')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'bipro')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'srrijan')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'shared')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.status, 'পড়া শেষ')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.status, 'পড়া বাকি')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.status, 'পড়ছি')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(sql`${books.status} IN ('ধার দেওয়া', 'ফেরত পাওয়া বাকি')`).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.status, 'হারিয়ে গেছে')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(wishlist).where(eq(wishlist.isPurchased, false)).then(res => res[0].count),
    db.select({ total: sql<number>`sum(${books.purchaseFinalPrice})` }).from(books).where(isNotNull(books.purchaseFinalPrice)).then(res => res[0].total || 0),
    db.select({ total: sql<number>`sum(${books.purchaseFinalPrice})` }).from(books).where(and(eq(books.isPurchased, true), isNotNull(books.purchaseFinalPrice))).then(res => res[0].total || 0),
    db.select({ count: sql<number>`count(*)` }).from(books).where(sql`${books.createdAt} >= date('now', 'start of month')`).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(and(eq(books.isPurchased, true), sql`${books.purchaseDate} >= date('now', 'start of year')`)).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(lendingRecords).where(and(eq(lendingRecords.isReturned, false), sql`${lendingRecords.expectedReturnDate} < date('now')`)).then(res => res[0].count),
  ]);

  const recentBooks = await db.select({
    id: books.id,
    title: books.title,
    coverUrl: books.coverUrl,
    status: books.status,
    owner: books.owner,
    rating: books.rating,
    authorName: authors.name,
    authorNameBn: authors.nameBn
  })
  .from(books)
  .leftJoin(authors, eq(books.authorId, authors.id))
  .orderBy(desc(books.createdAt))
  .limit(8);

  const s = {
    total_books, swapnil_books, bipro_books, srrijan_books, shared_books, read_books, unread_books, reading_books, lent_books, lost_books, wishlist_count, total_value, total_spent, books_this_month, books_this_year, overdue_lendings
  };

  return (
    <>
      <div className="page-header">
        <h2>🏠 ড্যাশবোর্ড</h2>
        <Link href="/dashboard/books/add" className="btn btn-primary">
          ➕ নতুন বই যোগ করুন
        </Link>
      </div>

      <div className="page-body">
        {/* Collection Stats */}
        <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>📊 সংগ্রহের পরিসংখ্যান</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📚</span>
            <span className="stat-value">{s.total_books}</span>
            <span className="stat-label">মোট বই</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👤</span>
            <span className="stat-value">{s.swapnil_books}</span>
            <span className="stat-label">স্বপ্নীল-এর বই</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👤</span>
            <span className="stat-value">{s.bipro_books}</span>
            <span className="stat-label">বিপ্রতীব-এর বই</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👤</span>
            <span className="stat-value">{s.srrijan_books}</span>
            <span className="stat-label">সৃজন-এর বই</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🤝</span>
            <span className="stat-value">{s.shared_books}</span>
            <span className="stat-label">যৌথ বই</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{s.read_books}</span>
            <span className="stat-label">পড়া শেষ</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📕</span>
            <span className="stat-value">{s.unread_books}</span>
            <span className="stat-label">পড়া বাকি</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📖</span>
            <span className="stat-value">{s.reading_books}</span>
            <span className="stat-label">পড়ছি</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📤</span>
            <span className="stat-value">{s.lent_books}</span>
            <span className="stat-label">ধার দেওয়া</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏰</span>
            <span className="stat-value" style={{ color: s.overdue_lendings ? 'var(--danger)' : undefined }}>
              {s.overdue_lendings}
            </span>
            <span className="stat-label">সময় পেরিয়ে গেছে</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🛒</span>
            <span className="stat-value">{s.wishlist_count}</span>
            <span className="stat-label">কিনতে হবে</span>
          </div>
        </div>

        {/* Financial Stats */}
        <h3 style={{ marginBottom: '16px', marginTop: '32px', fontFamily: 'var(--font-serif)' }}>💰 আর্থিক তথ্য</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">💎</span>
            <span className="stat-value">৳{s.total_value.toLocaleString()}</span>
            <span className="stat-label">মোট সংগ্রহের মূল্য</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💸</span>
            <span className="stat-value">৳{s.total_spent.toLocaleString()}</span>
            <span className="stat-label">মোট খরচ</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <span className="stat-value">{s.books_this_month}</span>
            <span className="stat-label">এই মাসে যোগ</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📆</span>
            <span className="stat-value">{s.books_this_year}</span>
            <span className="stat-label">এই বছরে কেনা</span>
          </div>
        </div>

        {/* Recent Books */}
        <h3 style={{ marginBottom: '16px', marginTop: '32px', fontFamily: 'var(--font-serif)' }}>🕐 সম্প্রতি যোগ করা বই</h3>
        {recentBooks.length > 0 ? (
          <div className="books-grid">
            {recentBooks.map((book) => (
              <Link key={book.id} href={`/dashboard/books/${book.id}`} style={{ textDecoration: 'none' }}>
                <div className="book-card">
                  <div className="book-card-cover">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} />
                    ) : (
                      <div className="placeholder-cover">
                        <span className="book-emoji">📖</span>
                        <span className="book-title-placeholder">{book.title}</span>
                      </div>
                    )}
                    <span className="book-card-status">
                      {book.status}
                    </span>
                  </div>
                  <div className="book-card-body">
                    <div className="book-card-title">{book.title}</div>
                    <div className="book-card-author">
                      {book.authorName || book.authorNameBn || 'অজানা লেখক'}
                    </div>
                    <div className="book-card-meta">
                      <span className="book-card-owner">{getOwnerLabel(book.owner)}</span>
                      {book.rating && <span style={{ fontSize: '0.8rem' }}>⭐ {book.rating}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h3 style={{ marginBottom: '8px' }}>এখনো কোনো বই নেই</h3>
            <p style={{ color: 'var(--text-muted)' }}>আপনার সংগ্রহে প্রথম বই যোগ করুন!</p>
            <Link href="/dashboard/books/add" className="btn btn-primary" style={{ marginTop: '20px' }}>
              ➕ বই যোগ করুন
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <h3 style={{ marginBottom: '16px', marginTop: '32px', fontFamily: 'var(--font-serif)' }}>⚡ দ্রুত লিংক</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { href: '/dashboard/books', icon: '📚', label: 'সব বই দেখুন' },
            { href: '/dashboard/books/add', icon: '➕', label: 'নতুন বই যোগ করুন' },
            { href: '/dashboard/lending', icon: '📤', label: 'ধার দেওয়া বই' },
            { href: '/dashboard/wishlist', icon: '🛒', label: 'কিনতে হবে' },
            { href: '/dashboard/reading', icon: '📖', label: 'পড়ছি' },
            { href: '/dashboard/authors', icon: '✍️', label: 'লেখক পরিচালনা' },
            { href: '/dashboard/publishers', icon: '🏢', label: 'প্রকাশক পরিচালনা' },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="card" style={{ padding: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
