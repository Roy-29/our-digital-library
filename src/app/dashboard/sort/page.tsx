import { db } from '@/db';
import { books, categories, genres, authors, publishers } from '@/db/schema';
import { alias } from 'drizzle-orm/sqlite-core';
import { desc, eq } from 'drizzle-orm';
import SortClient from './SortClient';

export const dynamic = 'force-dynamic';

export default async function SortPage() {
  const translators = alias(authors, 'translators');

  const allBooks = await db.select({
    id: books.id,
    title: books.title,
    titleOriginal: books.titleOriginal,
    subtitle: books.subtitle,
    isbn: books.isbn,
    language: books.language,
    edition: books.edition,
    publicationYear: books.publicationYear,
    pageCount: books.pageCount,
    description: books.description,
    coverUrl: books.coverUrl,
    
    authorId: books.authorId,
    authorName: authors.name,
    authorNameBn: authors.nameBn,
    
    translatorId: books.translatorId,
    translatorName: translators.name,
    translatorNameBn: translators.nameBn,
    
    publisherId: books.publisherId,
    publisherName: publishers.name,
    publisherNameBn: publishers.nameBn,
    
    categoryId: books.categoryId,
    categoryName: categories.name,
    categoryNameBn: categories.nameBn,
    categoryIcon: categories.icon,
    
    genreId: books.genreId,
    genreName: genres.name,
    genreNameBn: genres.nameBn,
    genreIcon: genres.icon,
    
    owner: books.owner,
    status: books.status,
    isPurchased: books.isPurchased,
    purchaseDate: books.purchaseDate,
    purchaseSource: books.purchaseSource,
    purchasePrice: books.purchasePrice,
    purchaseDiscount: books.purchaseDiscount,
    purchaseFinalPrice: books.purchaseFinalPrice,
    purchasedBy: books.purchasedBy,
    bookCondition: books.bookCondition,
    
    readingStartDate: books.readingStartDate,
    readingFinishDate: books.readingFinishDate,
    readingProgress: books.readingProgress,
    rating: books.rating,
    review: books.review,
    notes: books.notes,
    favoriteQuote: books.favoriteQuote,
    isFavorite: books.isFavorite,
    
    createdAt: books.createdAt,
  })
  .from(books)
  .leftJoin(authors, eq(books.authorId, authors.id))
  .leftJoin(translators, eq(books.translatorId, translators.id))
  .leftJoin(publishers, eq(books.publisherId, publishers.id))
  .leftJoin(categories, eq(books.categoryId, categories.id))
  .leftJoin(genres, eq(books.genreId, genres.id))
  .orderBy(desc(books.createdAt));

  const allAuthors = await db.select().from(authors).orderBy(authors.name);
  const allPublishers = await db.select().from(publishers).orderBy(publishers.name);
  const allCategories = await db.select().from(categories).orderBy(categories.name);
  const allGenres = await db.select().from(genres).orderBy(genres.name);

  // Extract distinct languages & purchase sources from books
  const languagesSet = new Set<string>();
  const sourcesSet = new Set<string>();
  allBooks.forEach(b => {
    if (b.language) languagesSet.add(b.language);
    if (b.purchaseSource) sourcesSet.add(b.purchaseSource);
  });

  return (
    <SortClient 
      initialBooks={allBooks}
      authors={allAuthors}
      publishers={allPublishers}
      categories={allCategories}
      genres={allGenres}
      languages={Array.from(languagesSet)}
      purchaseSources={Array.from(sourcesSet)}
    />
  );
}
