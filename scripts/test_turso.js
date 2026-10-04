const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
client.execute("SELECT name FROM sqlite_master WHERE type='table'").then(res => console.log(res.rows)).catch(console.error);
