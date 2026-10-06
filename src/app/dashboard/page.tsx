import { db } from '@/db';
import { books, authors, publishers, lendingRecords, wishlist } from '@/db/schema';
import { sql, desc, eq, and, isNotNull } from 'drizzle-orm';
import Link from 'next/link';
import { getOwnerLabel, enToBnNumber } from '@/lib/types';

export const dynamic = 'force-dynamic'; // Prevent caching so dashboard is always fresh

export default async function DashboardPage() {
  const [
    total_books, swapnil_books, bipro_books, srrijan_books, 
    read_books, unread_books, reading_books, lent_books, lost_books, 
    wishlist_count, total_value, total_spent, books_this_month, 
    books_this_year, overdue_lendings
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(books).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'swapnil')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'bipro')).then(res => res[0].count),
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.owner, 'srrijan')).then(res => res[0].count),
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
    total_books, swapnil_books, bipro_books, srrijan_books, read_books, unread_books, reading_books, lent_books, lost_books, wishlist_count, total_value, total_spent, books_this_month, books_this_year, overdue_lendings
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
        
        {/* === Collection Overview === */}
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">📊 লাইব্রেরি একনজরে</h3>
          <div className="dashboard-grid">
            <Link href="/dashboard/books" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-primary" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">মোট বই</span>
                  <div className="dash-icon">📚</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.total_books)}</div>
              </div>
            </Link>
            <Link href="/dashboard/books?status=পড়া শেষ" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-success" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">পড়া শেষ</span>
                  <div className="dash-icon">✅</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.read_books)}</div>
              </div>
            </Link>
            <Link href="/dashboard/reading" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-warning" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">পড়ছি / বাকি</span>
                  <div className="dash-icon">📖</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.reading_books + s.unread_books)}</div>
              </div>
            </Link>
            <Link href="/dashboard/wishlist" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-info" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">কিনতে হবে</span>
                  <div className="dash-icon">🛒</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.wishlist_count)}</div>
              </div>
            </Link>
          </div>
        </section>

        {/* === Lending & Borrowing === */}
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">📤 ধার ও আদান-প্রদান</h3>
          <div className="dashboard-grid">
            <Link href="/dashboard/lending" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-info" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">ধার দেওয়া</span>
                  <div className="dash-icon">📤</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.lent_books)}</div>
              </div>
            </Link>
            <Link href="/dashboard/lending" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-danger" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">সময় পেরিয়ে গেছে</span>
                  <div className="dash-icon">⏰</div>
                </div>
                <div className="dash-value" style={{ color: s.overdue_lendings ? 'var(--danger)' : undefined }}>
                  {enToBnNumber(s.overdue_lendings)}
                </div>
              </div>
            </Link>
            <Link href="/dashboard/books?status=হারিয়ে গেছে" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card card-warning" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">হারিয়ে গেছে</span>
                  <div className="dash-icon">⚠️</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.lost_books)}</div>
              </div>
            </Link>
          </div>
        </section>

        {/* === Ownership Stats === */}
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">👤 মালিকানা পরিসংখ্যান</h3>
          <div className="dashboard-grid">
            <Link href="/dashboard/books?owner=swapnil" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">স্বপ্নীল-এর বই</span>
                  <div className="dash-icon" style={{ background: 'rgba(79, 161, 115, 0.2)', color: 'var(--accent)' }}>S</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.swapnil_books)}</div>
              </div>
            </Link>
            <Link href="/dashboard/books?owner=bipro" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">বিপ্রতীব-এর বই</span>
                  <div className="dash-icon" style={{ background: 'rgba(61, 187, 185, 0.2)', color: 'var(--success)' }}>B</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.bipro_books)}</div>
              </div>
            </Link>
            <Link href="/dashboard/books?owner=srrijan" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card" style={{ cursor: 'pointer' }}>
                <div className="dash-header">
                  <span className="dash-title">সৃজন-এর বই</span>
                  <div className="dash-icon" style={{ background: 'rgba(227, 116, 82, 0.2)', color: 'var(--danger)' }}>S</div>
                </div>
                <div className="dash-value">{enToBnNumber(s.srrijan_books)}</div>
              </div>
            </Link>
          </div>
        </section>

        {/* === Financial Stats === */}
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">💰 আর্থিক তথ্য</h3>
          <div className="dashboard-grid">
            <div className="dashboard-card card-success">
              <div className="dash-header">
                <span className="dash-title">মোট সংগ্রহের মূল্য</span>
                <div className="dash-icon">💎</div>
              </div>
              <div className="dash-value">৳{enToBnNumber(s.total_value.toLocaleString())}</div>
            </div>
            <div className="dashboard-card card-danger">
              <div className="dash-header">
                <span className="dash-title">মোট খরচ</span>
                <div className="dash-icon">💸</div>
              </div>
              <div className="dash-value">৳{enToBnNumber(s.total_spent.toLocaleString())}</div>
            </div>
            <div className="dashboard-card card-primary">
              <div className="dash-header">
                <span className="dash-title">এই মাসে যোগ</span>
                <div className="dash-icon">📅</div>
              </div>
              <div className="dash-value">{enToBnNumber(s.books_this_month)}</div>
            </div>
            <div className="dashboard-card card-info">
              <div className="dash-header">
                <span className="dash-title">এই বছরে কেনা</span>
                <div className="dash-icon">📆</div>
              </div>
              <div className="dash-value">{enToBnNumber(s.books_this_year)}</div>
            </div>
          </div>
        </section>

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
                  </div>
                  <div className="book-card-body">
                    <div className="book-card-title">{book.title}</div>
                    <div className="book-card-author">
                      {book.authorName || book.authorNameBn || 'অজানা লেখক'}
                    </div>
                    <div className="book-card-meta">
                      <span className="book-card-owner">{getOwnerLabel(book.owner)}</span>
                      {book.rating && <span style={{ fontSize: '0.8rem' }}>⭐ {enToBnNumber(book.rating.toString())}</span>}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                      <span className="book-card-status-inline">
                        {book.status}
                      </span>
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
            { href: '/dashboard/wishlist', icon: '🛒', label: 'উইশলিস্ট' },
            { href: '/dashboard/unowned', icon: '🔖', label: 'আমার কাছে নেই' },
            { href: '/dashboard/reading', icon: '📖', label: 'পড়ছি' },
            { href: '/dashboard/authors', icon: '✍🏻', label: 'লেখক পরিচালনা' },
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
