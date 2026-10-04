const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixBiproBooks() {
  const authorRes = await client.execute("SELECT id FROM authors WHERE name = 'হুমায়ূন আহমেদ' LIMIT 1");
  const authorId = authorRes.rows[0].id;
  
  await client.execute({
    sql: "UPDATE books SET author_id = ? WHERE title IN ('হিমু সমগ্র', 'মাতাল হাওয়া') AND owner = 'bipro'",
    args: [authorId]
  });
  
  console.log('Fixed Bipro books to Humayun Ahmed.');
}

fixBiproBooks().catch(console.error);
