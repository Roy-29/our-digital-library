const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function listRecoveredAuthors() {
  const result = await client.execute(`
    SELECT a.id, a.name, GROUP_CONCAT(b.title, ' | ') as book_titles
    FROM authors a
    JOIN books b ON b.author_id = a.id OR b.translator_id = a.id OR b.illustrator_id = a.id
    WHERE a.name LIKE 'Recovered Name%'
    GROUP BY a.id
    ORDER BY a.name
  `);
  
  for (const row of result.rows) {
    console.log(`${row.name}: ${row.book_titles}`);
  }
}

listRecoveredAuthors().catch(console.error);
