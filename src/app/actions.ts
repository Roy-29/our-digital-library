'use server';

import { db, client } from '@/db';
import { eq, desc, asc } from 'drizzle-orm';
import { 
  profiles, authors, publishers, categories, genres, borrowers, 
  rooms, shelves, racks, wishlist, activityLog, books, lendingRecords
} from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { BACKUP_TABLES } from '@/lib/types';

// Helper to get table
const getTable = (tableName: string) => {
  switch (tableName) {
    case 'profiles': return profiles;
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
  try {
    // @ts-ignore
    const result = await db.update(t).set(data).where(eq(t.id, id)).returning();
    revalidatePath('/dashboard');
    return result[0];
  } catch (error: any) {
    console.error(`[dbUpdate ERROR on table ${table}]:`, error);
    const realError = error.cause?.message || error.message || String(error);
    throw new Error(realError);
  }
}

export async function dbDelete(table: string, id: string) {
  const t = getTable(table);
  // @ts-ignore
  await db.delete(t).where(eq(t.id, id));
  revalidatePath('/dashboard');
  return true;
}

export async function dbUpsert(table: string, data: any | any[]) {
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return [];

  const results: any[] = [];
  for (const item of items) {
    const keys = Object.keys(item);
    if (keys.length === 0) continue;

    const colNames = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => {
      const val = item[k];
      if (val === undefined) return null;
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });

    const sql = `INSERT OR REPLACE INTO "${table}" (${colNames}) VALUES (${placeholders}) RETURNING *`;
    const res = await client.execute({ sql, args: values });
    if (res.rows[0]) results.push(res.rows[0]);
  }
  revalidatePath('/dashboard');
  return Array.isArray(data) ? results : results[0];
}

/**
 * Server-side complete database export
 */
export async function dbExportBackup() {
  const backupData: Record<string, any[]> = {};
  const counts: Record<string, number> = {};

  for (const table of BACKUP_TABLES) {
    const res = await client.execute(`SELECT * FROM "${table}"`);
    backupData[table] = res.rows;
    counts[table] = res.rows.length;
  }

  return {
    version: '1.0',
    app: 'digital-library',
    exported_at: new Date().toISOString(),
    summary: counts,
    data: backupData,
  };
}

/**
 * Server-side complete database restore
 */
export async function dbRestoreBackup(backupPayload: any) {
  const tablesData = backupPayload?.data || backupPayload;
  if (!tablesData || typeof tablesData !== 'object') {
    throw new Error('অবৈধ ব্যাকআপ ফাইল। সঠিক JSON ফরম্যাটের ফাইল আপলোড করুন।');
  }

  const restoredCounts: Record<string, number> = {};

  try {
    // Disable foreign keys temporarily during bulk restore to handle interdependent rows
    await client.execute('PRAGMA foreign_keys = OFF;');

    for (const table of BACKUP_TABLES) {
      const rows = tablesData[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      let count = 0;
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;

        const keys = Object.keys(row);
        if (keys.length === 0) continue;

        const colNames = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => {
          const val = row[k];
          if (val === undefined) return null;
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
          }
          return val;
        });

        const sql = `INSERT OR REPLACE INTO "${table}" (${colNames}) VALUES (${placeholders})`;
        await client.execute({ sql, args: values });
        count++;
      }
      restoredCounts[table] = count;
    }
  } catch (err: any) {
    console.error('[dbRestoreBackup error]:', err);
    throw new Error(err.message || 'পুনরুদ্ধার ব্যর্থ হয়েছে');
  } finally {
    // Always re-enable foreign keys
    await client.execute('PRAGMA foreign_keys = ON;');
  }

  try {
    revalidatePath('/dashboard');
  } catch {
    // ignore outside request context
  }
  return { success: true, counts: restoredCounts };
}

/**
 * Export table data to CSV with UTF-8 BOM
 */
