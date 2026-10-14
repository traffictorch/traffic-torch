# Traffic Torch — Session Handoff

## Stack
- Cloudflare Workers + D1 + R2
- Dashboard: dashboard/index.html (Alpine.js, copy to dist/dashboard/index.html before git push, dist is gitignored)
- Deploy: `npx wrangler deploy` from each worker folder

## Workers
- **traffic-torch-auth** (`src/index.js`) — auth, posts, comments, uploads, feed. DB binding: MY_BINDING. R2: ATTACHMENTS
- **torches** (`src/handlers/torch.js`, `src/lib/meta.js`, `src/lib/jsonld.js`, `src/handlers/og.js`) — SSR torch pages + OG images
- **api-worker** — Stripe/auth separate
- DB name: `traffic-torch-db` (id d5c9fa6f-178f-4a5b-ae07-eebd161c6371)

## Shipped
- Posts/comments: 6000 chars, no comment cap, paginated (30/page)
- Markdown in dashboard (markdown-it + hljs, html:false)
- Discussion posts: post_type='discussion', title, body_md, images JSON, category
- Composer: Write/Preview tabs, Cmd+Enter, category pills (SEO default), edit discussion, edit/delete comments
- Image uploads: POST /api/uploads/image → R2 posts/<userId>/<uuid>.webp. Client-side 1600px WebP resize, drag/drop/paste
- Meta: discussion OG title/desc/image → /og/discussion/:id.png
- JSON-LD: DiscussionForumPosting on /torch/:id/

## Broken / pending
- **Torch page Alpine errors**: `renderMarkdown is not defined`, `shouldCollapse is not defined`, `torchPage is not defined` in browser console. Body renders plain-text SSR but markdown expansion broken. ROOT: `torchPageScript()` template literal mangles backslashes even with String.raw. NEXT: rewrite as array-of-strings joined, or move to a separate .js file served by worker.
- **Torch page images**: post.images / c.images not rendered in SSR HTML yet
- **OG worker** `/og/discussion/:id.png` — not built
- **Embeds**: YouTube/Vimeo/Spotify iframes + OG preview cards
- Test posts 12/13/14 need cleanup

## Test page
https://traffictorch.net/torch/15/

## User style
- Minimal commands, one action at a time
- All patches as Node scripts in /tmp/ then run with node
- Always `node --check` before `wrangler deploy`
- No long walls of text — short focused instructions
