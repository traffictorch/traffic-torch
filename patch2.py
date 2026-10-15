#!/usr/bin/env python3
TJ = 'torches/src/handlers/torch.js'
PH = 'profile.html'

def torch_patches():
    s = open(TJ).read()
    log = []

    # ── 1. stripProfileShell keeps x-data but swaps factory ──
    old1 = '''function stripProfileShell(html) {
  html = html.replace(/ x-data="profilePage\\(\\)"/, '');
  html = html.replace(/ x-init="init\\(\\)"/, '');
  html = html.replace(
    /<script>\\s*const API_BASE = [\\s\\S]*?window\\.profilePage = profilePage;\\s*<\\/script>/,
    ''
  );
  return html;
}'''
    new1 = '''function stripProfileShell(html) {
  html = html.replace(/ x-data="profilePage\\(\\)"/, ' x-data="torchPage()"');
  html = html.replace(
    /<script>\\s*const API_BASE = [\\s\\S]*?window\\.profilePage = profilePage;\\s*<\\/script>/,
    ''
  );
  return html;
}'''
    if new1 in s:
        log.append('1 already applied (keeps x-data as torchPage)')
    elif old1 in s:
        s = s.replace(old1, new1, 1); log.append('1 OK stripProfileShell swapped')
    else:
        log.append('1 SKIP — exact anchor not found (paste this line to me if you want it fixed)')

    # ── 2. handleTorch drops nested x-data wrapper ──
    old2 = "    const wrapped = `<div x-data=\"torchPage()\" x-init=\"init()\">\\n${renderTorchBody(data)}\\n${embedded}\\n</div>\\n${torchPageScript()}`;"
    new2 = "    const wrapped = `${renderTorchBody(data)}\\n${embedded}\\n${torchPageScript()}`;"
    if new2 in s and old2 not in s:
        log.append('2 already applied (no nested wrapper)')
    elif old2 in s:
        s = s.replace(old2, new2, 1); log.append('2 OK handleTorch wrapper removed')
    else:
        log.append('2 SKIP — exact anchor not found')

    # ── 3. post images use lightbox, not new tab ──
    old3 = """postImages.map(function(img, i) { return '<a href="' + htmlEscape(img.url) + '" target="_blank" rel="noopener">"""
    new3 = """postImages.map(function(img, i) { return '<a @click.prevent="openImageLightbox(\\'' + String(img.url).replace(/'/g, "\\\\'") + '\\')" class="cursor-zoom-in" role="button" tabindex="0">"""
    if new3 in s:
        log.append('3 already applied (image anchor uses @click.prevent)')
    elif old3 in s:
        s = s.replace(old3, new3, 1); log.append('3 OK post image anchor → lightbox')
    else:
        log.append('3 SKIP — image anchor not found')

    # ── 4. torchPageScript shims ──
    old4 = "function torchPageScript() {\n  return '';\n}"
    if old4 in s:
        new4 = r'''function torchPageScript() {
  return `<script>
(function(){
  function install(){
    if (typeof window.torchPage !== 'function') return;
    var orig = window.torchPage;
    window.torchPage = function(){
      var obj = orig.apply(this, arguments);
      if (!obj.openImageLightbox) obj.openImageLightbox = function(u){ if (u) this.imageLightbox = u; };
      if (!obj.parseImages) obj.parseImages = function(raw){ if (!raw) return []; try { var a = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(a) ? a : []; } catch(e){ return []; } };
      if (!obj.plainExcerpt) obj.plainExcerpt = function(t, m){ t = String(t || ''); m = m || 600; return t.length <= m ? t : t.slice(0, m).replace(/\s+\S*$/, '') + '\u2026'; };
      if (!obj.shouldCollapse) obj.shouldCollapse = function(t, m){ return !!t && String(t).length > (m || 600); };
      if (!obj.formatTime) obj.formatTime = function(ts){ try { return new Date(ts).toLocaleString(); } catch(e){ return ''; } };
      if (!obj.renderMarkdown) obj.renderMarkdown = function(t){
        if (!t) return '';
        if (window.markdownit){
          if (!window._ttMdT){
            window._ttMdT = window.markdownit({html:false,linkify:true,breaks:true});
            var dl = window._ttMdT.renderer.rules.link_open || function(tok,i,o,e,self){ return self.renderToken(tok,i,o); };
            window._ttMdT.renderer.rules.link_open = function(tok,i,o,e,self){ tok[i].attrSet('target','_blank'); tok[i].attrSet('rel','nofollow ugc noopener'); return dl(tok,i,o,e,self); };
          }
          return window._ttMdT.render(String(t));
        }
        return '<p style="white-space:pre-wrap">' + String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>';
      };
      return obj;
    };
  }
  if (document.readyState !== 'loading') install(); else document.addEventListener('DOMContentLoaded', install);
})();
<\/script>`;
}'''
        s = s.replace(old4, new4, 1); log.append('4 OK torchPageScript shims injected')
    elif 'openImageLightbox' in s and 'window.torchPage = function()' in s:
        log.append('4 already applied (shims present)')
    else:
        log.append('4 SKIP — torchPageScript anchor not found')

    open(TJ, 'w').write(s)
    return log

def profile_patches():
    h = open(PH).read()
    log = []
    if 'classList.add("collapsed")' in h:
        return ['SKIP — pre-collapse already present']
    marker = '<aside id="desktopSidebar" class="'
    idx = h.find(marker)
    if idx < 0:
        return ['FAIL — <aside id="desktopSidebar" not found']
    close = h.find('>', idx)
    script = '\n  <script>if(/^\\/(torcher|torch)\\//.test(location.pathname)){document.getElementById("desktopSidebar").classList.add("collapsed");}</script>'
    h = h[:close+1] + script + h[close+1:]
    open(PH, 'w').write(h)
    return ['OK pre-collapse script inserted']

if __name__ == '__main__':
    for line in torch_patches(): print('torch.js |', line)
    for line in profile_patches(): print('profile  |', line)
