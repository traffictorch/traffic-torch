import { fetchProfile } from '../lib/api.js';
import { getShell } from '../lib/shell.js';
import { buildProfileMeta, renderHeadTags } from '../lib/meta.js';
import { profileJsonLd, jsonLdScript } from '../lib/jsonld.js';
import { htmlHeaders, CACHE } from '../lib/cache.js';

function injectShell(html, { headTags, jsonLd }) {
  let out = html;

  // Strip existing <title>, meta description, canonical, robots to avoid dupes
  out = out.replace(/<title>[^<]*<\/title>/i, '');
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, '');
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  out = out.replace(/<meta\s+name="robots"[^>]*>/gi, '');

  // Inject before </head>
  const block = `\n${headTags}\n${jsonLd}\n</head>`;
  if (out.includes('</head>')) out = out.replace('</head>', block);
  else out = out.replace('<body', `${block}\n<body`); // fallback

  return out;
}

export async function handleProfile(request, env) {
  const username = new URL(request.url).pathname
    .replace('/torcher/', '')
    .replace(/\/$/, '');

  if (!username || username.includes('/')) {
    return new Response('Not found', { status: 404, headers: htmlHeaders('public, s-maxage=60') });
  }

  let data;
  try {
    data = await fetchProfile(env, username);
  } catch (err) {
    if (err.status === 404) {
      const shell = await getShell(env, '/profile.html');
      const notFound = shell
        .replace(/<title>[^<]*<\/title>/i, '<title>Profile not found · Traffic Torch</title>')
        .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
        .replace('</head>', `<meta name="robots" content="noindex, follow">\n</head>`);
      return new Response(notFound, { status: 404, headers: htmlHeaders('public, s-maxage=60') });
    }
    throw err;
  }

  const profile = data.profile || {};
  const posts = data.posts || [];

  const meta = buildProfileMeta(profile, username);
  const jsonLd = jsonLdScript(profileJsonLd(profile, username));

  // Thin-content rule: no posts, no bio, no socials → noindex
  const isThin = posts.length === 0
    && !profile.bio
    && !profile.website_url
    && !profile.social1_url
    && !profile.social2_url;

  const headTags = renderHeadTags(meta, { index: !isThin, type: 'profile' });

  const shell = await getShell(env, '/profile.html');
  const html = injectShell(shell, { headTags, jsonLd });

  return new Response(html, { status: 200, headers: htmlHeaders(CACHE.profile) });
}
