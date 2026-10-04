const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function restoreAuthors() {
  const booksRes = await client.execute('SELECT author_id, translator_id, illustrator_id FROM books');
  const ids = new Set();
  for (const row of booksRes.rows) {
    if (row.author_id) ids.add(row.author_id);
    if (row.translator_id) ids.add(row.translator_id);
    if (row.illustrator_id) ids.add(row.illustrator_id);
  }

  console.log(`Found ${ids.size} unique author IDs from books.`);
  let count = 1;
  for (const id of ids) {
    // Check if exists
    const exists = await client.execute({ sql: 'SELECT id FROM authors WHERE id = ?', args: [id] });
    if (exists.rows.length === 0) {
      const name = `Recovered Name ${count++}`;
      await client.execute({
        sql: 'INSERT INTO authors (id, name, name_bn, is_author, is_translator, is_illustrator) VALUES (?, ?, ?, 1, 0, 0)',
        args: [id, name, name]
      });
      console.log(`Restored missing ID ${id} as ${name}`);
    }
  }
}

restoreAuthors().catch(console.error);
