import { db } from './src/db/index';
import { books, shelves, rooms } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log("Checking tables...");
    const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
    console.log("Tables found:", result.rows.map(r => r.name).filter(n => !n.toString().startsWith('_')));
    console.log("✅ Database connection is SUCCESSFUL!");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

testConnection();
