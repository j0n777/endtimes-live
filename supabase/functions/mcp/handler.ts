// MCP over Streamable HTTP as a plain (Request) => Response function: stateless, one
// JSON-RPC message per POST, a JSON response, no sessions and no streams. It has no
// dependency on the runtime, so the same code runs in the Edge Function and in the tests.
//
// Two protocol eras are served from the same endpoint (MCP specification, "Versioning
// and Compatibility"):
//   modern  2026-07-28: no handshake; every request carries its protocol version in
//           params._meta, mirrored in the MCP-Protocol-Version, Mcp-Method and Mcp-Name
//           headers; discovery is server/discover.
//   legacy  2025-03-26 to 2025-11-25: opens with initialize. Answered per request, with
//           no session id, so any instance can serve any request.

import { INSTRUCTIONS, SERVER_NAME, SERVER_TITLE, SERVER_VERSION, SITE_URL } from './facts.ts';
import type { RateLimiter } from './ratelimit.ts';
import { validateArgs } from './schema.ts';
import { ToolError, failure, rateLimited, type ToolResult } from './shape.ts';
import { TOOLS, listTools, type ToolContext } from './tools.ts';

export const MODERN_VERSIONS = ['2026-07-28'];
export const LEGACY_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
export const SUPPORTED_VERSIONS = [...MODERN_VERSIONS, ...LEGACY_VERSIONS];

const META_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CAPABILITIES = 'io.modelcontextprotocol/clientCapabilities';
const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';

const SERVER_INFO = { name: SERVER_NAME, title: SERVER_TITLE, version: SERVER_VERSION };

/** How long clients may keep the tool list and the discovery result. */
const LIST_TTL_MS = 3_600_000;
const MAX_BODY_BYTES = 64 * 1024;

// JSON-RPC and MCP error codes.
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const HEADER_MISMATCH = -32020;
const UNSUPPORTED_VERSION = -32022;

export interface HandlerDeps {
    context: ToolContext;
    limiter: RateLimiter;
    /** Browser origins allowed to call the endpoint. '*' allows any. Requests without an
     *  Origin header (assistants, command line clients, servers) always pass. */
    allowedOrigins?: string[];
}

export const DEFAULT_ALLOWED_ORIGINS = [SITE_URL, 'https://www.endtimes.live'];

type Id = string | number | null;
type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function originAllowed(origin: string, allowed: string[]): boolean {
    if (allowed.includes('*') || allowed.includes(origin)) return true;
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);
}

function decodeHeaderValue(value: string): string {
    const m = /^=\?base64\?(.*)\?=$/.exec(value);
    if (!m) return value;
    try {
        return new TextDecoder().decode(Uint8Array.from(atob(m[1]), c => c.charCodeAt(0)));
    } catch {
        return value;
    }
}

