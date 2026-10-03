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
