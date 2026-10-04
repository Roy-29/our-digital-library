import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function migrate() {
  try {
    console.log('Mapping old reading statuses from status to reading_status...');
    
    await db.execute(`
      UPDATE books 
      SET reading_status = status, status = 'আছে'
      WHERE status IN ('পড়ছি', 'পড়া শেষ', 'পড়া বাকি', 'আবার পড়ব');
    `);

    await db.execute(`
      UPDATE books 
      SET reading_status = status, status = 'নাই'
      WHERE status IN ('পড়া শেষ (কাছে নেই)', 'পড়ছি (কাছে নেই)', 'ধার করে পড়া', 'ই-বুক / পিডিএফ');
    `);

    console.log('Data Migration complete.');
  } catch(e) {
    console.error(e);
  }
}

migrate();
