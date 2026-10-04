const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const users = [
    { id: 'swapnil', name: 'স্বপ্নীল', role: 'admin' },
    { id: 'bipro', name: 'বিপ্রতীব', role: 'admin' },
    { id: 'srrijan', name: 'সৃজন', role: 'admin' },
  ];

  for (const u of users) {
    await client.execute({
      sql: `INSERT INTO profiles (id, display_name, role) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, role = excluded.role`,
      args: [u.id, u.name, u.role]
    });
  }

  const res = await client.execute('SELECT * FROM profiles');
  console.log('Profiles ensured:', res.rows);
}

main().catch(console.error);
