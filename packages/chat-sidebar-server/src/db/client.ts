import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error(
        'DATABASE_URL is required — chat history is kept in Postgres.'
    );
}

export const pool = new pg.Pool({ connectionString });

// An idle client losing its connection (a database restart, a dropped socket)
// is reported here; without a listener it would crash the process. The pool
// replaces the client on the next query.
pool.on('error', err => {
    console.error('postgres pool error:', err.message);
});

export const db = drizzle({ client: pool, schema });
