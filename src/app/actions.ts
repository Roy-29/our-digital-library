'use server';

import { db } from '@/db';
import { eq, desc, asc, and } from 'drizzle-orm';
import { 
  authors, publishers, categories, genres, borrowers, 
  rooms, shelves, racks, wishlist, activityLog, books, lendingRecords
} from '@/db/schema';
import { revalidatePath } from 'next/cache';

// Helper to get table
const getTable = (tableName: string) => {
  switch (tableName) {
    case 'authors': return authors;
    case 'publishers': return publishers;
    case 'categories': return categories;
    case 'genres': return genres;
    case 'borrowers': return borrowers;
    case 'rooms': return rooms;
    case 'shelves': return shelves;
    case 'racks': return racks;
    case 'wishlist': return wishlist;
    case 'activity_log': return activityLog;
    case 'books': return books;
    case 'lending_records': return lendingRecords;
    default: throw new Error(`Unknown table: ${tableName}`);
  }
};

export async function dbSelect(table: string, orderByCol?: string, ascending = true) {
  const t = getTable(table);
  let query = db.select().from(t) as any;
  if (orderByCol) {
    // Basic order by support
    query = query.orderBy(ascending ? asc(t[orderByCol as keyof typeof t] as any) : desc(t[orderByCol as keyof typeof t] as any));
  }
  return await query;
}

export async function dbInsert(table: string, data: any) {
  const t = getTable(table);
  try {
    // @ts-ignore
    const result = await db.insert(t).values(data).returning();
    revalidatePath('/dashboard');
    return result[0];
  } catch (error: any) {
    console.error(`[dbInsert ERROR on table ${table}]:`, error);
    const realError = error.cause?.message || error.message || String(error);
    throw new Error(realError);
  }
}

export async function dbUpdate(table: string, id: string, data: any) {
  const t = getTable(table);
  // @ts-ignore
  const result = await db.update(t).set(data).where(eq(t.id, id)).returning();
  revalidatePath('/dashboard');
  return result[0];
}

export async function dbDelete(table: string, id: string) {
  const t = getTable(table);
  // @ts-ignore
  await db.delete(t).where(eq(t.id, id));
  revalidatePath('/dashboard');
  return true;
}
