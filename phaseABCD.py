import re

TJ = 'torches/src/handlers/torch.js'
PH = 'profile.html'

# ═══════════════ 1. torch.js ═══════════════
s = open(TJ).read()
log = []

# ── A. Keep Alpine scope on the outer shell div (swap profilePage→torchPage)
old_strip = '''function stripProfileShell(html) {
  html = html.replace(/ x-data="profilePage\\(\\)"/, '');
  html = html.replace(/ x-init="init\\(\\)"/, '');
  html = html.replace(
    /<script>\\s*const API_BASE = [\\s\\S]*?window\\.profilePage = profilePage;\\s*<\\/script>/,
    ''
  );
  return html;
}'''
new_strip = '''function stripProfileShell(html) {
  // Swap Alpine factory so the whole shell (lightboxes included) is in torchPage() scope
  html = html.replace(/ x-data="profilePage\\(\\)"/, ' x-data="torchPage()"');
  html = html.replace(
    /<script>\\s*const API_BASE = [\\s\\S]*?window\\.profilePage = profilePage;\\s*<\\/script>/,
    ''
  );
  return html;
}'''
if old_strip in s:
    s = s.replace(old_strip, new_strip, 1); log.append('A: stripProfileShell swaps factory')
else:
    log.append('A: SKIP (anchor missing)')

# ── A2. handleTorch: don't wrap in a nested x-data div
old_wrap = "    const wrapped = `<div x-data=\"torchPage()\" x-init=\"init()\">\\n${renderTorchBody(data)}\\n${embedded}\\n</div>\\n${torchPageScript()}`;\n    html = html.slice(0, mainStart) + wrapped + html.slice(mainEnd + '</main>'.length);"
new_wrap = "    const injected = `${renderTorchBody(data)}\\n${embedded}\\n${torchPageScript()}`;\n    html = html.slice(0, mainStart) + injected + html.slice(mainEnd + '</main>'.length);"
if old_wrap in s:
    s = s.replace(old_wrap, new_wrap, 1); log.append('A2: handleTorch injects without nested wrapper')
else:
    log.append('A2: SKIP (anchor missing)')

# ── B. Images: open in lightbox, not new tab
old_imgs = """${postImages.length > 0 ? '<div class="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">' + postImages.map(function(img, i) { return '<a href="' + htmlEscape(img.url) + '" target="_blank" rel="noopener"><img src="' + htmlEscape(img.url) + '" loading="lazy" alt="Image ' + (i+1) + '" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition" style="aspect-ratio:16/9;object-fit:cover;"></a>'; }).join('') + '</div>' : ''}"""
new_imgs = """${postImages.length > 0 ? '<div class="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">' + postImages.map(function(img, i) { var u = String(img.url).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'"); return '<a @click.prevent="openImageLightbox(\\'' + u + '\\')" class="cursor-zoom-in" role="button" tabindex="0"><img src="' + htmlEscape(img.url) + '" loading="lazy" alt="Image ' + (i+1) + '" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition" style="aspect-ratio:16/9;object-fit:cover;"></a>'; }).join('') + '</div>' : ''}"""
if old_imgs in s:
    s = s.replace(old_imgs, new_imgs, 1); log.append('B: images use lightbox')
else:
    log.append('B: SKIP (anchor missing)')

# ── E. Workflow body: strip chips text block + Summary/Category prefix
old_body = """  const bodyMd = (isDiscussion || isWorkflow) ? (post.body_md || post.note || '') : (post.note || '');"""
new_body = """  let bodyMd = (isDiscussion || isWorkflow) ? (post.body_md || post.note || '') : (post.note || '');
  // Workflow posts store a UI-copy preamble in body_md. Strip it here so the real markdown shows.
  if (isWorkflow && bodyMd) {
    bodyMd = bodyMd
      .replace(/^Summary:[^\\n]*\\n/i, '')
      .replace(/^Category:[^\\n]*\\n/i, '')
      .replace(/Chips\\s*[—-]\\s*pick\\/type these:[\\s\\S]*?Body \\(step-by-step workflow\\):\\s*\\n?(markdown\\s*\\n?)?/i, '')
      .trim();
  }"""
if old_body in s:
    s = s.replace(old_body, new_body, 1); log.append('E: strip workflow preamble from body_md')
