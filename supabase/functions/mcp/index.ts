// Supabase Edge Function entry point for the End Times Monitor MCP server.
// Public, keyless and read-only: deploy with JWT verification off for this function
// only (see supabase/config.toml and docs/MCP_SERVER.md).
// URL: https://<project-ref>.supabase.co/functions/v1/mcp

import { createServer } from './server.ts';

declare const Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

const handler = createServer({ env: name => Deno.env.get(name) });

Deno.serve(req => handler(req));
