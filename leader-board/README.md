# Traffic Torch Leaderboard

Drop-in leaderboard widget + Cloudflare Worker + D1 table.

## Files
- `worker.js` — Cloudflare Worker (GET + POST endpoints)
- `wrangler.toml` — Worker config (add your D1 database_id)
- `schema.sql` — D1 table + indexes
- `high-scores-widget.js` — front-end widget (drop-in)
- `high-scores-widget.css` — widget styles
- `submit-score.js` — submission helper + button injector

## Setup
1. Create the D1 table (see step 2 in instructions).
2. Update `wrangler.toml` with your real D1 database_id.
3. `wrangler deploy` from this folder.
4. Drop the widget div + CSS/JS includes on any tool page.
5. Wire the submission button into the tool script after a successful audit.
