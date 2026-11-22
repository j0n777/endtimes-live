# MCP server

End Times Monitor has a [Model Context Protocol](https://modelcontextprotocol.io) server so AI assistants can read the same public data the site shows: the Ω index, the signs, the military tension level, their daily history and the events on the live map.

It is public, keyless and read-only. It runs as one Supabase Edge Function (`supabase/functions/mcp`) with no dependencies.

| | |
|---|---|
| Endpoint | `https://bimfztwwzuwwefxfkkwe.supabase.co/functions/v1/mcp` (after deploy) |
| Transport | Streamable HTTP: one JSON-RPC message per `POST`, JSON response. Stateless, no sessions, no streams. `GET` answers 405. |
| Protocol versions | `2026-07-28` (per-request metadata, `server/discover`) and the handshake versions `2025-11-25`, `2025-06-18`, `2025-03-26` (`initialize`) |
| Auth | None |
| Language | English |

## Tools

| Tool | What it answers | Arguments | Typical size |
|---|---|---|---|
| `endtimes_get_signs` | The current Ω level, the anomalous signs, the tension level and all 9 signs with value, percentile, trend, period, source and what is measured | none | about 6,000 characters |
| `endtimes_get_signs_history` | Daily Ω level, tension level and percentiles, newest first, with a summary of the requested range | `from`, `to` (YYYY-MM-DD), `limit` (1 to 90, default 30), `cursor` | about 200 characters per day |
| `endtimes_search_events` | Map events, newest first: headline, excerpt (up to 280 characters), category, severity, place, coordinates, time, original source name and link | `category`, `min_severity`, `location`, `query`, `since`, `until` (YYYY-MM-DD), `limit` (1 to 50, default 20), `cursor` | about 800 characters per event |
| `endtimes_get_event` | One event by id (from a site link such as `/?event=<id>`) | `id` (UUID) | about 1,100 characters |

All tools declare `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`.

Rules that hold for every tool:

- Arguments are validated strictly. An unknown argument, a wrong type or an out-of-range value is rejected with a readable error. Nothing is silently corrected. Enum values are accepted in any letter case.
- No response is larger than 25,000 characters. A list that would exceed it returns fewer whole items, with `has_more` and `next_cursor`.
- Lists page with an opaque cursor (keyset pagination). `total` comes with the first page of an event search.

### Response shape

Success, as JSON in the text content of the tool result:

```json
{
  "data": {},
  "updated_at": "2026-11-22T00:50:26.870Z",
  "source": { "name": "End Times Monitor", "url": "https://endtimes.live/en/signs/" },
  "notice": "End Times Monitor is a watch dashboard, not a date prediction. It shows when indicators depart from their own history.",
  "has_more": false
}
```

`updated_at` is when the data was produced, not when it was requested. `stale: true` is added when the data is older than its normal refresh window. Events carry their own original source in `source.name` and `source.url`.

Errors are normal tool results with `isError: true`:

```json
{ "error": { "code": "rate_limited", "message": "Rate limit reached. Try again in 42 seconds.", "retry_after_seconds": 42 } }
```

Codes: `invalid_input`, `invalid_cursor`, `not_found`, `rate_limited`, `source_unavailable`, `internal_error`. An unknown tool name or a malformed request is a JSON-RPC error instead.

## Limits and caching

Only `tools/call` is counted. Discovery (`initialize`, `server/discover`, `tools/list`, `ping`) is free.

| Limit | Value | Setting |
|---|---|---|
| Per caller address | 30 calls per minute and 300 per hour | `MCP_RATE_PER_MINUTE`, `MCP_RATE_PER_HOUR` |
| Shared address ranges of hosted assistants (one bucket for all their users) | 600 calls per minute | `MCP_RATE_POOL_PER_MINUTE` |
| All callers together | 900 calls per minute | `MCP_RATE_GLOBAL_PER_MINUTE` |

Over a limit, the call returns the `rate_limited` tool error above with the real number of seconds until the window resets. It is an HTTP 200 with a tool result, so the assistant can read it and wait.

The caller address comes from headers set by the platform (`cf-connecting-ip`, then the rightmost public entry of `x-forwarded-for`). Headers a caller can invent are ignored. IPv6 callers are counted per /64 network.

Counters live in memory per function instance by default. To share them between instances, apply `supabase/migrations/008_mcp_rate_limit.sql` and set `MCP_RATE_LIMIT_BACKEND=postgres` (and `MCP_RATE_SALT` to a random secret). If the table is missing or unreachable the server keeps working with the in-memory counters.

Responses are cached in memory per instance, keyed by tool and normalised arguments (argument order, default values, letter case and spacing of text filters do not create a new entry):

| Data | Cache |
|---|---|
| Current signs | 60 seconds (the file itself is published with `max-age=60`) |
| History file | 5 minutes |
| Event search, per distinct query | 60 seconds |
| Single event | 5 minutes |

Concurrent identical calls share one upstream read. Tool list and discovery results carry the protocol cache hints `ttlMs` (one hour) and `cacheScope: "public"`. HTTP `Cache-Control` does not apply to MCP calls, which are `POST` requests, so responses are sent with `no-store`.

## Data handling

- The server reads with the site's public (publishable) key: it can see what an anonymous visitor of the site can see, and it selects an explicit list of columns from the events table.
- It never returns collector state, collection logs, error messages of data sources, the `metadata` column, geocoding fields, AI-generated summaries or posts collected from messaging channels and social accounts. Events are limited to press, agency and official feeds and the site's own entries.
- It writes nothing to the product database. The only possible write is the optional rate-limit counter.
- It keeps no usage log. Tool arguments and caller addresses are not stored or logged. The rate limiter uses a salted hash of the address as a counter key, in memory or in a row that expires with its window.
- Headlines and excerpts are third-party text, served as title, short excerpt and link, the same way the site shows them.

## Configuration

Everything has a default, so the function runs with no secrets set.

| Variable | Purpose |
|---|---|
| `MCP_ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call the endpoint, or `*`. Default: the site and `localhost`. Requests without an `Origin` header (assistants, command line clients) always pass. |
| `MCP_RATE_PER_MINUTE`, `MCP_RATE_PER_HOUR`, `MCP_RATE_POOL_PER_MINUTE`, `MCP_RATE_GLOBAL_PER_MINUTE` | Override the limits above |
| `MCP_RATE_LIMIT_BACKEND` | `postgres` to use the shared counters |
| `MCP_RATE_SALT` | Secret mixed into the hashed counter keys |
| `MCP_PUBLISHABLE_KEY`, `MCP_DATA_BASE_URL` | Override the public key and the public data bucket URL |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform. The service role key is read only when `MCP_RATE_LIMIT_BACKEND=postgres`, and only to call the counter function.

## Deploy

The function is public, so JWT verification is turned off for it alone (`supabase/config.toml`).

```bash
supabase functions deploy mcp --project-ref bimfztwwzuwwefxfkkwe --no-verify-jwt
```

Then check the live endpoint:

```bash
npx tsx scripts/mcp-smoke.ts --url https://bimfztwwzuwwefxfkkwe.supabase.co/functions/v1/mcp
```

Add `--rate-check` once after the first deploy. It repeats a cached call with a different invented `X-Forwarded-For` each time and reports the call at which the per-address limit refused it, which confirms that the platform headers identify the caller and that invented headers do not get around the limit. With in-memory counters and several warm instances the refusal can come later than the configured limit.

## Develop and test

```bash
npm run test:mcp     # unit and protocol tests, no network
npm run mcp:smoke    # the handler in this process against the real public data, read-only
```

The handler is a plain `(Request) => Response` function with the data source injected (`handler.ts`, `server.ts`), so the tests run under Node with no Deno toolchain. `index.ts` is the only file that touches the Deno runtime.

`facts.ts` holds the texts and thresholds the server quotes (sign names, verses, what is measured, the Ω rules). They are copies of what the site publishes; `tests/test-mcp.ts` fails if they diverge from `lib/signs/stats.ts`, `lib/seo/slugs.ts`, `lib/seo/pages.ts` or `locales/en.ts`.

Tool names are a public contract: add tools and optional arguments, do not rename or remove.
