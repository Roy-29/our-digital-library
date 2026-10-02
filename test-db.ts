import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './src/db/index';
import { books, shelves, rooms } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    const bookData = {
      title: 'বম্নভবচভ',
      owner: 'swapnil',
      status: 'আছে',
      isPurchased: true,
      addedBy: 'local-user'
    };
    // @ts-ignore
    const result = await db.insert(books).values(bookData).returning();
    console.log("✅ Insert SUCCESSFUL!", result);
  } catch (err: any) {
    console.error("❌ Insert failed:", err.cause?.message || err.message);
  }
}

testConnection();
