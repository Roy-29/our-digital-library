---
name: prevent_data_loss
description: Strictly forbids the AI from executing commands that cause data loss in the database, such as drizzle-kit push --force.
---

# Database Data Loss Prevention

CRITICAL RULE: You are STRICTLY FORBIDDEN from deleting, truncating, or dropping tables, columns, or any database data. 

When working with Drizzle ORM and SQLite/Turso:
1. **NEVER use `drizzle-kit push --force` or `--accept-data-loss`.** These commands can completely wipe tables if there is a schema mismatch.
2. **Mandatory Preview Before Action:** Before you or the user apply any database schema change (via `push` or `migrate`), you MUST first generate the changes (`npx drizzle-kit generate` or equivalent). 
3. **Show Details & Ask for "OK":** Read the generated `.sql` file and explain to the user EXACTLY what will change (e.g., "Adding column X to table Y"). Then, you MUST ask the user: "Here are the changes. Reply 'OK' to proceed." You cannot run the final push/migrate command until the user explicitly says "OK".
4. **Explicit Warning for DROP/DELETE:** If the generated SQL contains `DROP TABLE`, `DROP COLUMN`, `DELETE`, or `TRUNCATE`, you MUST show a severe, bolded **⚠️ WARNING ⚠️** telling the user that data will be permanently deleted. Explain exactly what data is at risk. 
5. **No Automatic execution:** Do not string commands together like `npx drizzle-kit generate && npx drizzle-kit migrate`. Always pause after generation to await user confirmation.

Failure to follow this rule will result in irreversible data loss and is unacceptable.