export function createHandler(deps: HandlerDeps): (req: Request) => Promise<Response> {
    const allowed = deps.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS;

    return async function handle(req: Request): Promise<Response> {
        const origin = req.headers.get('origin');
        const cors: Record<string, string> = {};
        if (origin) {
            if (!originAllowed(origin, allowed)) {
                return respond(403, rpcError(null, INVALID_REQUEST, 'Origin not allowed.'), {});
            }
            cors['access-control-allow-origin'] = origin;
            cors['vary'] = 'Origin';
        }

        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    ...cors,
                    'access-control-allow-methods': 'POST, OPTIONS',
                    'access-control-allow-headers': 'content-type, accept, authorization, apikey, mcp-protocol-version, mcp-method, mcp-name, mcp-session-id',
                    'access-control-max-age': '86400',
                },
            });
        }
        if (req.method !== 'POST') {
            return respond(405, rpcError(null, INVALID_REQUEST,
                `Method not allowed. This is the ${SERVER_TITLE} MCP endpoint; it accepts JSON-RPC over HTTP POST.`), { ...cors, allow: 'POST, OPTIONS' });
        }

        const declared = Number(req.headers.get('content-length') ?? '0');
        if (declared > MAX_BODY_BYTES) return respond(413, rpcError(null, INVALID_REQUEST, 'Request body too large.'), cors);
        let text: string;
        try {
            text = await req.text();
        } catch {
            return respond(400, rpcError(null, PARSE_ERROR, 'Parse error: the request body could not be read.'), cors);
        }
        if (text.length > MAX_BODY_BYTES) return respond(413, rpcError(null, INVALID_REQUEST, 'Request body too large.'), cors);

        let message: unknown;
        try {
            message = JSON.parse(text);
        } catch {
            return respond(400, rpcError(null, PARSE_ERROR, 'Parse error: the request body is not valid JSON.'), cors);
        }
        if (Array.isArray(message)) {
            return respond(400, rpcError(null, INVALID_REQUEST, 'Batch requests are not supported. Send one JSON-RPC message per POST.'), cors);
        }
        if (!isObject(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
            return respond(400, rpcError(null, INVALID_REQUEST, 'Invalid request: expected a JSON-RPC 2.0 message with a method.'), cors);
        }

        const method = message.method;
        // Notifications (no id) get no JSON-RPC response. Nothing here needs them.
        if (!('id' in message)) return new Response(null, { status: 202, headers: { ...cors, 'cache-control': 'no-store' } });

        const id = message.id as Id;
        if (typeof id !== 'string' && typeof id !== 'number') {
            return respond(400, rpcError(null, INVALID_REQUEST, 'Invalid request: id must be a string or a number.'), cors);
        }
        if (message.params !== undefined && !isObject(message.params)) {
            return respond(400, rpcError(id, INVALID_PARAMS, 'Invalid params: params must be an object.'), cors);
        }
        const params: Json = isObject(message.params) ? message.params : {};
        const meta: Json = isObject(params._meta) ? params._meta : {};
        const headerVersion = req.headers.get('mcp-protocol-version');
        const bodyVersion = meta[META_VERSION];

        const modern = method !== 'initialize'
            && (bodyVersion !== undefined || method === 'server/discover' || (headerVersion !== null && MODERN_VERSIONS.includes(headerVersion)));

        // ── modern era ──────────────────────────────────────────────────────────
        if (modern) {
            if (typeof bodyVersion !== 'string') {
                return respond(400, rpcError(id, INVALID_PARAMS, `Invalid params: params._meta["${META_VERSION}"] is required.`), cors);
            }
            if (headerVersion === null) {
                return respond(400, rpcError(id, HEADER_MISMATCH, 'Header mismatch: the MCP-Protocol-Version header is required.'), cors);
            }
            if (headerVersion !== bodyVersion) {
                return respond(400, rpcError(id, HEADER_MISMATCH, 'Header mismatch: the MCP-Protocol-Version header does not match the protocol version in the request body.'), cors);
            }
            if (!MODERN_VERSIONS.includes(bodyVersion)) return respond(400, unsupportedVersion(id, bodyVersion), cors);
            if (!isObject(meta[META_CAPABILITIES])) {
                return respond(400, rpcError(id, INVALID_PARAMS, `Invalid params: params._meta["${META_CAPABILITIES}"] is required.`), cors);
            }
            const headerMethod = req.headers.get('mcp-method');
            if (headerMethod === null) {
                return respond(400, rpcError(id, HEADER_MISMATCH, 'Header mismatch: the Mcp-Method header is required.'), cors);
            }
            if (headerMethod !== method) {
                return respond(400, rpcError(id, HEADER_MISMATCH, 'Header mismatch: the Mcp-Method header does not match the method in the request body.'), cors);
            }

            const stamp = (result: Json): Json => ({ resultType: 'complete', ...result, _meta: { [META_SERVER_INFO]: SERVER_INFO } });

            if (method === 'server/discover') {
                return respond(200, rpcResult(id, stamp({
                    supportedVersions: SUPPORTED_VERSIONS,
                    capabilities: { tools: {} },
                    instructions: INSTRUCTIONS,
                    ttlMs: LIST_TTL_MS,
                    cacheScope: 'public',
                })), cors);
            }
            if (method === 'tools/list') {
                return respond(200, rpcResult(id, stamp({ tools: listTools(), ttlMs: LIST_TTL_MS, cacheScope: 'public' })), cors);
            }
            if (method === 'tools/call') {
                const headerName = req.headers.get('mcp-name');
                if (headerName === null) {
                    return respond(400, rpcError(id, HEADER_MISMATCH, 'Header mismatch: the Mcp-Name header is required for tools/call.'), cors);
                }
                if (decodeHeaderValue(headerName) !== params.name) {
                    return respond(400, rpcError(id, HEADER_MISMATCH, 'Header mismatch: the Mcp-Name header does not match the tool name in the request body.'), cors);
                }
                const outcome = await callTool(req, params);
                if ('error' in outcome) return respond(200, rpcError(id, INVALID_PARAMS, outcome.error), cors);
                return respond(200, rpcResult(id, stamp({ ...outcome.result })), cors);
            }
            return respond(404, rpcError(id, METHOD_NOT_FOUND, `Method not found: ${clip(method)}`), cors);
        }

        // ── legacy era ──────────────────────────────────────────────────────────
        if (headerVersion !== null && method !== 'initialize' && !LEGACY_VERSIONS.includes(headerVersion)) {
            return respond(400, unsupportedVersion(id, headerVersion), cors);
        }
        switch (method) {
            case 'initialize': {
                const requested = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
                return respond(200, rpcResult(id, {
                    protocolVersion: LEGACY_VERSIONS.includes(requested) ? requested : LEGACY_VERSIONS[0],
                    capabilities: { tools: { listChanged: false } },
                    serverInfo: SERVER_INFO,
                    instructions: INSTRUCTIONS,
                }), cors);
            }
            case 'ping':
                return respond(200, rpcResult(id, {}), cors);
            case 'tools/list':
                return respond(200, rpcResult(id, { tools: listTools() }), cors);
            case 'tools/call': {
                const outcome = await callTool(req, params);
                if ('error' in outcome) return respond(200, rpcError(id, INVALID_PARAMS, outcome.error), cors);
                return respond(200, rpcResult(id, { ...outcome.result }), cors);
            }
            default:
                return respond(200, rpcError(id, METHOD_NOT_FOUND, `Method not found: ${clip(method)}`), cors);
        }
    };

    /** Runs one tool call. `error` is a protocol error (malformed call, unknown tool);
     *  everything a model can act on comes back as a tool result with isError. */
    async function callTool(req: Request, params: Json): Promise<{ result: ToolResult } | { error: string }> {
        if (typeof params.name !== 'string') return { error: 'Invalid params: "name" must be a string.' };
        if (params.arguments !== undefined && params.arguments !== null && !isObject(params.arguments)) {
            return { error: 'Invalid params: "arguments" must be an object.' };
        }

        // Only tools/call is counted. The verdict is a normal tool result the model can read.
        const verdict = await deps.limiter.check(req.headers);
        if (!verdict.allowed) return { result: rateLimited(verdict.retryAfterSeconds) };

        const tool = TOOLS.find(t => t.name === params.name);
        if (!tool) return { error: `Unknown tool: ${clip(params.name)}` };

        const validation = validateArgs(tool.inputSchema, params.arguments);
        if (validation.ok === false) return { result: failure('invalid_input', validation.message) };

        try {
            return { result: await tool.run(validation.args, deps.context) };
        } catch (err) {
            if (err instanceof ToolError) return { result: failure(err.code, err.message, err.retryAfterSeconds) };
            // Details stay in the function log: tool name and error class only, no arguments.
            console.error(`mcp: ${tool.name} failed: ${err instanceof Error ? err.name : 'unknown error'}`);
            return { result: failure('internal_error', 'Internal error. Try again in a moment.') };
        }
    }
}

const clip = (s: string): string => s.replace(/[^\x20-\x7e]/g, '?').slice(0, 80);

function rpcResult(id: Id, result: Json): Json {
    return { jsonrpc: '2.0', id, result };
}

function rpcError(id: Id, code: number, message: string, data?: Json): Json {
    return { jsonrpc: '2.0', ...(id === null ? {} : { id }), error: { code, message, ...(data ? { data } : {}) } };
}

function unsupportedVersion(id: Id, requested: string): Json {
    return rpcError(id, UNSUPPORTED_VERSION, 'Unsupported protocol version', { supported: SUPPORTED_VERSIONS, requested: clip(requested) });
}

function respond(status: number, body: Json, headers: Record<string, string>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
    });
}
