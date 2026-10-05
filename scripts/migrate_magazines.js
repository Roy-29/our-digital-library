const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('Starting magazine migration...');
  
  // 1. Get all magazines
  const result = await client.execute('SELECT * FROM magazines');
  const allMagazines = result.rows;
  
  console.log(`Found ${allMagazines.length} magazines.`);
  
  if (allMagazines.length === 0) {
    console.log('No magazines to migrate.');
    return;
  }
  
  // Group by title (case insensitive roughly) and owner
  const groups = {};
  
  for (const mag of allMagazines) {
    const key = `${mag.title.toLowerCase().trim()}_${mag.owner}`;
    if (!groups[key]) {
      groups[key] = { parent: mag, issues: [] };
    }
    groups[key].issues.push(mag);
  }
  
  const toDelete = [];
  const toInsertIssues = [];
  
  for (const key in groups) {
    const { parent, issues } = groups[key];
    console.log(`Processing series: ${parent.title} (Issues: ${issues.length})`);
    
    // Create issues
    for (const issue of issues) {
      toInsertIssues.push({
        id: crypto.randomUUID(),
        magazine_id: parent.id, // all map to the parent ID
        issue_month: issue.issue_month,
        issue_year: issue.issue_year,
        volume: issue.volume,
        copies: 1, // Default 1
        status: issue.status || 'আছে',
      });
      
      // If it's not the parent, mark it for deletion
      if (issue.id !== parent.id) {
        toDelete.push(issue.id);
      }
    }
  }
  
  // Insert issues
  if (toInsertIssues.length > 0) {
    const placeholders = toInsertIssues.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = toInsertIssues.flatMap(i => [
      i.id, i.magazine_id, i.issue_month, i.issue_year, i.volume, i.copies, i.status
    ]);
    
    await client.execute({
      sql: `INSERT INTO magazine_issues (id, magazine_id, issue_month, issue_year, volume, copies, status) VALUES ${placeholders}`,
      args: values
    });
    console.log(`Inserted ${toInsertIssues.length} issues.`);
  }
  
  // Delete redundant magazines
  if (toDelete.length > 0) {
    const placeholders = toDelete.map(() => '?').join(', ');
    await client.execute({
      sql: `DELETE FROM magazines WHERE id IN (${placeholders})`,
      args: toDelete
    });
    console.log(`Deleted ${toDelete.length} redundant magazines.`);
  }
  
  console.log('Migration completed.');
}

migrate().catch(console.error);
