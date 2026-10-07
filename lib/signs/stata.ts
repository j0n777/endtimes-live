// Leitor mínimo de arquivos Stata .dta, formatos 117–119 (07/10/2026). Lê só colunas
// numéricas; texto vira null. Usado para o índice GPR de Caldara & Iacoviello, publicado
// atualizado só em .dta e .xls. Especificação: https://www.stata.com/help.cgi?dta
const TYPE_WIDTH: Record<number, number> = { 65526: 8, 65527: 4, 65528: 4, 65529: 2, 65530: 1, 32768: 8 };
// Acima destes valores o Stata guarda "missing" (., .a, .b…).
const MISSING_ABOVE: Record<number, number> = { 65526: 8.988465674311579e307, 65527: 1.701e38, 65528: 2147483620, 65529: 32740, 65530: 100 };

export function readDta(data: Uint8Array): Record<string, Array<number | null>> {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const ascii = (from: number, len: number) => new TextDecoder('latin1').decode(data.subarray(from, from + len));
    const find = (tag: string, from = 0) => {
        const at = ascii(0, Math.min(data.length, 4096)).indexOf(tag, from);
        if (at < 0) throw new Error(`.dta sem ${tag}`);
        return at + tag.length;
    };

    const release = Number(ascii(find('<release>'), 3));
    if (release < 117 || release > 119) throw new Error(`.dta formato ${release} não suportado`);
    const le = ascii(find('<byteorder>'), 3) === 'LSF';
    const nvar = release === 119 ? view.getUint32(find('<K>'), le) : view.getUint16(find('<K>'), le);
    const nobs = release === 117 ? view.getUint32(find('<N>'), le) : Number(view.getBigUint64(find('<N>'), le));
    const mapAt = find('<map>');
    const offset = (i: number) => Number(view.getBigUint64(mapAt + 8 * i, le));

    const typesAt = offset(2) + '<variable_types>'.length;
    const types = Array.from({ length: nvar }, (_, i) => view.getUint16(typesAt + 2 * i, le));
    const nameLen = release === 117 ? 33 : 129;
    const namesAt = offset(3) + '<varnames>'.length;
    const names = Array.from({ length: nvar }, (_, i) => {
        const raw = data.subarray(namesAt + i * nameLen, namesAt + (i + 1) * nameLen);
        return new TextDecoder().decode(raw.subarray(0, raw.indexOf(0) < 0 ? raw.length : raw.indexOf(0)));
    });
    const widths = types.map(t => TYPE_WIDTH[t] ?? (t >= 1 && t <= 2045 ? t : NaN));
    if (widths.some(Number.isNaN)) throw new Error('.dta com tipo de variável desconhecido');
    const rowWidth = widths.reduce((a, b) => a + b, 0);

    const dataAt = offset(9) + '<data>'.length;
    const columns: Record<string, Array<number | null>> = Object.fromEntries(names.map(n => [n, []]));
    for (let r = 0; r < nobs; r++) {
        let p = dataAt + r * rowWidth;
        for (let v = 0; v < nvar; v++) {
            const t = types[v];
            let value: number | null = null;
            if (t === 65526) value = view.getFloat64(p, le);
            else if (t === 65527) value = view.getFloat32(p, le);
            else if (t === 65528) value = view.getInt32(p, le);
            else if (t === 65529) value = view.getInt16(p, le);
            else if (t === 65530) value = view.getInt8(p);
            if (value !== null && value > MISSING_ABOVE[t]) value = null;
            columns[names[v]].push(value);
            p += widths[v];
        }
    }
    return columns;
}
