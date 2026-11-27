// Must be imported first — core.ts reads process.env.* at module load.
import { config as loadEnv } from 'dotenv';

loadEnv();
loadEnv({ path: '.env.local', override: true });
