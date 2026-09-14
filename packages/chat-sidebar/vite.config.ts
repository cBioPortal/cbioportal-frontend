import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

// The sidebar is loaded inside an iframe at /chat-sidebar/index.html from the
// host cBioPortal frontend. Use a relative base so the built assets work no
// matter where the bundle is mounted.

// In dev, serve over HTTPS so the iframe loads inside cbioportal.org (which is
// also HTTPS). The cert files are produced by `tailscale cert <hostname>` and
// kept under certs/ (gitignored). When absent, fall back to plain HTTP.
const certDir = path.resolve(__dirname, 'certs');
const certFile = fs.existsSync(certDir)
    ? fs.readdirSync(certDir).find(f => f.endsWith('.crt'))
    : undefined;
const https = certFile
    ? {
          cert: fs.readFileSync(path.join(certDir, certFile)),
          key: fs.readFileSync(
              path.join(certDir, certFile.replace(/\.crt$/, '.key'))
          ),
      }
    : undefined;

// Dev-only: make /api/chat/* answer with a fixed status so the rejection states
// the deployed portal produces (401 expired session, 403 no CHAT role, 502 chat
// server down) can be looked at without a backend. Set CHAT_FAKE_STATUS to try
// one, e.g. `CHAT_FAKE_STATUS=403 pnpm dev`.
const fakeStatus = Number(process.env.CHAT_FAKE_STATUS) || 0;
const fakeChatStatus: Plugin = {
    name: 'chat-fake-status',
    configureServer(server) {
        if (!fakeStatus) return;
        server.middlewares.use('/api/chat', (_req, res) => {
            res.statusCode = fakeStatus;
            res.end();
        });
    },
};

export default defineConfig({
    plugins: [react(), tailwindcss(), fakeChatStatus],
    base: './',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        https,
        // The host cBioPortal page (cbioportal.org with localdev, or localhost)
        // hits /api/chat/* here cross-origin. Vite intercepts OPTIONS preflights
        // before the proxy can run, so its own cors config has to permit them.
        cors: {
            origin: true,
            credentials: false,
        },
        proxy: {
            '/api': 'http://localhost:4000',
        },
    },
});
