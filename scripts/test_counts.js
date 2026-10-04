const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
async function check() {
  const a = await client.execute("SELECT count(*) as c FROM authors");
  const p = await client.execute("SELECT count(*) as c FROM publishers");
  console.log("Authors:", a.rows[0].c, "Publishers:", p.rows[0].c);
}
check().catch(console.error);
