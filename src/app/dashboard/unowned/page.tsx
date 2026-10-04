import { db } from '@/db';
import { books, categories, genres, authors, publishers } from '@/db/schema';
import { desc, eq, inArray, or } from 'drizzle-orm';
import UnownedClient from './UnownedClient';

export const dynamic = 'force-dynamic';

export default async function UnownedBooksPage() {
  const unownedStatuses = [
    'নাই',
    'হারিয়ে গেছে'
  ];

  const unownedBooks = await db.select({
    id: books.id,
    title: books.title,
    titleOriginal: books.titleOriginal,
    isbn: books.isbn,
    coverUrl: books.coverUrl,
    status: books.status,
    readingStatus: books.readingStatus,
    owner: books.owner,
    rating: books.rating,
    review: books.review,
    notes: books.notes,
    favoriteQuote: books.favoriteQuote,
    isPurchased: books.isPurchased,
    purchaseSource: books.purchaseSource,
    readingStartDate: books.readingStartDate,
    readingFinishDate: books.readingFinishDate,
    pageCount: books.pageCount,
    categoryId: books.categoryId,
    genreId: books.genreId,
    authorId: books.authorId,
    authorName: authors.name,
    authorNameBn: authors.nameBn,
    publisherName: publishers.name,
    publisherNameBn: publishers.nameBn,
    createdAt: books.createdAt,
  })
  .from(books)
  .leftJoin(authors, eq(books.authorId, authors.id))
  .leftJoin(publishers, eq(books.publisherId, publishers.id))
  .where(
    or(
      inArray(books.status, unownedStatuses),
      eq(books.isPurchased, false)
    )
  )
  .orderBy(desc(books.createdAt));

  const allCategories = await db.select().from(categories).orderBy(categories.name);
  const allGenres = await db.select().from(genres).orderBy(genres.name);
  const allAuthors = await db.select().from(authors).orderBy(authors.name);

  return (
    <UnownedClient
      initialBooks={unownedBooks}
      categories={allCategories}
      genres={allGenres}
      authors={allAuthors}
    />
  );
}
