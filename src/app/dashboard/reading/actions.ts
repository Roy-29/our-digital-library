'use server';

import { db } from '@/db';
import { books, activityLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateBookStatus(bookId: string, status: any, progress?: number, startDate?: string, finishDate?: string) {
  const data: any = { status };
  if (progress !== undefined) data.readingProgress = progress;
  if (startDate) data.readingStartDate = startDate;
  if (finishDate) data.readingFinishDate = finishDate;
  
  await db.update(books).set(data).where(eq(books.id, bookId));
  revalidatePath('/dashboard/reading');
}

export async function updateBookProgress(bookId: string, progress: number) {
  await db.update(books).set({ readingProgress: progress }).where(eq(books.id, bookId));
  revalidatePath('/dashboard/reading');
}

export async function addActivity(userId: string, action: string, entityType: string, entityId: string, entityName: string) {
  await db.insert(activityLog).values({
    userId,
    action,
    entityType,
    entityId,
    entityName,
  });
}
