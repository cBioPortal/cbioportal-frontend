import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        https,
        proxy: {
            '/api': 'http://localhost:4000',
        },
    },
});
