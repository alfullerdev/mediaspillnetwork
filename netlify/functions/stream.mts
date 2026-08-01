/**
 * Shared live-stream override, backed by Supabase.
 *
 * GET  -> { url: string | null }   read by every visitor, so a stream set from
 *                                  one device takes over the site for everyone.
 * POST -> { passcode, url }        sets it; `url: ""` clears it and restores
 *                                  the normal site.
 * POST -> { passcode, action:"verify" }  unlocks the URL field in the UI.
 *
 * The passcode is compared here, never shipped to the browser, so it cannot be
 * read out of the client bundle. Writes use the service-role key, which bypasses
 * RLS — that key must only ever exist as a server-side env var.
 *
 * Required Netlify environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STREAM_PASSCODE
 */

const TABLE = "live_stream";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // Visitors poll this; never let a CDN pin a stale answer.
      "cache-control": "no-store",
    },
  });

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return {
    endpoint: `${url.replace(/\/$/, "")}/rest/v1/${TABLE}?id=eq.true`,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
  };
}

// Only http(s), and no credentials embedded in the URL.
function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.username || parsed.password) return null;
  return parsed.toString();
}

export default async function handler(request: Request) {
  const db = supabase();
  if (!db) return json({ error: "Supabase is not configured" }, 503);

  if (request.method === "GET") {
    const response = await fetch(`${db.endpoint}&select=url`, { headers: db.headers });
    if (!response.ok) return json({ url: null });
    const rows = (await response.json()) as Array<{ url: string | null }>;
    return json({ url: rows[0]?.url ?? null });
  }

  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = process.env.STREAM_PASSCODE;
  if (!expected) return json({ error: "Stream passcode is not configured" }, 503);

  let payload: { passcode?: unknown; url?: unknown; action?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (typeof payload.passcode !== "string" || payload.passcode !== expected) {
    return json({ error: "Not authorized" }, 401);
  }

  // Lets the passcode step unlock the URL field without the browser ever
  // holding the passcode itself.
  if (payload.action === "verify") return json({ ok: true });

  const clearing = payload.url === "" || payload.url === null;
  const url = clearing ? null : normalizeUrl(payload.url);
  if (!clearing && !url) return json({ error: "Enter a valid http(s) URL" }, 400);

  const write = await fetch(db.endpoint, {
    method: "PATCH",
    headers: { ...db.headers, prefer: "return=representation" },
    body: JSON.stringify({ url }),
  });

  if (!write.ok) {
    const detail = await write.text().catch(() => "");
    return json({ error: `Could not save the stream${detail ? `: ${detail}` : ""}` }, 502);
  }

  return json({ url });
}

export const config = { path: "/api/stream" };
