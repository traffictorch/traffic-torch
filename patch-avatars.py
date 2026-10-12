#!/usr/bin/env python3
"""Batch-patch avatar rendering. Skips dist/. Idempotent."""
import pathlib, re

ROOT = pathlib.Path('/Users/yliacallan/Desktop/traffic-torch-new')
SCRIPT_TAG = '  <script src="/shared/avatar.js?v=1.0"></script>\n'

def add_script_tag(rel):
    p = ROOT / rel
    if not p.exists(): return print(f'  SKIP missing: {rel}')
    txt = p.read_text(encoding='utf-8')
    if '/shared/avatar.js' in txt: return print(f'  SKIP already: {rel}')
    new = txt.replace('</head>', SCRIPT_TAG + '</head>', 1)
    if new == txt: return print(f'  SKIP no </head>: {rel}')
    p.write_text(new, encoding='utf-8'); print(f'  OK  script tag → {rel}')

print('== 1. Add /shared/avatar.js script tag ==')
for rel in ['community/index.html', 'leader-board/index.html',
            'discover/04-dashboard-discover.html', 'discover/03-profile-discover.html']:
    add_script_tag(rel)

# Community + Discover — Alpine templates
print('\n== 2. Replace preset-only templates ==')
tmpl_pat = re.compile(r""":src="`/images/avatars/\$\{(\w+)\.avatar_preset \|\| 'owner'\}\.svg`\"""")
for rel in ['community/index.html', 'discover/04-dashboard-discover.html',
            'discover/03-profile-discover.html']:
    p = ROOT / rel
    txt = p.read_text(encoding='utf-8')
    new, n = tmpl_pat.subn(r':src="ttAvatarSrc(\1)"', txt)
    if n:
        p.write_text(new, encoding='utf-8'); print(f'  OK  {rel}: {n} replacement(s)')
    else:
        print(f'  SKIP no matches: {rel}')

# Leaderboard podium (inline script)
print('\n== 3. Leaderboard podium ==')
p = ROOT / 'leader-board/index.html'
txt = p.read_text(encoding='utf-8')

old_fetch = """          const pointsMap = {};
          const endorseMap = {};
          await Promise.all(rows.map(async (e) => {
            if (!e.username) return;
            try {
              const res = await fetch(`${AUTH_ENDPOINT}/api/torcher/${encodeURIComponent(e.username)}`);
              if (!res.ok) return;
              const data = await res.json();
              if (data.profile && typeof data.profile.total_points === 'number') {
                pointsMap[e.username] = data.profile.total_points;
              }
              if (data.profile && typeof data.profile.endorsement_count === 'number' && data.profile.endorsement_count > 0) {
                endorseMap[e.username] = data.profile.endorsement_count;
              }
            } catch {}
          }));"""
new_fetch = old_fetch.replace(
    "          const endorseMap = {};",
    "          const endorseMap = {};\n          const profilesMap = {};"
).replace(
    "              const data = await res.json();\n",
    "              const data = await res.json();\n              if (data.profile) profilesMap[e.username] = data.profile;\n",
    1
)
if old_fetch in txt:
    txt = txt.replace(old_fetch, new_fetch, 1); print('  OK  added profilesMap')
else:
    print('  WARN podium fetch block not found')

old_img = '<img class="lb-podium-profile-avatar" src="/images/avatars/${esc(e.avatar_preset || \'owner\')}.svg" alt="" loading="lazy">'
new_img = '<img class="lb-podium-profile-avatar" src="${esc(ttAvatarSrc(profilesMap[e.username] || e))}" alt="" loading="lazy">'
if old_img in txt:
    txt = txt.replace(old_img, new_img, 1); print('  OK  podium img rewritten')
else:
    print('  WARN podium img tag not found')
p.write_text(txt, encoding='utf-8')

# Contributions widget
print('\n== 4. Contributions widget ==')
p = ROOT / 'leader-board/contributions-widget.js'
txt = p.read_text(encoding='utf-8')
old = "    const avatar = `/images/avatars/${entry.avatar_preset || 'owner'}.svg`;"
new = "    const avatar = (typeof window.ttAvatarSrc === 'function') ? window.ttAvatarSrc(entry) : `/images/avatars/${entry.avatar_preset || 'owner'}.svg`;"
if old in txt:
    p.write_text(txt.replace(old, new, 1), encoding='utf-8'); print('  OK  patched')
else:
    print('  WARN avatar line not found')

# High-scores widget (needs async swap — data lacks avatar_url)
print('\n== 5. High-scores widget ==')
p = ROOT / 'leader-board/high-scores-widget.js'
txt = p.read_text(encoding='utf-8')

old_profile = """  function renderProfile(entry) {
    if (!entry.username) return '';
    const displayName = entry.display_name || entry.username;
    const avatar = entry.avatar_preset || 'owner';
    return `
      <div class="tt-lb-profile">
        <img class="tt-lb-profile-avatar" src="/images/avatars/${escapeHtml(avatar)}.svg" alt="" loading="lazy">"""
new_profile = """  function renderProfile(entry) {
    if (!entry.username) return '';
    const displayName = entry.display_name || entry.username;
    const src = (typeof window.ttAvatarSrc === 'function')
      ? window.ttAvatarSrc(entry)
      : '/images/avatars/' + (entry.avatar_preset || 'owner') + '.svg';
    return `
      <div class="tt-lb-profile">
        <img class="tt-lb-profile-avatar" data-username="${escapeHtml(entry.username)}" src="${escapeHtml(src)}" alt="" loading="lazy">"""
if old_profile in txt:
    txt = txt.replace(old_profile, new_profile, 1); print('  OK  renderProfile patched')
else:
    print('  WARN renderProfile not found')

old_hyd = """        const data = await r.json();
        const pts = data.profile && data.profile.total_points;
        const endorse = data.profile && data.profile.endorsement_count;
        const parts = [];
        if (typeof pts === 'number' && pts > 0) parts.push(`🏅 ${pts}`);
        if (typeof endorse === 'number' && endorse > 0) parts.push(`⭐ ${endorse}`);
        if (parts.length) {
          span.textContent = parts.join(' · ');
          span.hidden = false;
        }
      } catch {}"""
new_hyd = """        const data = await r.json();
        const p = data.profile || {};
        const pts = p.total_points;
        const endorse = p.endorsement_count;
        const parts = [];
        if (typeof pts === 'number' && pts > 0) parts.push(`🏅 ${pts}`);
        if (typeof endorse === 'number' && endorse > 0) parts.push(`⭐ ${endorse}`);
        if (parts.length) {
          span.textContent = parts.join(' · ');
          span.hidden = false;
        }
        if ((p.avatar_url || p.avatar_r2_key) && typeof window.ttAvatarSrc === 'function') {
          el.querySelectorAll('.tt-lb-profile-avatar').forEach(img => {
            if (img.dataset.username === username) img.src = window.ttAvatarSrc(p);
          });
        }
      } catch {}"""
if old_hyd in txt:
    txt = txt.replace(old_hyd, new_hyd, 1); print('  OK  hydratePoints patched')
else:
    print('  WARN hydratePoints block not found')
p.write_text(txt, encoding='utf-8')

print('\nDone. Run: git diff --stat')
