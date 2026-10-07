// Leitor mínimo de XLSX (07/10/2026): só o necessário para tabelas de números e textos,
// sem fórmulas nem formatação. Usado para a planilha "Pink Sheet" do Banco Mundial.
import { strFromU8, unzipSync } from 'fflate';

const decode = (s: string) => s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Coluna "AB" → índice 27 (0-based). */
function columnIndex(ref: string): number {
    let n = 0;
    for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
}

/** Linhas da aba `sheetName`, cada uma como array de strings (célula vazia = ''). */
export function readXlsxSheet(data: Uint8Array, sheetName: string): string[][] {
    const files = unzipSync(data);
    const text = (path: string) => (files[path] ? strFromU8(files[path]) : '');

    const workbook = text('xl/workbook.xml');
    const sheet = [...workbook.matchAll(/<sheet\b[^>]*>/g)].map(m => m[0])
        .find(tag => decode(tag.match(/\bname="([^"]*)"/)?.[1] ?? '') === sheetName);
    const relId = sheet?.match(/\br:id="([^"]+)"/)?.[1];
    if (!relId) throw new Error(`aba "${sheetName}" não encontrada`);
    const rels = text('xl/_rels/workbook.xml.rels');
    const relTag = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map(m => m[0]).find(tag => tag.includes(`Id="${relId}"`));
    const target = relTag?.match(/\bTarget="([^"]+)"/)?.[1];
    if (!target) throw new Error(`relação ${relId} não encontrada`);
    const sheetXml = text(target.startsWith('/') ? target.slice(1) : `xl/${target}`);

    const shared = [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
        .map(m => decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join('')));

    return [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(row => {
        const cells: string[] = [];
        for (const c of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
            const ref = c[1].match(/\br="([A-Z]+\d+)"/)?.[1];
            const type = c[1].match(/\bt="([^"]+)"/)?.[1];
            const raw = c[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? c[2]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? '';
            const value = type === 's' ? shared[Number(raw)] ?? '' : decode(raw);
            cells[ref ? columnIndex(ref) : cells.length] = value;
        }
        return Array.from(cells, v => v ?? '');
    });
}
