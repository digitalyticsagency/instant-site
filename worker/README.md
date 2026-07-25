# Instant Site — licence & usage Worker

Free-tier Cloudflare Worker + D1. Issues per-customer licence keys, verifies
them, and records usage so you can see which reseller is generating what.

## Deploy (about 5 minutes, one time)

    cd worker
    npx wrangler login                      # opens your browser; you approve

    npx wrangler d1 create instant-site     # prints a database_id
    # paste that id into wrangler.toml, replacing REPLACE_AFTER_CREATE

    npx wrangler d1 execute instant-site --remote --file=./schema.sql
    npx wrangler secret put ADMIN_TOKEN     # invent a long random string, keep it
    npx wrangler deploy                     # prints your Worker URL

Then paste the Worker URL and your ADMIN_TOKEN into admin.html.

Optional, recommended once it works: set `ALLOWED_ORIGINS` in wrangler.toml to
your GitHub Pages origin so only your own site can write usage events.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/verify` | none | `{key}` → `{ok,label}`; app checks a licence |
| POST | `/event` | none | `{key?,client?,kind,meta?}` → logs usage (write-only) |
| GET  | `/admin/licences` | `x-admin-token` | list licences |
| POST | `/admin/licence` | `x-admin-token` | `{label,email?}` → issues a key |
| POST | `/admin/revoke` | `x-admin-token` | `{key,status?}` → revoke / reactivate |
| GET  | `/admin/stats` | `x-admin-token` | 30-day usage, by client |

## Local development

    echo 'ADMIN_TOKEN="testtoken"' > .dev.vars
    npx wrangler d1 execute instant-site --local --file=./schema.sql
    npx wrangler dev --local --port 8788

`.dev.vars` is gitignored. Never commit a real token.

## What this does and does not do

It gives you per-customer keys instead of one shared passcode, instant
revocation when a key leaks, and real per-client usage.

It does not make the export uncopyable. The theme is built in the visitor's
browser from their own data, so the Worker never handles the file and cannot
withhold it; someone who edits the app's JavaScript can still export. This is a
large step up from a passcode sitting in the source, but it is not DRM. Real
file-level enforcement would mean generating exports server-side, which would
cost the offline, no-backend property the product is built on.
