import './env.js'; // must be first — see env.ts
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db/client.js';

// Run as its own deploy step, before the server starts — never from the server
// itself, so several replicas starting at once can't race on the schema. The
// folder sits beside src/ and dist/, so the same path works from either.
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../drizzle', import.meta.url));

try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log('chat-sidebar-server: migrations applied');
} finally {
    await pool.end();
}
