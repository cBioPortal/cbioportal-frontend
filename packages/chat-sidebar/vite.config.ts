import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The sidebar is loaded inside an iframe at /chat-sidebar/index.html from the
// host cBioPortal frontend. Use a relative base so the built assets work no
// matter where the bundle is mounted.
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        port: 5174,
    },
});
