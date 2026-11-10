import { defineConfig } from 'drizzle-kit';

// `drizzle-kit generate` writes a migration for each schema change into
// drizzle/, which is committed and applied by `pnpm migrate`.
export default defineConfig({
    dialect: 'postgresql',
    schema: './src/db/schema.ts',
    out: './drizzle',
});
