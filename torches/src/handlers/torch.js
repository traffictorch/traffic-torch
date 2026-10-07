import { fetchTorch } from '../lib/api.js';
import { getShell } from '../lib/shell.js';
import { buildTorchMeta, renderHeadTags } from '../lib/meta.js';
import { torchJsonLd, jsonLdScript } from '../lib/jsonld.js';
import { htmlHeaders, CACHE } from '../lib/cache.js';
import { htmlEscape } from '../lib/escape.js';

function injectShell(html, { headTags, jsonLd }) {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, '');
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, '');
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  out = out.replace(/<meta\s+name="robots"[^>]*>/gi, '');
  const block = `\n${headTags}\n${jsonLd}\n</head>`;
  return out.includes('</head>') ? out.replace('</head>', block) : out;
}

function scoreColor(score) {
  return score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
}

function scoreClass(score) {
  return score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
}

function torchUrl(post) {
  return `/torch/${post.id}/`;
}

function torchLabel(post) {
  if (post.page_title && post.page_title.trim()) return post.page_title;
  if (post.domain_mode === 'hidden') return post.domain_label || 'Hidden site';
  if (post.url) return new URL(post.url).hostname.replace(/^www\./, '');
  return `Torch #${post.id}`;
}

function renderMiniCard(post, { showAuthor } = {}) {
  const sc = Number(post.score) || 0;
  const author = showAuthor && post.username
    ? `<a href="/torcher/${htmlEscape(post.username)}/" class="text-xs text-gray-500 hover:text-orange-500">@${htmlEscape(post.username)}</a>`
    : '';
  return `<a href="${torchUrl(post)}" class="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition">
    <span class="text-2xl font-black ${scoreClass(sc)} flex-shrink-0" style="min-width:2.5rem;text-align:center;">${sc}</span>
    <span class="flex-1 min-w-0">
      <span class="block text-sm font-medium truncate">${htmlEscape(torchLabel(post))}</span>
      ${author}
    </span>
  </a>`;
}