else:
    log.append('E: SKIP (anchor missing)')

# ── E2. Show workflow summary + chips from workflow_meta
old_wf = """      ${(isDiscussion || isWorkflow) && bodyMd ? '<div class="mt-5 text-base leading-relaxed"""
new_wf = """      ${isWorkflow && wfMeta && wfMeta.summary ? '<p class="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">' + htmlEscape(wfMeta.summary) + '</p>' : ''}
      ${(function() {
        if (!isWorkflow || !wfMeta) return '';
        var keys = ['ai_models','ai_tools','cloud','ide','hardware','databases','devops','terminal','os','other_tools'];
        var chips = [];
        for (var i = 0; i < keys.length; i++) {
          var arr = wfMeta[keys[i]];
          if (Array.isArray(arr)) for (var j = 0; j < arr.length; j++) { if (chips.length < 8) chips.push(arr[j]); }
        }
        if (!chips.length) return '';
        return '<div class="mt-3 flex flex-wrap gap-1.5">' + chips.map(function(c) { return '<span class="inline-flex px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[11px] font-bold border border-purple-500/20">' + htmlEscape(c) + '</span>'; }).join('') + '</div>';
      })()}
      ${(isDiscussion || isWorkflow) && bodyMd ? '<div class="mt-5 text-base leading-relaxed"""
if old_wf in s:
    s = s.replace(old_wf, new_wf, 1); log.append('E2: workflow summary + chips block inserted')
else:
    log.append('E2: SKIP (anchor missing)')

# ── C+D. Comment images + files in renderComments()
old_cm = """            <p x-show="!c._expanded" class="text-sm mt-1 leading-snug break-words whitespace-pre-wrap" x-text="plainExcerpt(c.body, 600)"></p>
            <div x-show="c._expanded" x-cloak class="md-body text-sm mt-1 break-words" x-html="renderMarkdown(c.body)"></div>
            <button x-show="shouldCollapse(c.body, 600)" @click="c._expanded = !c._expanded" type="button" class="text-xs font-semibold text-orange-500 hover:underline mt-1" x-text="c._expanded ? 'Show less ▲' : 'Read more ▼'"></button>"""
new_cm = old_cm + """
            <template x-if="c.images">
              <div class="mt-2 flex flex-wrap gap-1.5">
                <template x-for="(img, idx) in parseImages(c.images)" :key="'ci-' + c.id + '-' + idx">
                  <a @click.prevent="openImageLightbox(img.url)" class="cursor-zoom-in" role="button" tabindex="0">
                    <img :src="img.url" loading="lazy" alt="" class="rounded-md object-cover border border-gray-200 dark:border-gray-700 hover:opacity-90 transition" style="width:80px;height:80px;">
                  </a>
                </template>
              </div>
            </template>
            <template x-if="c.files">
              <div class="mt-2 flex flex-wrap gap-1.5">
                <template x-for="(f, idx) in parseImages(c.files)" :key="'cf-' + c.id + '-' + idx">
                  <a :href="f.url" target="_blank" rel="noopener" download class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-orange-500/20 transition">
                    <span>📎</span><span x-text="f.name || 'file'"></span>
                  </a>
                </template>
              </div>
            </template>"""
if old_cm in s:
    s = s.replace(old_cm, new_cm, 1); log.append('C+D: comment images + files rendered')
else:
    log.append('C+D: SKIP (anchor missing)')

