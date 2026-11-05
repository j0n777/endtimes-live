import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from 'lovable-tagger';
import { seoFiles } from './lib/seo/pages';
import type { SignsHistoryEntry } from './lib/signs/types';

// Histórico diário do Ω, publicado pelo worker (lib/collectors/SignsCollector.ts).
// Se o Storage não responder, o build segue sem as páginas de histórico em vez de
// publicar números velhos ou travar o deploy.
const HISTORY_URL = `${process.env.VITE_SUPABASE_URL || 'https://bimfztwwzuwwefxfkkwe.supabase.co'}/storage/v1/object/public/data/signs-history.json`;

async function loadSignsHistory(): Promise<SignsHistoryEntry[]> {
  try {
    const res = await fetch(HISTORY_URL, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.every(h => typeof h?.date === 'string' && h.percentiles)) throw new Error('formato inesperado');
    return [...data].sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.warn(`⚠️ seo-static: histórico do Ω indisponível (${err instanceof Error ? err.message : err}); páginas de histórico ficam fora deste build.`);
    return [];
  }
}

// Páginas estáticas, sitemap.xml, llms.txt e o CSV do histórico (lib/seo/pages.ts), gerados a cada build.
const seoStatic = {
  name: 'seo-static',
  apply: 'build' as const,
  async generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
    const history = await loadSignsHistory();
    for (const [fileName, source] of Object.entries(seoFiles(new Date(), history))) this.emitFile({ type: 'asset', fileName, source });
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
