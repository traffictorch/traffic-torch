const fs = require('fs');
const path = require('path');

const CURATED = [
  // ── Tools ──
  { url: '/', title: 'NUSA — Combined UX SEO AEO Audit', desc: 'Instant 360° audit of UX, SEO and AI search readiness', category: 'Tools', emoji: '🎯', featured: true },
  { url: '/ofux-tool/', title: 'OFUX — Optimal UX Tool', desc: 'UX friction, tap targets, readability, accessibility audit', category: 'Tools', emoji: '📊', featured: true },
  { url: '/lighthouse-plus-tool/', title: 'Lighthouse Plus', desc: 'Core Web Vitals and performance audit with fixes', category: 'Tools', emoji: '🗼' },
  { url: '/aeo-performance-tool/', title: 'AEO Performance', desc: 'Measure AI search and answer-engine optimisation', category: 'Tools', emoji: '🚀' },
  { url: '/seo-intent-tool/', title: 'SEO Intent', desc: 'Match content to search intent + E-E-A-T audit', category: 'Tools', emoji: '🎯' },
  { url: '/seo-ux-tool/', title: 'SEO + UX', desc: 'Unified health score across both dimensions', category: 'Tools', emoji: '⚖️' },
  { url: '/local-seo-tool/', title: 'Local SEO', desc: 'NAP, schema, map signals + fixes', category: 'Tools', emoji: '📍' },
  { url: '/product-seo-tool/', title: 'Product SEO', desc: 'Product page audit + eCommerce signals', category: 'Tools', emoji: '🛒' },
  { url: '/seo-entity-extractor-tool/', title: 'Entity Extractor', desc: 'Semantic entity extractor + audit', category: 'Tools', emoji: '🧬' },
  { url: '/topical-authority-audit-tool/', title: 'Topical Authority', desc: 'Topic coverage and authority gaps', category: 'Tools', emoji: '⚜️' },
  { url: '/schema-generator/', title: 'Schema Generator', desc: '18 schema markups in JSON-LD', category: 'Tools', emoji: '⚙️', featured: true },
  { url: '/ai-search-optimization-tool/', title: 'AI Search Optimisation', desc: 'Perplexity, ChatGPT, Gemini, Grok discoverability', category: 'Tools', emoji: '🔍', featured: true },
  { url: '/ai-voice-search-tool/', title: 'AI Voice Search', desc: 'Voice-query optimised content audit', category: 'Tools', emoji: '🎙️' },
  { url: '/ai-audit-tool/', title: 'AI Content Audit', desc: 'Detect AI patterns + humanise content', category: 'Tools', emoji: '🤖' },
  { url: '/quit-risk-tool/', title: 'Quit Risk', desc: 'UX friction + bounce prediction', category: 'Tools', emoji: '⚠️' },
  { url: '/uxid-tool/', title: 'UXID — UX Incentive Design', desc: 'CTA specificity, trust, reciprocity, ethical urgency, AEO signals', category: 'Tools', emoji: '🎯' },
  { url: '/blog/posts/uxid-help-guide/', title: 'UXID Help Guide', desc: 'The 15 UX incentive design signals explained - how Both/SEO/AEO weight them.', category: 'Learn', emoji: '🥇' },
  { url: '/keyword-research-tool/', title: 'Keyword Research', desc: 'Keyword discovery and clustering', category: 'Tools', emoji: '🔑' },
  { url: '/keyword-tool/', title: 'Keyword Placement', desc: 'On-page placement + density scoring', category: 'Tools', emoji: '🗝️' },
  { url: '/keyword-vs-tool/', title: 'Keyword VS', desc: 'Competitive keyword gap analysis', category: 'Tools', emoji: '🆚' },
  { url: '/aeo-log-analyzer/', title: 'AEO Log Analyser', desc: 'Parse server logs for AI crawler signals', category: 'Tools', emoji: '📜' },

  // ── Community ──
  { url: '/community/', title: 'Community Feed', desc: 'Discussions, workflows, audits — the live feed', category: 'Community', emoji: '👥', featured: true },
  { url: '/community/round-table/', title: 'Round Table — Governance', desc: 'Decentralised governance, proposals, voting', category: 'Community', emoji: '🗳️' },
  { url: '/community/round-table/simulator/', title: 'Governance Simulator', desc: 'Simulate proposals, see effect in 30 seconds', category: 'Community', emoji: '⚡' },
  { url: '/leader-board/', title: 'Leaderboard', desc: 'Top NUSA scores and site audits', category: 'Community', emoji: '🏆' },
  { url: '/contributors/', title: 'Contributors', desc: 'Community members who shipped features', category: 'Community', emoji: '🛠️' },
  { url: '/discover/', title: 'Discover People', desc: 'Find and follow experts in your niche', category: 'Community', emoji: '🔍' },
  { url: '/activity/', title: 'Activity Feed', desc: 'Real-time actions across the community', category: 'Community', emoji: '⚡' },

  // ── Learn ──
  { url: '/ai-ux-seo-help-guides/', title: 'Help Guides', desc: 'Deep-dive diagnostics and fixes', category: 'Learn', emoji: '📋', featured: true },
  { url: '/blog/', title: 'Blog', desc: 'Articles, updates, deep dives', category: 'Learn', emoji: '📝' },
  { url: '/ai-seo-ux-tools/', title: 'All Tools', desc: 'Complete suite of 17+ audit tools', category: 'Learn', emoji: '🧰' },
  { url: '/research/traffic-torch-whitepaper/', title: 'Traffic Torch Whitepaper', desc: 'Research, methodology, correlation data', category: 'Learn', emoji: '📄' },
  { url: '/integrations/', title: 'Integrations', desc: 'Plugins, extensions, dev tools', category: 'Learn', emoji: '🔌' },
  { url: '/integrations/browser-extensions/', title: 'Browser Extensions', desc: 'Chrome, Firefox, Edge', category: 'Learn', emoji: '🧩' },
  { url: '/integrations/developer-tools/', title: 'Developer Tools', desc: 'VS Code, GitHub Actions, npm', category: 'Learn', emoji: '💻' },
  { url: '/integrations/plugins/', title: 'CMS Plugins', desc: 'WordPress, Framer, Figma', category: 'Learn', emoji: '📦' },

  // ── Account ──
  { url: '/dashboard/', title: 'Dashboard', desc: 'Profile, feed, audits, analytics, settings', category: 'Account', emoji: '📊' },
  { url: '/pro/', title: 'Pro Plans', desc: 'Full pricing and feature comparison', category: 'Account', emoji: '⭐' },
  { url: '/upgrade/', title: 'Upgrade', desc: 'Pro and Enterprise plans', category: 'Account', emoji: '🚀' },
  { url: '/login/', title: 'Sign In / Register', desc: 'Log in or create account', category: 'Account', emoji: '🔑' },

  // ── Company ──
  { url: '/about/', title: 'About Traffic Torch', desc: 'Mission, method, team', category: 'Company', emoji: 'ℹ️' },
  { url: '/contact/', title: 'Contact', desc: 'Get in touch', category: 'Company', emoji: '✉️' },
  { url: '/analytics/', title: 'Public Analytics', desc: 'Real Cloudflare edge data', category: 'Company', emoji: '📊' },
  { url: '/privacy/', title: 'Privacy', desc: 'Privacy-first architecture', category: 'Company', emoji: '🔒' },
  { url: '/terms/', title: 'Terms of Service', desc: 'Legal terms', category: 'Company', emoji: '📜' },
];

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const blogPosts = [];
const postsDir = path.join(__dirname, 'blog/posts');
if (fs.existsSync(postsDir)) {
  for (const slug of fs.readdirSync(postsDir)) {
    const file = path.join(postsDir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const title = (html.match(/<title[^>]*>([^<]+)/) || [])[1] || slug;
    const desc = (html.match(/<meta\s+name="description"\s+content="([^"]+)/) || [])[1] || '';
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
    const body = stripTags(html.replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, ''))
      .slice(0, 800);
    blogPosts.push({
      url: `/blog/posts/${slug}/`,
      title: stripTags(title).replace(' | Traffic Torch', '').replace(' – Traffic Torch', '').trim(),
      desc: stripTags(desc),
      body,
      category: 'Blog',
      emoji: '📝',
      featured: false
    });
  }
}

const index = [...CURATED, ...blogPosts];
const out = JSON.stringify(index, null, 2);
fs.writeFileSync('shared/search-index.json', out);
console.log(`✓ search-index.json: ${index.length} entries (${CURATED.length} curated + ${blogPosts.length} blog posts), ${(out.length/1024).toFixed(1)} KB`);