# ── G. Real torchPageScript() shim
old_ts = """function torchPageScript() {
  return '';
}"""
new_ts = r'''function torchPageScript() {
  return `<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.torchPage !== 'function') return;
    var orig = window.torchPage;
    window.torchPage = function() {
      var obj = orig.apply(this, arguments);
      if (!obj.openImageLightbox) obj.openImageLightbox = function(u) { if (u) this.imageLightbox = u; };
      if (!obj.parseImages) obj.parseImages = function(raw) {
        if (!raw) return [];
        try { var a = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(a) ? a : []; } catch (e) { return []; }
      };
      if (!obj.formatTime && obj.formatRelativeTime) obj.formatTime = obj.formatRelativeTime;
      if (!obj.formatTime) obj.formatTime = function(ts) { try { return new Date(ts).toLocaleString(); } catch (e) { return ''; } };
      if (!obj.plainExcerpt) obj.plainExcerpt = function(t, m) { t = String(t || ''); m = m || 600; return t.length <= m ? t : t.slice(0, m).replace(/\s+\S*$/, '') + '\u2026'; };
      if (!obj.shouldCollapse) obj.shouldCollapse = function(t, m) { return !!t && String(t).length > (m || 600); };
      if (!obj.renderMarkdown) obj.renderMarkdown = function(t) {
        if (!t) return '';
        if (window.markdownit) {
          if (!window._ttMdTorch) {
            window._ttMdTorch = window.markdownit({ html: false, linkify: true, breaks: true });
            var defaultLink = window._ttMdTorch.renderer.rules.link_open || function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            window._ttMdTorch.renderer.rules.link_open = function(tokens, idx, options, env, self) {
              tokens[idx].attrSet('target', '_blank');
              tokens[idx].attrSet('rel', 'nofollow ugc noopener');
              return defaultLink(tokens, idx, options, env, self);
            };
          }
          return window._ttMdTorch.render(String(t));
        }
        return '<p style="white-space:pre-wrap">' + String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>';
      };
      return obj;
    };
  });
  </script>`;
}'''
if old_ts in s:
    s = s.replace(old_ts, new_ts, 1); log.append('G: torchPageScript shim installed')
else:
    log.append('G: SKIP (anchor missing)')

open(TJ, 'w').write(s)
print('torch.js patches:')
for x in log: print('  •', x)

# ═══════════════ 2. profile.html ═══════════════
p = open(PH).read()
plog = []

# F1. Audit branch: fall back to title if page_title missing
old_a = """x-text="(post.page_title && post.page_title.trim()) || toolDisplayName(post.tool)"></a>"""
new_a = """x-text="(post.page_title && post.page_title.trim()) || post.title || toolDisplayName(post.tool)"></a>"""
if old_a in p:
    p = p.replace(old_a, new_a, 1); plog.append('F1: audit title fallback')
else:
    plog.append('F1: SKIP')

# F2. Workflow title: add page_title fallback
old_w = """x-text="post.title || 'Workflow'" """
if old_w in p:
    p = p.replace(old_w, """x-text="post.title || post.page_title || 'Workflow'" """, 1); plog.append('F2: workflow title fallback')
else:
    plog.append('F2: SKIP (anchor missing)')

# C+D mirror on profile feed — add comment images/files too (same template)
old_pc = """<p x-show="!c._expanded" class="text-sm mt-1 leading-snug break-words whitespace-pre-wrap" x-text="plainExcerpt(c.body, 600)"></p>
                            <div x-show="c._expanded" x-cloak class="md-body text-sm mt-1 break-words" x-html="renderMarkdown(c.body)"></div>
                            <button x-show="shouldCollapse(c.body, 600)" @click="c._expanded = !c._expanded" type="button"
                                    class="text-xs font-semibold text-orange-500 hover:underline mt-1"
                                    x-text="c._expanded ? 'Show less ▲' : 'Read more ▼'"></button>"""
if old_pc in p:
    p = p.replace(old_pc, old_pc + """
                            <template x-if="c.images">
                              <div class="mt-2 flex flex-wrap gap-1.5">
                                <template x-for="(img, idx) in parseImages(c.images)" :key="'pci-' + c.id + '-' + idx">
                                  <a @click.prevent="openImageLightbox(img.url)" class="cursor-zoom-in" role="button" tabindex="0">
                                    <img :src="img.url" loading="lazy" alt="" class="rounded-md object-cover border border-gray-200 dark:border-gray-700" style="width:80px;height:80px;">
                                  </a>
                                </template>
                              </div>
                            </template>
                            <template x-if="c.files">
                              <div class="mt-2 flex flex-wrap gap-1.5">
                                <template x-for="(f, idx) in parseImages(c.files)" :key="'pcf-' + c.id + '-' + idx">
                                  <a :href="f.url" target="_blank" rel="noopener" download class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-orange-500/20 transition">
                                    <span>📎</span><span x-text="f.name || 'file'"></span>
                                  </a>
                                </template>
                              </div>
                            </template>""", 1)
    plog.append('C+D: profile comment images + files')
else:
    plog.append('C+D profile: SKIP (anchor missing, may not have comments on profile)')

open(PH, 'w').write(p)
print('profile.html patches:')
for x in plog: print('  •', x)
