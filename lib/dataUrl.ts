// URL dos JSONs gerados pelo worker (defcon.json, cams.json, tles.json).
// 14/09/2026: o worker deixou de escrever num volume do nginx da VPS e passou a
// publicar no bucket público 'data' do Supabase Storage, para o front poder ser
// hospedado em qualquer lugar (Lovable). Em dev local ainda dá para servir de
// public/data/ definindo VITE_DATA_BASE_URL=/data.
const DEFAULT_DATA_BASE = 'https://bimfztwwzuwwefxfkkwe.supabase.co/storage/v1/object/public/data';
export const DATA_BASE_URL: string = (import.meta.env.VITE_DATA_BASE_URL as string | undefined) || DEFAULT_DATA_BASE;
export const dataUrl = (file: string, bust = true): string => `${DATA_BASE_URL}/${file}${bust ? `?t=${Date.now()}` : ''}`;
