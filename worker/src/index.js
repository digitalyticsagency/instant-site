/**
 * Instant Site licence + usage Worker.
 *
 * What this genuinely gives you, versus the passcode it replaces:
 *   - per-customer licence keys instead of one shared secret
 *   - instant revocation when a key leaks
 *   - real usage: who generated what, and when
 *
 * What it does NOT give you, stated plainly because it matters: the exported
 * theme is built in the visitor's browser from their own data, so the Worker
 * never touches the file and cannot withhold it. Someone who edits the app's
 * JavaScript can still export. This raises the effort a long way above "read
 * the passcode out of the source", but it is not DRM. Real file-level
 * enforcement would mean generating the export server-side, which would cost
 * the offline, no-backend property the whole product is built on.
 */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function cors(env, req) {
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
  const origin = req.headers.get('Origin') || '';
  const ok = allowed.includes('*') || allowed.includes(origin);
  return {
    'access-control-allow-origin': ok && origin ? origin : (allowed.includes('*') ? '*' : ''),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-token',
    'access-control-max-age': '86400',
  };
}
const reply = (data, status, extra) =>
  new Response(JSON.stringify(data), { status: status || 200, headers: { ...JSON_HEADERS, ...(extra || {}) } });

/* Keys are readable over the phone: no look-alike characters, grouped in fours. */
function newKey() {
  const A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const s = [...b].map(x => A[x % A.length]).join('');
  return `IS-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

/* Constant-time compare so the admin token cannot be guessed byte by byte. */
function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const isAdmin = (req, env) => !!env.ADMIN_TOKEN && safeEqual(req.headers.get('x-admin-token'), env.ADMIN_TOKEN);

async function readBody(req) {
  try { return await req.json(); } catch { return {}; }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const ch = cors(env, req);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: ch });
    if (!env.DB) return reply({ ok: false, error: 'Database not bound. Check the d1_databases binding in wrangler.toml.' }, 500, ch);

    try {
      /* ---- public: verify a licence ---------------------------------- */
      if (path === '/verify' && req.method === 'POST') {
        const { key } = await readBody(req);
        if (!key) return reply({ ok: false, error: 'No key supplied.' }, 400, ch);
        const row = await env.DB.prepare('SELECT key,label,status FROM licences WHERE key = ?').bind(String(key).trim().toUpperCase()).first();
        if (!row) return reply({ ok: false, error: 'That licence key is not recognised.' }, 200, ch);
        if (row.status !== 'active') return reply({ ok: false, error: 'That licence has been revoked.' }, 200, ch);
        const now = Date.now();
        await env.DB.batch([
          env.DB.prepare('UPDATE licences SET last_seen = ?, uses = uses + 1 WHERE key = ?').bind(now, row.key),
          env.DB.prepare('INSERT INTO events (licence,client,kind,meta,ts) VALUES (?,?,?,?,?)').bind(row.key, null, 'verify', null, now),
        ]);
        return reply({ ok: true, label: row.label }, 200, ch);
      }

      /* ---- public: log a usage event ---------------------------------
         Deliberately unauthenticated and write-only. The worst a stranger can
         do is add noise; nothing here can be read back without the admin
         token. Fields are length-capped so a bad actor cannot bloat storage. */
      if (path === '/event' && req.method === 'POST') {
        const b = await readBody(req);
        const cap = (v, n) => (v == null ? null : String(v).slice(0, n));
        const kind = cap(b.kind, 24) || 'unknown';
        await env.DB.prepare('INSERT INTO events (licence,client,kind,meta,ts) VALUES (?,?,?,?,?)')
          .bind(cap(b.key, 40), cap(b.client, 60), kind, cap(b.meta, 200), Date.now()).run();
        return reply({ ok: true }, 200, ch);
      }

      /* ---- admin ------------------------------------------------------ */
      if (path.startsWith('/admin/')) {
        if (!isAdmin(req, env)) return reply({ ok: false, error: 'Not authorised.' }, 401, ch);

        if (path === '/admin/licences' && req.method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT key,label,email,status,created_at,last_seen,uses FROM licences ORDER BY created_at DESC LIMIT 200').all();
          return reply({ ok: true, licences: results || [] }, 200, ch);
        }

        if (path === '/admin/licence' && req.method === 'POST') {
          const b = await readBody(req);
          const label = String(b.label || '').slice(0, 60).trim();
          if (!label) return reply({ ok: false, error: 'A label is required so you can tell licences apart.' }, 400, ch);
          const key = newKey();
          await env.DB.prepare('INSERT INTO licences (key,label,email,status,created_at) VALUES (?,?,?,?,?)')
            .bind(key, label, String(b.email || '').slice(0, 120) || null, 'active', Date.now()).run();
          return reply({ ok: true, key, label }, 200, ch);
        }

        if (path === '/admin/revoke' && req.method === 'POST') {
          const { key, status } = await readBody(req);
          const next = status === 'active' ? 'active' : 'revoked';
          const r = await env.DB.prepare('UPDATE licences SET status = ? WHERE key = ?').bind(next, String(key || '').toUpperCase()).run();
          const changed = (r.meta && r.meta.changes) || 0;
          return reply({ ok: changed > 0, status: next, error: changed ? undefined : 'No licence with that key.' }, 200, ch);
        }

        if (path === '/admin/stats' && req.method === 'GET') {
          const since = Date.now() - 30 * 864e5;
          const [totals, byClient, recent] = await Promise.all([
            env.DB.prepare('SELECT kind, COUNT(*) n FROM events WHERE ts > ? GROUP BY kind').bind(since).all(),
            env.DB.prepare(`SELECT COALESCE(l.label, e.client, 'unattributed') who, COUNT(*) n, MAX(e.ts) last
                            FROM events e LEFT JOIN licences l ON l.key = e.licence
                            WHERE e.ts > ? GROUP BY who ORDER BY n DESC LIMIT 50`).bind(since).all(),
            env.DB.prepare(`SELECT e.kind, e.client, e.meta, e.ts, l.label
                            FROM events e LEFT JOIN licences l ON l.key = e.licence
                            ORDER BY e.ts DESC LIMIT 40`).all(),
          ]);
          return reply({ ok: true, windowDays: 30, totals: totals.results || [], byClient: byClient.results || [], recent: recent.results || [] }, 200, ch);
        }
      }

      if (path === '/' || path === '/health')
        return reply({ ok: true, service: 'instant-site-licence', time: Date.now() }, 200, ch);

      return reply({ ok: false, error: 'Not found.' }, 404, ch);
    } catch (e) {
      return reply({ ok: false, error: 'Server error: ' + (e && e.message ? e.message : String(e)) }, 500, ch);
    }
  },
};