export async function dbExportTableCsv(table: string) {
  const validTables = ['books', 'authors', 'publishers', 'wishlist', 'borrowers', 'lending_records'];
  if (!validTables.includes(table)) {
    throw new Error('অননুমোদিত টেবিল');
  }

  const res = await client.execute(`SELECT * FROM "${table}"`);
  const rows = res.rows;
  if (!rows || rows.length === 0) {
    return { csv: '\uFEFF', count: 0 };
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map((row: any) =>
      headers
        .map((h: string) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];

  // Add UTF-8 Byte Order Mark (BOM) so Excel opens Bengali characters properly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  return { csv: csvContent, count: rows.length };
}

/**
 * Direct Excel / CSV book rows importer
 */
export async function dbImportBooks(booksList: any[], owner: string) {
  if (!Array.isArray(booksList) || booksList.length === 0) {
    throw new Error('ফাইলে কোনো বইয়ের তথ্য পাওয়া যায়নি');
  }

  let imported = 0;
  for (const b of booksList) {
    const title =
      b.title ||
      b.Title ||
      b['বইয়ের নাম'] ||
      b['বইয়ের নাম'] ||
      b['বইয়ের নাম*'] ||
      b['বই'] ||
      b['Book Title'] ||
      b['Name'];
    if (!title || !String(title).trim()) continue;

    const authorName =
      b.author || b.Author || b['লেখক'] || b['লেখকের নাম'] || b['Author Name'];
    const publisherName =
      b.publisher || b.Publisher || b['প্রকাশক'] || b['প্রকাশনী'] || b['Publisher Name'];
    const categoryName =
      b.category || b.Category || b['ক্যাটাগরি'] || b['বিভাগ'] || b['Genre'];
    const isbn = b.isbn || b.ISBN || b['আইএসবিএন'] || null;
    const priceRaw = b.price || b.Price || b['দাম'] || b['মূল্য'] || null;
    const price = priceRaw ? parseFloat(String(priceRaw).replace(/[^0-9.]/g, '')) : null;

    let authorId: string | null = null;
    if (authorName && String(authorName).trim()) {
      const aName = String(authorName).trim();
      const existing = await client.execute({
        sql: 'SELECT id FROM authors WHERE name = ? OR name_bn = ? LIMIT 1',
        args: [aName, aName],
      });
      if (existing.rows[0]) {
        authorId = existing.rows[0].id as string;
      } else {
        const newId = crypto.randomUUID();
        await client.execute({
          sql: 'INSERT INTO authors (id, name, name_bn, is_author) VALUES (?, ?, ?, 1)',
          args: [newId, aName, aName],
        });
        authorId = newId;
      }
    }

    let publisherId: string | null = null;
    if (publisherName && String(publisherName).trim()) {
      const pName = String(publisherName).trim();
      const existing = await client.execute({
        sql: 'SELECT id FROM publishers WHERE name = ? OR name_bn = ? LIMIT 1',
        args: [pName, pName],
      });
      if (existing.rows[0]) {
        publisherId = existing.rows[0].id as string;
      } else {
        const newId = crypto.randomUUID();
        await client.execute({
          sql: 'INSERT INTO publishers (id, name, name_bn) VALUES (?, ?, ?)',
          args: [newId, pName, pName],
        });
        publisherId = newId;
      }
    }

    let categoryId: string | null = null;
    if (categoryName && String(categoryName).trim()) {
      const cName = String(categoryName).trim();
      const existing = await client.execute({
        sql: 'SELECT id FROM categories WHERE name = ? OR name_bn = ? LIMIT 1',
        args: [cName, cName],
      });
      if (existing.rows[0]) {
        categoryId = existing.rows[0].id as string;
      } else {
        const newId = crypto.randomUUID();
        await client.execute({
          sql: 'INSERT INTO categories (id, name, name_bn) VALUES (?, ?, ?)',
          args: [newId, cName, cName],
        });
        categoryId = newId;
      }
    }

    const bookId = crypto.randomUUID();
    const finalOwner = owner || 'swapnil';
    await client.execute({
      sql: `INSERT INTO books (
        id, title, author_id, publisher_id, category_id, isbn, purchase_price, purchase_final_price, owner, status, is_purchased, added_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'আছে', 1, ?)`,
      args: [
        bookId,
        String(title).trim(),
        authorId,
        publisherId,
        categoryId,
        isbn ? String(isbn).trim() : null,
        price || null,
        price || null,
        finalOwner,
        finalOwner,
      ],
    });
    imported++;
  }

  try {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/books');
  } catch {}

  return { success: true, count: imported };
}

