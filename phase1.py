import re
p = 'profile.html'
s = open(p).read()
log = []

# ── P1.2a: CDN scripts (markdown-it + highlight.js) ───────────
if 'markdown-it@14.1.0' not in s:
    s = s.replace('</head>',
        '  <script defer src="https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js"></script>\n'
        '  <script defer src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js"></script>\n'
        '</head>', 1)
    log.append('CDN scripts added')

# ── P1.2b: 17 utility methods ─────────────────────────────────
NEW = r'''
    // ── Utility methods (shared with dashboard) ──
    renderMarkdown(text) {
      if (!text) return '';
      const raw = String(text);
      if (!window.markdownit) {
        return '<p style="white-space:pre-wrap;margin:0;">' + raw
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#39;') + '</p>';
      }
      if (!window._ttMd) {
        window._ttMd = window.markdownit({ html:false, linkify:true, breaks:true });
        const d = window._ttMd.renderer.rules.link_open || function(t,i,o,e,self){return self.renderToken(t,i,o);};
        window._ttMd.renderer.rules.link_open = function(t,i,o,e,self){t[i].attrSet('target','_blank');t[i].attrSet('rel','nofollow ugc noopener');return d(t,i,o,e,self);};
      }
      let html = window._ttMd.render(raw);
      try { html = this.embedifyHtml(html); } catch(e){}
      return html;
    },
    excerpt(text, max = 600) {
      if (!text) return '';
      const str = String(text);
      return str.length <= max ? str : str.slice(0, max).replace(/\s+\S*$/, '') + '…';
    },
    shouldCollapse(text, max = 600) { return !!text && String(text).length > max; },
    parseImages(raw) {
      if (!raw) return [];
      try { const a = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(a) ? a : []; } catch { return []; }
    },
    parseWorkflowMeta(raw) {
      if (!raw) return null;
      try { const m = typeof raw === 'string' ? JSON.parse(raw) : raw; return m && typeof m === 'object' ? m : null; } catch { return null; }
    },
    wfTopChips(meta) {
      if (!meta) return [];
      const order = ['ai_models','ai_tools','cloud','ide','hardware','databases','devops','terminal','os','other_tools'];
      const out = [];
      for (const k of order) { const arr = meta[k]; if (Array.isArray(arr)) for (const v of arr) { if (out.length < 6) out.push(v); } }
      return out;
    },
    youtubeEmbedSrc(url) {
      try {
        const u = new URL(url); const h = u.hostname.replace(/^www\./,'');
        if (h === 'youtu.be') { const id = u.pathname.slice(1).split('/')[0]; return id ? 'https://www.youtube-nocookie.com/embed/'+id : null; }
        if (h === 'youtube.com' || h === 'm.youtube.com') {
          if (u.pathname === '/watch') { const v = u.searchParams.get('v'); return v ? 'https://www.youtube-nocookie.com/embed/'+v : null; }
          const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?]+)/);
          if (m) return 'https://www.youtube-nocookie.com/embed/'+m[1];
        }
      } catch {}
      return null;
    },
    vimeoEmbedSrc(url) {
      try {
        const u = new URL(url); const h = u.hostname.replace(/^www\./,'');
        if (h === 'vimeo.com' || h === 'player.vimeo.com') {
          const m = u.pathname.match(/^\/(?:video\/)?(\d+)/);
          if (m) return 'https://player.vimeo.com/video/'+m[1];
        }
      } catch {}
      return null;
    },
    embedFrame(src, title) {
      return '<div class="md-embed"><iframe src="'+src+'" title="'+title+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
    },
    embedifyHtml(html) {
      try {
        return html.replace(/<a href="([^"]+)"[^>]*>[^<]*<\/a>/g, (m, url) => {
          const yt = this.youtubeEmbedSrc(url); if (yt) return this.embedFrame(yt,'YouTube video');
          const vm = this.vimeoEmbedSrc(url);  if (vm) return this.embedFrame(vm,'Vimeo video');
          return m;
        });
      } catch { return html; }
    },
    openImageLightbox(url) { if (url) this.imageLightbox = url; },
    formatRelativeTime(ts) {
      const d = Date.now() - ts, m = Math.floor(d/60000);
      if (m < 1) return 'Just now'; if (m < 60) return m+'m ago';
      const h = Math.floor(m/60); if (h < 24) return h+'h ago';
      const dd = Math.floor(h/24); if (dd < 7) return dd+'d ago';
      return new Date(ts).toLocaleDateString();
    },
    contactHref(c) {
      const v = (c.value || '').trim(); if (!v) return '#';
      switch (c.type) {
        case 'email': return 'mailto:'+v;
        case 'whatsapp': return 'https://wa.me/'+v.replace(/\D/g,'');
        case 'telegram': return 'https://t.me/'+v.replace(/^@/,'');
        case 'phone': return 'tel:'+v;
        case 'linkedin': return v.startsWith('http') ? v : 'https://linkedin.com/in/'+v;
        case 'x': return v.startsWith('http') ? v : 'https://x.com/'+v.replace(/^@/,'');
        case 'other-url': return v.startsWith('http') ? v : 'https://'+v;
        default: return '#';
      }
    },
    contactIcon(type) {
      return ({email:'📧',whatsapp:'💬',telegram:'✈️',wechat:'💬',signal:'🔒',phone:'📞',linkedin:'💼',x:'𝕏','other-url':'🔗'})[type] || '📬';
    },
    contactsTypeLabel(type) {
      return ({email:'Email',whatsapp:'WhatsApp',telegram:'Telegram',wechat:'WeChat',signal:'Signal',phone:'Phone',linkedin:'LinkedIn',x:'X / Twitter','other-url':'Link'})[type] || 'Contact';
    },
'''
anchor = 'function profilePage() {\n  return {\n'
if anchor in s and 'renderMarkdown(text)' not in s:
    s = s.replace(anchor, anchor + NEW, 1)
    log.append('17 methods added')
else:
    log.append('SKIP methods (anchor or already present)')

# ── P1.1: move lightbox inside x-data via x-teleport ─────────
m = re.search(r'<div id="tt-profile-image-lightbox".*?</div>\s*(?=<script)', s, re.DOTALL)
if m:
    lb = m.group(0).rstrip()
    s = s.replace(m.group(0), '')
    end_anchor = '    <div id="footer-placeholder"></div>\n  </div>\n</div>'
    if end_anchor in s:
        s = s.replace(end_anchor,
            '    <div id="footer-placeholder"></div>\n  </div>\n\n  <template x-teleport="body">\n'+lb+'\n  </template>\n</div>', 1)
        log.append('lightbox moved inside x-data')
    else:
        log.append('SKIP lightbox (end anchor missing)')
else:
    log.append('SKIP lightbox (not found)')

# ── P2.2: YouTube / embed responsive CSS (cheap, do it now) ──
if '.md-embed {' not in s:
    s = s.replace('</style>', '''
    .md-body iframe, .md-embed iframe { max-width:100%; aspect-ratio:16/9; height:auto; border:0; border-radius:.6em; }
    .md-embed { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin:.8em 0; border-radius:.6em; background:#0f172a; }
    .md-embed iframe { position:absolute; inset:0; width:100%; height:100%; }
  </style>''', 1)
    log.append('embed CSS added')

open(p, 'w').write(s)
print('Done:')
for x in log: print(' •', x)
