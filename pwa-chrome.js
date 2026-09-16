(() => {
  'use strict';

  // NOTE: /sw.js is already registered by /main-v1.1.js — do NOT re-register here.

  const $ = (s, r = document) => r.querySelector(s);

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true;

  /* =================== PULL TO REFRESH =================== */
  const ptr = $('#ptr');
  if (ptr) {
    const THRESHOLD = 72;
    const MAX = 110;
    const label = ptr.querySelector('.ptr__label');
    let startY = 0, pulling = false, tracking = false, refreshing = false;

    const setPull = (y, ready) => {
      const t = Math.min(y, MAX);
      ptr.style.transform = `translateY(${t}px)`;
      ptr.style.opacity = t > 8 ? '1' : '0';
      ptr.classList.toggle('is-visible', t > 8);
      ptr.classList.toggle('is-ready', ready);
      if (label) label.textContent = ready ? 'Release to refresh' : 'Pull to refresh';
    };

    const reset = () => {
      ptr.style.transform = 'translateY(0)';
      ptr.style.opacity = '0';
      ptr.classList.remove('is-visible', 'is-ready', 'is-refreshing');
      if (label) label.textContent = 'Pull to refresh';
    };

    window.addEventListener('touchstart', (e) => {
      if (refreshing || e.touches.length !== 1) return;
      if (window.scrollY > 0) return;
      startY = e.touches[0].clientY;
      tracking = true;
      pulling = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!tracking || refreshing || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        if (pulling) { pulling = false; reset(); }
        return;
      }
      if (window.scrollY > 0) return;
      pulling = true;
      const eased = Math.min(MAX, dy * 0.45);
      setPull(eased, eased >= THRESHOLD);
      if (e.cancelable) e.preventDefault();   // critical for iOS
    }, { passive: false });

    const endPull = () => {
      if (!tracking) return;
      tracking = false;
      if (!pulling) return;
      pulling = false;
      const current = parseFloat(
        (ptr.style.transform.match(/translateY\(([-\d.]+)px\)/) || [0, 0])[1]
      ) || 0;

      if (current >= THRESHOLD) {
        refreshing = true;
        ptr.classList.add('is-refreshing');
        if (label) label.textContent = 'Refreshing…';
        const ev = new CustomEvent('app:refresh', { cancelable: true });
        const notPrevented = window.dispatchEvent(ev);
        if (notPrevented) setTimeout(() => location.reload(), 180);
        else setTimeout(() => { refreshing = false; reset(); }, 600);
      } else {
        reset();
      }
    };

    window.addEventListener('touchend', endPull, { passive: true });
    window.addEventListener('touchcancel', endPull, { passive: true });
  }

  /* =================== FOOTER APPBAR =================== */
  const bar = $('#appbar');
  if (!bar) return;

  if (!isStandalone()) { bar.hidden = true; return; }

  bar.hidden = false;
  document.body.classList.add('has-appbar');

  const backBtn = bar.querySelector('[data-act="back"]');
  const fwdBtn = bar.querySelector('[data-act="forward"]');
  const refreshBtn = bar.querySelector('[data-act="refresh"]');
  const shareBtn = bar.querySelector('[data-act="share"]');
  const urlWrap = $('#abUrlWrap');
  const urlText = $('#abUrlText');
  const urlInput = $('#abUrlInput');
  const toast = $('#tt-toast');

  let canForward = false;

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('is-show'), 1800);
  };

  const displayUrl = () => {
    const p = location.pathname + location.search + location.hash;
    return p === '' ? '/' : p;
  };

  const syncUrl = () => { if (urlText) urlText.textContent = displayUrl(); };

  const syncButtons = () => {
    if (backBtn) backBtn.disabled = !(history.length > 1 || document.referrer);
    if (fwdBtn) fwdBtn.disabled = !canForward;
  };

  window.addEventListener('popstate', () => {
    syncUrl();
    canForward = true;
    syncButtons();
  });

  backBtn?.addEventListener('click', () => { canForward = true; history.back(); });
  fwdBtn?.addEventListener('click', () => history.forward());
  refreshBtn?.addEventListener('click', () => location.reload());

  shareBtn?.addEventListener('click', async () => {
    const data = { title: document.title, text: document.title, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); showToast('Link copied'); }
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Could not share');
    }
  });

  let editing = false;

  const startEdit = () => {
    if (editing || !urlWrap || !urlInput) return;
    editing = true;
    urlWrap.classList.add('is-editing');
    urlInput.value = displayUrl();
    urlInput.tabIndex = 0;
    urlInput.focus();
    urlInput.setSelectionRange(urlInput.value.length, urlInput.value.length);
  };

  const stopEdit = () => {
    editing = false;
    urlWrap?.classList.remove('is-editing');
    urlInput.tabIndex = -1;
    syncUrl();
  };

  urlWrap?.addEventListener('click', (e) => { if (e.target !== urlInput) startEdit(); });
  urlInput?.addEventListener('blur', stopEdit);

  urlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = urlInput.value.trim();
      if (!raw) return stopEdit();
      try {
        const u = new URL(raw, location.origin);
        if (u.origin === location.origin) location.href = u.pathname + u.search + u.hash;
        else window.open(u.href, '_blank', 'noopener');
      } catch { showToast('Invalid URL'); }
      stopEdit();
    }
    if (e.key === 'Escape') { e.preventDefault(); stopEdit(); }
  });

  let lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > lastY && y > 80) bar.classList.add('is-hidden');
      else bar.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  syncUrl();
  syncButtons();
})();