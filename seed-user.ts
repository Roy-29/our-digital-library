import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './src/db/index';

async function seedUser() {
  try {
    await db.run(
      "INSERT INTO profiles (id, display_name, role) VALUES ('local-user', 'Admin', 'admin')"
    );
    console.log("User seeded!");
  } catch (err) {
    console.error(err);
  }
}
seedUser();
