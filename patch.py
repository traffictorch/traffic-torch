#!/usr/bin/env python3
import re, shutil, os

TJ = 'torches/src/handlers/torch.js'
PH = 'profile.html'

def p_torch():
    s = open(TJ).read()
    log = []

    # 1 — stripProfileShell: keep x-data but swap factory to torchPage
    pat = re.compile(r'function stripProfileShell\(html\) \{.*?\n\}', re.DOTALL)
    rep = '''function stripProfileShell(html) {
  html = html.replace(/ x-data="profilePage\\(\\)"/, ' x-data="torchPage()"');
  html = html.replace(
    /<script>\\s*const API_BASE = [\\s\\S]*?window\\.profilePage = profilePage;\\s*<\\/script>/,
    ''
  );
  return html;
}'''
    s2, n = pat.subn(rep, s, count=1)
    if n: s = s2; log.append('OK stripProfileShell swapped')
    else: log.append('FAIL stripProfileShell')

    # 2 — handleTorch: drop nested x-data wrapper
    pat = re.compile(r'const wrapped = `<div x-data="torchPage\(\)" x-init="init\(\)">.*?</div>\\n\$\{torchPageScript\(\)\}`;')
    rep = 'const wrapped = `${renderTorchBody(data)}\\n${embedded}\\n${torchPageScript()}`;'
    s2, n = pat.subn(rep, s, count=1)
    if n: s = s2; log.append('OK handleTorch wrapper removed')
    else: log.append('FAIL handleTorch wrapper')

    # 3 — post image anchor: href target=_blank → @click.prevent lightbox
    old = """'<a href="' + htmlEscape(img.url) + '" target="_blank" rel="noopener"><img src="' + htmlEscape(img.url) + '" loading="lazy" alt="Image ' + (i+1) + '" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition" style="aspect-ratio:16/9;object-fit:cover;"></a>'"""
    new = '''"<a @click.prevent='openImageLightbox(\\"" + String(img.url).replace(/&/g,'&amp;').replace(/"/g,'&quot;') + "\\")' class='cursor-zoom-in' role='button' tabindex='0'><img src='" + htmlEscape(img.url) + "' loading='lazy' alt='Image " + (i+1) + "' class='w-full rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition' style='aspect-ratio:16/9;object-fit:cover;'></a>"'''
    if old in s:
        s = s.replace(old, new, 1); log.append('OK post image anchor → lightbox')
    else:
        log.append('FAIL post image anchor')

    # 4 — torchPageScript: inject shims (openImageLightbox, renderMarkdown, parseImages, etc.)
    pat = re.compile(r"function torchPageScript\(\) \{\s*return '';\s*\}", re.DOTALL)
    rep = """function torchPageScript() {
  return `<script>
(function(){
  function install(){
    if (typeof window.torchPage !== 'function') return;
    var orig = window.torchPage;
    window.torchPage = function(){
      var obj = orig.apply(this, arguments);
      if (!obj.openImageLightbox) obj.openImageLightbox = function(u){ if (u) this.imageLightbox = u; };
      if (!obj.parseImages) obj.parseImages = function(raw){ if (!raw) return []; try { var a = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(a) ? a : []; } catch(e){ return []; } };
      if (!obj.plainExcerpt) obj.plainExcerpt = function(t, m){ t = String(t || ''); m = m || 600; return t.length <= m ? t : t.slice(0, m).replace(/\\s+\\S*$/, '') + '\\u2026'; };
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
<\\/script>`;
}"""
    s2, n = pat.subn(rep, s, count=1)
    if n: s = s2; log.append('OK torchPageScript shims injected')
    else: log.append('FAIL torchPageScript')

    open(TJ, 'w').write(s)
    return log

def p_profile():
    h = open(PH).read()
    log = []
    if 'classList.add("collapsed")' in h:
        log.append('SKIP pre-collapse: already present')
        return log
    marker = '<aside id="desktopSidebar" class="'
    idx = h.find(marker)
    if idx < 0:
        log.append('FAIL <aside> not found'); return log
    close = h.find('>', idx)
    script = '\n  <script>if(/^\\/(torcher|torch)\\//.test(location.pathname)){document.getElementById("desktopSidebar").classList.add("collapsed");}</script>'
    h = h[:close+1] + script + h[close+1:]
    open(PH, 'w').write(h)
    log.append('OK pre-collapse script inserted')
    return log

if __name__ == '__main__':
    for line in p_torch(): print('torch.js  |', line)
    for line in p_profile(): print('profile  |', line)
