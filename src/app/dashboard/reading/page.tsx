import { db } from '@/db';
import { books, authors } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import ReadingClient from './ReadingClient';

export const dynamic = 'force-dynamic';

export default async function ReadingPage() {
  const currentlyReading = await db.select({
    id: books.id,
    title: books.title,
    coverUrl: books.coverUrl,
    status: books.status,
    owner: books.owner,
    readingProgress: books.readingProgress,
    readingStartDate: books.readingStartDate,
    authorName: authors.name,
    authorNameBn: authors.nameBn,
    readingStatus: books.readingStatus,
  })
  .from(books)
  .leftJoin(authors, eq(books.authorId, authors.id))
  .where(inArray(books.readingStatus, ['পড়ছি', 'পড়ছি (কাছে নেই)', 'লাইব্রেরি থেকে পড়া', 'ধার করে পড়া']))
  .orderBy(desc(books.readingStartDate));

  const recentlyFinished = await db.select({
    id: books.id,
    title: books.title,
    coverUrl: books.coverUrl,
    status: books.status,
    owner: books.owner,
    rating: books.rating,
    readingFinishDate: books.readingFinishDate,
    authorName: authors.name,
    authorNameBn: authors.nameBn,
    readingStatus: books.readingStatus,
  })
  .from(books)
  .leftJoin(authors, eq(books.authorId, authors.id))
  .where(inArray(books.readingStatus, ['পড়া শেষ', 'পড়া শেষ (কাছে নেই)']))
  .orderBy(desc(books.readingFinishDate))
  .limit(20);

  return (
    <ReadingClient 
      initialCurrentlyReading={currentlyReading} 
      initialRecentlyFinished={recentlyFinished}
      userId={undefined} 
    />
  );
}