function renderTorchHero(post, author, id, moreByAuthor, related) {
  const sc = Number(post.score) || 0;
  const domain = post.domain_mode === 'hidden'
    ? (post.domain_label || 'Hidden site')
    : (post.url ? new URL(post.url).hostname.replace(/^www\./, '') : 'Unknown');
  const titleText = htmlEscape(torchLabel(post));
  const date = new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let modules = [];
  try {
    const raw = typeof post.module_scores === 'string' ? JSON.parse(post.module_scores) : post.module_scores;
    if (Array.isArray(raw)) modules = raw;
  } catch {}

  const modulesHtml = modules.map((m) => {
    const s = Math.max(0, Math.min(100, Math.round(m.score || 0)));
    const cls = s >= 80 ? 'good' : s >= 60 ? 'mid' : 'bad';
    return `<div class="mod-row"><span class="mod-label">${htmlEscape(m.name)}</span><span class="mod-track"><span class="mod-fill ${cls}" style="width:${s}%"></span></span><span class="mod-score">${s}</span></div>`;
  }).join('');

  const moreHtml = (moreByAuthor || []).length
    ? `<section class="mt-8">
        <h2 class="text-lg font-bold mb-3">More by <a href="/torcher/${htmlEscape(author.username)}/" class="hover:text-orange-500">@${htmlEscape(author.username)}</a></h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${moreByAuthor.map(p => renderMiniCard(p)).join('')}</div>
      </section>`
    : '';

  const relatedHtml = (related || []).length
    ? `<section class="mt-8">
        <h2 class="text-lg font-bold mb-3">Similar scores with ${htmlEscape(post.tool)}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${related.map(p => renderMiniCard(p, { showAuthor: true })).join('')}</div>
      </section>`
    : '';

  return `<main class="container mx-auto px-4 py-8 flex-1 max-w-3xl" data-ssr="torch">
  <nav aria-label="breadcrumb" class="text-sm text-gray-500 mb-4">
    <a href="/" class="hover:underline">Home</a> ›
    <a href="/community/" class="hover:underline">Community</a> ›
    <a href="/torcher/${htmlEscape(author.username)}/" class="hover:underline">@${htmlEscape(author.username)}</a> ›
    <span>Torch #${id}</span>
  </nav>
  <article class="glass rounded-2xl overflow-hidden border-l-4" style="border-left-color:${scoreColor(sc)}">
    <div class="p-6">
      <div class="flex items-start gap-6 flex-wrap">
        <div class="text-center" style="min-width:110px;">
          <p class="text-6xl font-black leading-none" style="color:${scoreColor(sc)}">${sc}</p>
          <p class="text-xs font-bold text-gray-400 mt-1">/100</p>
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-black leading-tight mb-2">${titleText}</h1>
          <p class="text-sm text-gray-500">${htmlEscape(domain)} · <time datetime="${new Date(post.created_at).toISOString()}">${date}</time></p>
          ${post.note ? `<p class="text-base leading-relaxed mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${htmlEscape(post.note)}</p>` : ''}
        </div>
      </div>
    </div>
    ${modulesHtml ? `<div class="border-t border-dashed border-gray-200 dark:border-gray-700"></div><div class="px-6 py-4 space-y-2">${modulesHtml}</div>` : ''}
  </article>
  <div class="glass rounded-2xl p-5 mt-6 flex items-center gap-4">
    <img src="/images/avatars/${htmlEscape(author.avatar_preset || 'owner')}.svg" alt="" width="56" height="56" style="width:56px;height:56px;" class="rounded-full object-cover">
    <div class="flex-1 min-w-0">
      <p class="font-bold truncate"><a href="/torcher/${htmlEscape(author.username)}/" class="hover:text-orange-500">${htmlEscape(author.display_name || author.username)}</a></p>
      <p class="text-xs text-gray-500">@${htmlEscape(author.username)}${author.total_points ? ' · 🏅 ' + author.total_points : ''}</p>
    </div>
    <a href="/torcher/${htmlEscape(author.username)}/" class="px-4 py-2 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">View profile →</a>
  </div>
  ${moreHtml}
  ${relatedHtml}
</main>`;
}

export async function handleTorch(request, env) {
  const path = new URL(request.url).pathname;
  const idRaw = path.replace('/torch/', '').replace(/\/$/, '').split('/')[0];
  const id = parseInt(idRaw, 10);

  if (!id || String(id) !== idRaw) {
    return new Response('Not found', { status: 404, headers: htmlHeaders('public, s-maxage=60') });
  }

  let data;
  try {
    data = await fetchTorch(env, id);
  } catch (err) {
    if (err.status === 404) {
      const shell = await getShell(env, '/profile.html');
      return new Response(
        shell.replace(/<title>[^<]*<\/title>/i, '<title>Torch not found · Traffic Torch</title>')
             .replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>'),
        { status: 404, headers: htmlHeaders('public, s-maxage=60') }
      );
    }
    throw err;
  }

  const post = data.post;
  const author = data.author;
  const isHidden = post.domain_mode === 'hidden';

  const meta = buildTorchMeta(post, author, id);
  const jsonLd = jsonLdScript(torchJsonLd(post, author, id));
  const headTags = renderHeadTags(meta, { index: !isHidden, type: 'article' });

  const shell = await getShell(env, '/profile.html');
  let html = injectShell(shell, { headTags, jsonLd });

  const mainStart = html.indexOf('<main ');
  const mainEnd = html.indexOf('</main>');
  if (mainStart !== -1 && mainEnd !== -1) {
    const replacement = renderTorchHero(post, author, id, data.more_by_author, data.related);
    html = html.slice(0, mainStart) + replacement + html.slice(mainEnd + '</main>'.length);
  }

  return new Response(html, {
    status: 200,
    headers: htmlHeaders(isHidden ? CACHE.torchHidden : CACHE.torch),
  });
}
