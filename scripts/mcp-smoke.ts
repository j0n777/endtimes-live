// Smoke test do servidor MCP contra os dados reais, só leitura (chave publicável).
// Faz 11 requisições; 4 delas leem a origem (2 arquivos do Storage e 2 consultas).
//
//   npx tsx scripts/mcp-smoke.ts                      roda o handler neste processo
//   npx tsx scripts/mcp-smoke.ts --url <endpoint>     testa um servidor no ar ou local
//
//   npx tsx scripts/mcp-smoke.ts --url <endpoint> --rate-check
//       depois das verificações, repete uma chamada que vem do cache (até 40 vezes), cada
//       uma com um X-Forwarded-For inventado diferente, e para na primeira recusa por
//       limite. Mostra se cabeçalho inventado consegue escapar do limite por endereço.
//
// Sai com código diferente de zero se alguma verificação falhar.
import { createServer } from '../supabase/functions/mcp/server';

const urlArg = process.argv.indexOf('--url');
const endpoint = urlArg > -1 ? process.argv[urlArg + 1] : null;
const local = endpoint ? null : createServer({ env: name => process.env[name] });
const target = endpoint ?? 'http://in-process.local/functions/v1/mcp';

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` (${detail})` : ''}`);
}

let nextId = 1;
async function post(body: unknown, headers: Record<string, string> = {}) {
    const init = {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
        body: JSON.stringify(body),
    };
    const res = local ? await local(new Request(target, init)) : await fetch(target, init);
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* corpo que não é JSON conta como falha abaixo */ }
    return { status: res.status, json, size: text.length };
}

const legacy = (method: string, params?: unknown) => post({ jsonrpc: '2.0', id: nextId++, method, ...(params ? { params } : {}) }, { 'mcp-protocol-version': '2025-06-18' });
const META = { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': { name: 'mcp-smoke', version: '1' }, 'io.modelcontextprotocol/clientCapabilities': {} };
const modern = (method: string, params: Record<string, unknown> = {}) => post(
    { jsonrpc: '2.0', id: nextId++, method, params: { ...params, _meta: META } },
    { 'mcp-protocol-version': '2026-07-28', 'mcp-method': method, ...(typeof params.name === 'string' ? { 'mcp-name': params.name } : {}) },
);
async function call(name: string, args: Record<string, unknown> = {}) {
    const r = await legacy('tools/call', { name, arguments: args });
    const result = r.json?.result;
    const text: string = result?.content?.[0]?.text ?? '';
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* idem */ }
    return { isError: result?.isError, body, text, size: text.length };
}

const EXPECTED = ['endtimes_get_signs', 'endtimes_get_signs_history', 'endtimes_search_events', 'endtimes_get_event'];
const INTERNAL = /metadata|collector_name|geocod|ai_summary|source_type|fetched_at|priority|t\.me\/|"@/;
const hasEnvelope = (b: any) => !!b && typeof b.updated_at === 'string' && !Number.isNaN(Date.parse(b.updated_at)) && typeof b.source?.url === 'string' && typeof b.notice === 'string';

async function main() {
    console.log(`Alvo: ${endpoint ?? 'handler neste processo, dados reais'}\n`);

    const init = await legacy('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'mcp-smoke', version: '1' } });
    check('initialize (clientes de 2025)', init.status === 200 && init.json?.result?.protocolVersion === '2025-06-18' && init.json?.result?.serverInfo?.name === 'endtimes-live');
    const disc = await modern('server/discover');
    check('server/discover (protocolo 2026-07-28)', disc.status === 200 && disc.json?.result?.supportedVersions?.includes('2026-07-28'));
    const list = await legacy('tools/list');
    const names = (list.json?.result?.tools ?? []).map((t: any) => t.name);
    check('tools/list devolve as 4 tools esperadas', JSON.stringify(names) === JSON.stringify(EXPECTED), names.join(', '));
    check('toda tool com título, hints e schema estrito', (list.json?.result?.tools ?? []).every((t: any) => t.title && t.annotations?.readOnlyHint === true && t.annotations?.destructiveHint === false && t.annotations?.openWorldHint === false && t.inputSchema?.additionalProperties === false));

    const signs = await call('endtimes_get_signs');
    check('get_signs: envelope, Ω e 9 sinais', signs.isError === false && hasEnvelope(signs.body) && signs.body.data.signs.length === 9 && 'level' in signs.body.data.omega,
        `Ω ${signs.body?.data?.omega?.level}, tensão ${signs.body?.data?.tension?.level}, atualizado ${signs.body?.updated_at}, stale ${signs.body?.stale ?? false}, ${signs.size} caracteres`);

    const history = await call('endtimes_get_signs_history', { limit: 7 });
    check('get_signs_history: 7 dias, resumo e período disponível', history.isError === false && hasEnvelope(history.body) && history.body.data.length === 7 && history.body.summary?.days > 0,
        `${history.body?.available?.from} a ${history.body?.available?.to}, ${history.size} caracteres`);

    const events = await call('endtimes_search_events', { limit: 5 });
    const items: any[] = events.body?.data ?? [];
    check('search_events: envelope, total e itens com fonte', events.isError === false && hasEnvelope(events.body) && typeof events.body.total === 'number' && items.length > 0 && items.every(e => e.id && e.title && e.source?.name),
        `${items.length} de ${events.body?.total}, has_more ${events.body?.has_more}, ${events.size} caracteres`);
    check('search_events: só os campos públicos', items.every(e => Object.keys(e).join(',') === 'id,title,excerpt,category,severity,location,lat,lng,occurred_at,source') && !INTERNAL.test(events.text));
    check('search_events: trecho com até 280 caracteres', items.every(e => e.excerpt.length <= 280));

    if (items[0]) {
        const one = await call('endtimes_get_event', { id: items[0].id });
        check('get_event: mesmo evento, com link do site', one.isError === false && hasEnvelope(one.body) && one.body.data.id === items[0].id && one.body.data.url.includes(items[0].id) && !INTERNAL.test(one.text), `${one.size} caracteres`);
    }

    const bad = await call('endtimes_search_events', { limit: 500 });
    check('valor fora da faixa é recusado com erro legível', bad.isError === true && bad.body?.error?.code === 'invalid_input', bad.body?.error?.message);
    const extra = await call('endtimes_get_signs', { sign: 'wars' });
    check('argumento desconhecido é recusado', extra.isError === true && extra.body?.error?.code === 'invalid_input', extra.body?.error?.message);
    const viaModern = await modern('tools/call', { name: 'endtimes_get_signs', arguments: {} });
    check('tools/call no protocolo 2026-07-28 (resposta do cache)', viaModern.status === 200 && viaModern.json?.result?.resultType === 'complete' && viaModern.json?.result?.isError === false);

    if (process.argv.includes('--rate-check')) {
        let limitedAt = 0, wait = 0;
        for (let i = 1; i <= 40 && !limitedAt; i++) {
            const fake = `198.51.100.${i}`;
            const r = await post({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'endtimes_get_signs', arguments: {} } },
                { 'mcp-protocol-version': '2025-06-18', 'x-forwarded-for': fake, 'x-real-ip': fake, 'x-client-ip': fake });
            const text: string = r.json?.result?.content?.[0]?.text ?? '';
            if (r.json?.result?.isError && text.includes('rate_limited')) { limitedAt = i; wait = JSON.parse(text).error.retry_after_seconds; }
        }
        check('limite por endereço resiste a cabeçalho inventado', limitedAt > 0,
            limitedAt ? `recusou na chamada ${limitedAt} deste teste, espera de ${wait} s` : '40 chamadas e nenhuma recusa: o endereço de quem chama não está sendo identificado, ou as instâncias não dividem os contadores');
    }

    console.log(failures ? `\n${failures} verificação(ões) falharam` : '\nSmoke do MCP passou');
    process.exit(failures ? 1 : 0);
}

main();
