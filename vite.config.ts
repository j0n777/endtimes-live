import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from 'lovable-tagger';
import { seoFiles } from './lib/seo/pages';

// Páginas estáticas, sitemap.xml e llms.txt (lib/seo/pages.ts), gerados a cada build.
const seoStatic = {
  name: 'seo-static',
  apply: 'build' as const,
  generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
    for (const [fileName, source] of Object.entries(seoFiles())) this.emitFile({ type: 'asset', fileName, source });
  },
};

export default defineConfig(({ mode }) => {
  return {
    server: {
      // Porta e host que o preview da Lovable espera.
      port: 8080,
      host: '::',
    },
    // componentTagger dá ao editor visual da Lovable a seleção de elementos (só em dev).
    plugins: [react(), seoStatic, mode === 'development' && componentTagger()].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            leaflet: ['leaflet'],
            icons: ['lucide-react'],
            supabase: ['@supabase/supabase-js'],
            maplibre: ['maplibre-gl', '@maplibre/maplibre-gl-leaflet']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
