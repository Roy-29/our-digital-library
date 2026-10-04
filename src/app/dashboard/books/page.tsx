import { db } from '@/db';
import { books, categories, genres, authors, publishers } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import BooksClient from './BooksClient';

export const dynamic = 'force-dynamic'; // Prevent caching

export default async function BooksPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const allBooks = await db.select({
    id: books.id,
    title: books.title,
    titleOriginal: books.titleOriginal,
    isbn: books.isbn,
    coverUrl: books.coverUrl,
    status: books.status,
    owner: books.owner,
    rating: books.rating,
    pageCount: books.pageCount,
    categoryId: books.categoryId,
    genreId: books.genreId,
    authorId: books.authorId,
    publisherId: books.publisherId,
    authorName: authors.name,
    authorNameBn: authors.nameBn,
    publisherName: publishers.name,
    publisherNameBn: publishers.nameBn,
  })
  .from(books)
  .leftJoin(authors, eq(books.authorId, authors.id))
  .leftJoin(publishers, eq(books.publisherId, publishers.id))
  .orderBy(desc(books.createdAt));

  const allCategories = await db.select().from(categories).orderBy(categories.name);
  const allGenres = await db.select().from(genres).orderBy(genres.name);
  const allAuthors = await db.select().from(authors).orderBy(authors.name);
  const allPublishers = await db.select().from(publishers).orderBy(publishers.name);

  return (
    <BooksClient 
      initialBooks={allBooks} 
      categories={allCategories} 
      genres={allGenres} 
      authors={allAuthors} 
      publishers={allPublishers}
      initialStatus={typeof searchParams.status === 'string' ? searchParams.status : undefined}
      initialOwner={typeof searchParams.owner === 'string' ? searchParams.owner : undefined}
    />
  );
}
