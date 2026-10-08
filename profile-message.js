// Traffic Torch — Send Message button on /torcher/:username/
// Reads window.__ttProfile (injected by the render worker). No API call.
(function () {
  const API = 'https://traffic-torch-auth.traffictorch.workers.dev';

  const getToken = () => localStorage.getItem('authToken');
  const decodeJwt = t => {
    try { return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
    catch { return null; }
  };
  const esc = s => String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(text, ok = true) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:${ok ? '#111827' : '#ef4444'};color:#fff;padding:12px 20px;border-radius:12px;
      z-index:999999;font-size:14px;font-family:system-ui,sans-serif;
      box-shadow:0 10px 30px rgba(0,0,0,0.3);`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function buildModal(recipient) {
    const dark = document.documentElement.classList.contains('dark');
    const bg = dark ? '#111827' : '#ffffff';
    const fg = dark ? '#f3f4f6' : '#111827';
    const inputBg = dark ? '#1f2937' : '#ffffff';
    const inputBd = dark ? '#4b5563' : '#d1d5db';

    const modal = document.createElement('div');
    modal.id = 'tt-compose-modal';
    // Bulletproof centering: grid + place-items. Ignores parent transforms/filters.
    modal.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);
      display:grid;place-items:center;z-index:2147483646;
      padding:16px;overflow:auto;box-sizing:border-box;`;

    modal.innerHTML = `
      <div style="background:${bg};color:${fg};max-width:520px;width:100%;
                  border-radius:16px;padding:24px;box-sizing:border-box;
                  box-shadow:0 20px 50px rgba(0,0,0,0.35);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:18px;font-weight:700;">
            Message ${esc(recipient.display_name || recipient.username)}
          </h3>
          <button type="button" data-tt-close style="background:none;border:none;font-size:26px;
                  cursor:pointer;color:${fg};line-height:1;padding:0 4px;">&times;</button>
        </div>
        <textarea data-tt-body maxlength="2000" rows="6" placeholder="Write a message…"
          style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;
                 border:1px solid ${inputBd};background:${inputBg};color:${fg};
                 font-family:inherit;font-size:14px;resize:vertical;outline:none;"></textarea>
        <p style="font-size:12px;color:#9ca3af;text-align:right;margin:6px 0 16px;">
          <span data-tt-count>0</span> / 2000
        </p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" data-tt-cancel
            style="padding:10px 20px;border-radius:10px;border:1px solid ${inputBd};
                   background:transparent;color:${fg};cursor:pointer;font-weight:600;">Cancel</button>
          <button type="button" data-tt-send
            style="padding:10px 24px;border-radius:10px;border:none;
                   background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;
                   font-weight:700;cursor:pointer;">Send</button>
        </div>
        <p data-tt-error style="color:#ef4444;font-size:13px;margin:12px 0 0;"></p>
      </div>`;
    return modal;
  }

  function wireModal(modal, recipient) {
    const body = modal.querySelector('[data-tt-body]');
    const count = modal.querySelector('[data-tt-count]');
    const send = modal.querySelector('[data-tt-send]');
    const cancel = modal.querySelector('[data-tt-cancel]');
    const close = modal.querySelector('[data-tt-close]');
    const err = modal.querySelector('[data-tt-error]');

    body.addEventListener('input', () => { count.textContent = body.value.length; });
    body.focus();

    const dismiss = () => {
      modal.remove();
      document.removeEventListener('keydown', onEsc);
    };
    const onEsc = e => { if (e.key === 'Escape') dismiss(); };

    cancel.addEventListener('click', dismiss);
    close.addEventListener('click', dismiss);
    modal.addEventListener('click', e => { if (e.target === modal) dismiss(); });
    document.addEventListener('keydown', onEsc);

    send.addEventListener('click', async () => {
      const text = body.value.trim();
      if (!text) { err.textContent = 'Message cannot be empty'; return; }
      send.disabled = true;
      const orig = send.textContent;
      send.textContent = 'Sending…';
      err.textContent = '';
      try {
        const r = await fetch(`${API}/api/messages/send`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_user_id: recipient.id, body: text })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Send failed');
        dismiss();
        toast('Message sent ✓');
      } catch (e) {
        err.textContent = e.message;
        send.disabled = false;
        send.textContent = orig;
      }
    });
  }

  function findActionAnchor() {
    // Look for the "In Your Network" / "Add to Network" / "Follow" button —
    // that's the top-right action area where our button belongs.
    const nodes = document.querySelectorAll('a, button');
    for (const el of nodes) {
      const t = (el.textContent || '').trim().toLowerCase();
      if (t.includes('in your network')) return el;
      if (t.includes('add to network')) return el;
      if (t === 'follow' || t === 'unfollow') return el;
    }
    return null;
  }

  function install() {
    const recipient = window.__ttProfile;
    if (!recipient || !recipient.id) return;
    if (document.getElementById('tt-send-message-btn')) return;

    const token = getToken();
    if (!token) return;

    const me = decodeJwt(token);
    if (!me || !me.id) return;

    if (recipient.id === me.id) return;
    if (recipient.username && me.username && recipient.username === me.username) return;
    if (recipient.messages_blocked === 1) return;

    const h1 = document.querySelector('main h1') || document.querySelector('h1');
    if (!h1) return;

    const btn = document.createElement('button');
    btn.id = 'tt-send-message-btn';
    btn.type = 'button';
    btn.innerHTML = '✉️ <span>Send Message</span>';
    btn.style.cssText = `
      display:inline-flex;align-items:center;gap:6px;
      padding:10px 18px;border-radius:12px;border:none;
      background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;
      font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;
      box-shadow:0 4px 14px rgba(249,115,22,0.35);
      transition:transform 0.15s ease,opacity 0.15s ease;
      white-space:nowrap;`;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-1px)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    btn.addEventListener('click', () => {
      const m = buildModal(recipient);
      wireModal(m, recipient);
      document.body.appendChild(m);
    });

    // Preferred: sit next to the "In Your Network" button
    const anchor = findActionAnchor();
    if (anchor && anchor.parentElement) {
      // If anchor is in a flex row, prepend our button so it lands to the left
      anchor.parentElement.insertBefore(btn, anchor);
      return;
    }

    // Fallback: insert after the h1 (name) — right side of the name column
    if (h1.parentElement && h1.parentElement.tagName === 'H1') {
      h1.insertAdjacentElement('afterend', btn);
    } else {
      h1.insertAdjacentElement('afterend', btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }

  document.addEventListener('loginStatusChanged', install);
})();
