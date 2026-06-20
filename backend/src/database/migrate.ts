import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './database';
import * as path from 'path';

async function runMigrations() {
  console.log('🗄️  Running database migrations...');
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '..', '..', '..', 'drizzle'),
    });
    console.log('✅  Migrations completed successfully');
  } catch (error) {
    console.error('❌  Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
