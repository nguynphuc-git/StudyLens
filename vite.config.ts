import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
plugins: [react(), VitePWA({
registerType: 'prompt',
injectRegister: 'auto',
manifest: false,
workbox: {
globPatterns: ['**/*.{js,mjs,css,html,svg,woff,woff2,ttf,wasm,gz}'],
maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
navigateFallback: 'index.html',
// No runtime caching of AI, App Check, or user documents.
runtimeCaching: []
}
})]
});
