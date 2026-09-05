// share-module.js – Dashboard UI with print classes, fixed forms, dark/light

export function initShareModule(container, results) {
  if (!container) return;
  const {
    toolName, url, pageTitle, overallScore,
    moduleScores, passedMetrics, failedMetrics, aiFixes = [], rawData = {}
  } = results;

  const shareLink = `${window.location.origin}/?url=${encodeURIComponent(url)}`;

  const scoreColorClass = (s) => s >= 80 ? 'text-green-500' : s >= 60 ? 'text-orange-500' : 'text-red-500';
  const ringColorHex = (s) => s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';

  container.innerHTML = `
    <div class="share-dashboard glass-card" style="padding:2rem; border-radius:2rem; background:rgba(255,255,255,0.06); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.12); margin-top:2rem;">
      
      <!-- Header (hidden in print) -->
      <div class="share-dashboard-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:2rem;">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          <span style="font-size:1.8rem;">📊</span>
          <h2 style="font-weight:800; font-size:1.5rem; margin:0; background:linear-gradient(135deg,#f97316,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${toolName} Dashboard</h2>
        </div>
        <div class="overall-score-ring flex items-center gap-3">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Overall</span>
          <div class="relative w-16 h-16" style="overflow:visible;">
            <svg viewBox="0 0 64 64" class="w-16 h-16" style="overflow:visible;">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" stroke-width="6" transform="rotate(-90 32 32)" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="${ringColorHex(overallScore)}" stroke-width="6"
                stroke-dasharray="${(overallScore/100)*175.93} 175.93" stroke-linecap="round" transform="rotate(-90 32 32)" />
              <text x="32" y="34" text-anchor="middle" dominant-baseline="middle" class="text-sm font-extrabold fill-gray-900 dark:fill-white">${overallScore}</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- Module Scores Grid (visible in print) -->
      <div class="module-scores-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:1rem; margin-bottom:2rem;">
        ${moduleScores.map(m => `
          <div style="background:rgba(255,255,255,0.05); border-radius:1rem; padding:0.8rem 1rem; text-align:center; border:1px solid rgba(255,255,255,0.06);">
            <div class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">${m.name}</div>
            <div class="text-2xl font-extrabold ${scoreColorClass(m.score)}">${m.score}</div>
          </div>
        `).join('')}
      </div>

      <!-- Passed / Failed Metrics (visible in print) -->
      <div class="passed-failed-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem;">
        <div style="background:rgba(34,197,94,0.08); border-radius:1rem; padding:0.8rem 1.2rem;">
          <h4 class="font-semibold text-green-600 dark:text-green-400 text-sm mb-2">✅ Passed</h4>
          <ul class="list-none text-sm text-gray-700 dark:text-gray-300 space-y-1">
            ${passedMetrics.slice(0,5).map(m => `<li class="border-b border-gray-200/50 dark:border-gray-700/50 py-1">${m}</li>`).join('')}
            ${passedMetrics.length > 5 ? `<li class="text-gray-400 dark:text-gray-500 text-xs">+${passedMetrics.length-5} more</li>` : ''}
          </ul>
        </div>
        <div style="background:rgba(239,68,68,0.08); border-radius:1rem; padding:0.8rem 1.2rem;">
          <h4 class="font-semibold text-red-600 dark:text-red-400 text-sm mb-2">❌ Failed</h4>
          <ul class="list-none text-sm text-gray-700 dark:text-gray-300 space-y-1">
            ${failedMetrics.slice(0,5).map(m => `<li class="border-b border-gray-200/50 dark:border-gray-700/50 py-1">${m}</li>`).join('')}
            ${failedMetrics.length > 5 ? `<li class="text-gray-400 dark:text-gray-500 text-xs">+${failedMetrics.length-5} more</li>` : ''}
          </ul>
        </div>
      </div>

      <!-- AI Fixes (visible in print) -->
      ${aiFixes && aiFixes.length ? `
        <div class="ai-fixes-section" style="margin-bottom:2rem;">
          <h4 class="font-semibold text-purple-600 dark:text-purple-400 text-sm mb-2">💡 AI‑Generated Fixes</h4>
          <ul class="list-none text-sm text-gray-700 dark:text-gray-300 space-y-1">
            ${aiFixes.map(f => `<li class="border-b border-gray-200/50 dark:border-gray-700/50 py-1">${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Three Cards (Share, Export, Send) – hidden in print -->
      <div class="share-dashboard-actions" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:1.5rem;">
        
        <!-- Share Card -->
        <div style="background:rgba(255,255,255,0.05); border-radius:1rem; padding:1rem; border:1px solid rgba(255,255,255,0.06);">
          <h4 class="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-3">📤 Share Report</h4>
          <div class="flex flex-wrap gap-2 items-center">
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="copyLink">🔗 Link</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="copySummary">📝 Summary</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="badge">🏅 Badge</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="qr">📱 QR</button>
          </div>
        </div>

        <!-- Export Card -->
        <div style="background:rgba(255,255,255,0.05); border-radius:1rem; padding:1rem; border:1px solid rgba(255,255,255,0.06);">
          <h4 class="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-3">💾 Export</h4>
          <div class="flex flex-wrap gap-2 items-center">
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="exportCSV">📊 CSV</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="rawData">📦 JSON</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="print">🖨️ Print</button>
          </div>
        </div>

        <!-- Send / Invite Card -->
        <div style="background:rgba(255,255,255,0.05); border-radius:1rem; padding:1rem; border:1px solid rgba(255,255,255,0.06);">
          <h4 class="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-3">✉️ Send</h4>
          <div class="flex flex-wrap gap-2 items-center">
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="emailClient">📧 Client</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="emailSelf">📧 Self</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="inviteEmail">✉️ Invite</button>
            <button class="share-btn px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm" data-action="feedback">💬 Feedback</button>
          </div>
        </div>
      </div>

      <!-- Email Form (hidden by default) -->
      <div id="share-email-area" style="display:none; margin-top:1rem;">
        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          <input type="email" id="share-email-input" placeholder="recipient@example.com" class="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <textarea id="share-email-message" rows="3" placeholder="Custom message (optional)" class="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"></textarea>
          <button id="share-send-email" style="padding:0.4rem 1.5rem; background:linear-gradient(135deg,#f97316,#ec4899); border:none; border-radius:0.5rem; color:white; font-weight:600; cursor:pointer;">Send</button>
        </div>
        <div id="share-email-status" class="mt-2 text-sm text-gray-500 dark:text-gray-400"></div>
      </div>

      <!-- Badge Area (hidden by default) -->
      <div id="share-badge-area" style="display:none; margin-top:1rem;">
        <p class="font-semibold text-gray-700 dark:text-gray-200 mb-1">Copy this HTML badge:</p>
        <textarea id="share-badge-html" rows="2" class="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm" readonly></textarea>
        <button id="copy-badge-btn" class="mt-2 px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 shadow-sm">Copy Badge</button>
      </div>

      <!-- QR Area (hidden by default) -->
      <div id="share-qr-area" style="display:none; margin-top:1rem; text-align:center;">
        <div id="share-qr-container"></div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Scan to open on mobile</p>
      </div>

      <!-- Feedback Form (hidden by default) -->
      <div id="share-feedback-area" style="display:none; margin-top:1rem;">
        <div style="background:rgba(255,255,255,0.05); border-radius:1rem; padding:1rem; border:1px solid rgba(255,255,255,0.06);">
          <h4 class="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-3">💬 Submit Feedback</h4>
          <div style="display:flex; gap:0.5rem; margin-bottom:0.8rem;">
            <button class="feedback-rating" data-rating="1" style="font-size:2rem; background:transparent; border:none; cursor:pointer; transition:0.2s;">😡</button>
            <button class="feedback-rating" data-rating="2" style="font-size:2rem; background:transparent; border:none; cursor:pointer; transition:0.2s;">😕</button>
            <button class="feedback-rating" data-rating="3" style="font-size:2rem; background:transparent; border:none; cursor:pointer; transition:0.2s;">😐</button>
            <button class="feedback-rating" data-rating="4" style="font-size:2rem; background:transparent; border:none; cursor:pointer; transition:0.2s;">😊</button>
            <button class="feedback-rating" data-rating="5" style="font-size:2rem; background:transparent; border:none; cursor:pointer; transition:0.2s;">🤩</button>
          </div>
          <input type="hidden" id="feedback-rating-value" value="">
          <textarea id="feedback-text" rows="3" placeholder="Tell us what you think..." class="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-vertical"></textarea>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem;">
            <span id="char-count" class="text-xs text-gray-500 dark:text-gray-400">0</span>
            <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; color:#94a3b8;">
              <input type="checkbox" id="reply-requested"> Reply requested
            </label>
          </div>
          <div id="feedback-email-group" style="display:none; margin-top:0.6rem;">
            <input type="email" id="feedback-email" placeholder="Your email for reply" class="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          </div>
          <button id="send-feedback-btn" style="margin-top:0.6rem; padding:0.4rem 1.5rem; background:linear-gradient(135deg,#f97316,#ec4899); border:none; border-radius:0.5rem; color:white; font-weight:600; cursor:pointer;">Send Feedback</button>
          <div id="feedback-status" class="mt-2 text-sm text-gray-500 dark:text-gray-400"></div>
        </div>
      </div>

      <!-- Footer (hidden in print) -->
      <div class="share-dashboard-footer mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 text-center text-xs text-gray-400 dark:text-gray-500">
        Generated by <a href="https://traffictorch.net" class="text-orange-400 dark:text-orange-500 hover:underline">Traffic Torch</a>
      </div>
    </div>
  `;

  // ─── Event Listeners ──────────────────────────────────────────────
  container.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      try {
        switch(action) {
          case 'copyLink': copyLink(); break;
          case 'copySummary': copySummary(); break;
          case 'exportCSV': exportCSV(); break;
          case 'print': window.print(); break;
          case 'emailClient': showEmailInput('client'); break;
          case 'emailSelf': showEmailInput('self'); break;
          case 'inviteEmail': showEmailInput('invite'); break;
          case 'badge': toggleBadge(); break;
          case 'qr': toggleQR(); break;
          case 'rawData': exportRawData(); break;
          case 'feedback': toggleFeedback(); break;
          default: break;
        }
      } catch (err) {
        console.error(`Share action "${action}" failed:`, err);
        alert(`Action failed: ${err.message}`);
      }
    });
  });

  // ─── Action implementations ──────────────────────────────────────

  // (copyLink, copySummary, exportCSV, showEmailInput, toggleBadge, toggleQR, exportRawData, toggleFeedback)
  // These are unchanged from the previous version – include them as they were.
  // I'll re‑include them for completeness.

  function copyLink() {
    navigator.clipboard.writeText(shareLink).then(() => alert('Link copied!')).catch(() => prompt('Copy:', shareLink));
  }

  function copySummary() {
    const summary = `${toolName} report for ${pageTitle}\nOverall: ${overallScore}\nModules:\n${moduleScores.map(m => `  ${m.name}: ${m.score}`).join('\n')}\nPassed: ${passedMetrics.slice(0,3).join(', ') || 'None'}\nFailed: ${failedMetrics.slice(0,3).join(', ') || 'None'}`;
    navigator.clipboard.writeText(summary).then(() => alert('Summary copied!')).catch(() => prompt('Copy:', summary));
  }

  function exportCSV() {
    let csv = 'Module,Score\n';
    moduleScores.forEach(m => csv += `${m.name},${m.score}\n`);
    csv += `\nOverall,${overallScore}\nPassed,${passedMetrics.join('; ')}\nFailed,${failedMetrics.join('; ')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${toolName}-report.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function showEmailInput(type) {
    const area = document.getElementById('share-email-area');
    if (area.style.display === 'block') {
      area.style.display = 'none';
      return;
    }
    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const sendBtn = document.getElementById('share-send-email');
    const status = document.getElementById('share-email-status');
    const msgField = document.getElementById('share-email-message');
    const emailField = document.getElementById('share-email-input');

    let subject = '';
    let body = '';
    if (type === 'client') {
      subject = `Your ${toolName} report for ${pageTitle}`;
      body = `Hello,\n\nHere is your ${toolName} report for ${pageTitle}.\n\nOverall Score: ${overallScore}\n\nView full report: ${shareLink}\n\nBest regards,\nTraffic Torch`;
    } else if (type === 'self') {
      subject = `My ${toolName} report for ${pageTitle}`;
      body = `Hello,\n\nHere is my ${toolName} report for ${pageTitle}.\n\nOverall Score: ${overallScore}\n\nView full report: ${shareLink}\n\nBest regards,\nTraffic Torch`;
    } else if (type === 'invite') {
      subject = `Invitation to view ${toolName} report for ${pageTitle}`;
      body = `Hello,\n\nI'd like to share my ${toolName} report for ${pageTitle}.\n\nOverall Score: ${overallScore}\n\nView full report: ${shareLink}\n\nBest regards,\nTraffic Torch`;
    }

    emailField.placeholder = type === 'self' ? 'your-email@example.com' : 'recipient@example.com';
    msgField.value = body;

    sendBtn.replaceWith(sendBtn.cloneNode(true));
    const newSend = document.getElementById('share-send-email');
    newSend.addEventListener('click', async () => {
      const email = emailField.value.trim();
      if (!email) { status.textContent = 'Please enter an email.'; return; }
      const message = msgField.value.trim() || body;
      status.textContent = 'Sending...';
      newSend.disabled = true;
      try {
        const formData = new FormData();
        formData.append('name', 'Traffic Torch User');
        formData.append('email', email);
        formData.append('message', `Subject: ${subject}\n\n${message}`);
        const res = await fetch('/api/contact', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(await res.text());
        status.textContent = '✅ Email sent!';
        emailField.value = '';
        msgField.value = '';
        setTimeout(() => { area.style.display = 'none'; status.textContent = ''; }, 4000);
      } catch (err) {
        status.textContent = `❌ Error: ${err.message}`;
      } finally {
        newSend.disabled = false;
      }
    });
  }

  function toggleBadge() {
    const area = document.getElementById('share-badge-area');
    if (area.style.display === 'block') {
      area.style.display = 'none';
      return;
    }
    const badgeHTML = `
<div style="display:inline-block; background:linear-gradient(135deg,#f97316,#ec4899); color:white; padding:0.5rem 1.5rem; border-radius:9999px; font-weight:bold; font-size:0.9rem; text-align:center;">
  Traffic Torch Optimized 🏆<br>
  <span style="font-size:0.8rem; opacity:0.9;">${toolName} Score: ${overallScore}</span>
  <div style="font-size:0.6rem; opacity:0.7; margin-top:0.2rem;">${shareLink}</div>
</div>`;
    document.getElementById('share-badge-html').value = badgeHTML;
    area.style.display = 'block';
    document.getElementById('copy-badge-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(badgeHTML).then(() => alert('Badge copied!'));
    });
  }

  let qrLoaded = false;
  function toggleQR() {
    const area = document.getElementById('share-qr-area');
    if (area.style.display === 'block') {
      area.style.display = 'none';
      return;
    }
    area.style.display = 'block';
    if (!qrLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.onload = () => { qrLoaded = true; generateQR(); };
      document.head.appendChild(script);
    } else generateQR();
    function generateQR() {
      const container = document.getElementById('share-qr-container');
      container.innerHTML = '';
      new QRCode(container, { text: shareLink, width: 200, height: 200, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
    }
  }

  function exportRawData() {
    const json = JSON.stringify({ toolName, url, pageTitle, overallScore, moduleScores, passedMetrics, failedMetrics, aiFixes, rawData }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${toolName}-report.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function toggleFeedback() {
    const area = document.getElementById('share-feedback-area');
    if (area.style.display === 'block') {
      area.style.display = 'none';
      return;
    }
    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Rating buttons
    const ratingBtns = area.querySelectorAll('.feedback-rating');
    const ratingHidden = document.getElementById('feedback-rating-value');
    ratingBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ratingBtns.forEach(b => b.style.transform = 'scale(1)');
        btn.style.transform = 'scale(1.5)';
        ratingHidden.value = btn.dataset.rating;
      });
    });

    // Reply checkbox
    const replyCheckbox = document.getElementById('reply-requested');
    const emailGroup = document.getElementById('feedback-email-group');
    replyCheckbox.addEventListener('change', () => {
      emailGroup.style.display = replyCheckbox.checked ? 'block' : 'none';
    });

    // Char counter
    const textarea = document.getElementById('feedback-text');
    const charCount = document.getElementById('char-count');
    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
    });

    // Send feedback
    const sendBtn = document.getElementById('send-feedback-btn');
    const status = document.getElementById('feedback-status');
    sendBtn.addEventListener('click', async () => {
      const rating = ratingHidden.value || 'None';
      const text = textarea.value.trim();
      const reply = replyCheckbox.checked;
      const email = reply ? document.getElementById('feedback-email').value.trim() : '';

      if (!text) { status.textContent = 'Please enter your feedback.'; return; }
      status.textContent = 'Sending...';
      sendBtn.disabled = true;
      try {
        const formData = new FormData();
        formData.append('name', 'Traffic Torch User');
        formData.append('email', email || 'no-reply@traffictorch.net');
        formData.append('message', `Feedback for ${toolName} report on ${pageTitle}\nRating: ${rating}\n\n${text}`);
        const res = await fetch('/api/contact', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(await res.text());
        status.textContent = '✅ Thank you! Feedback sent.';
        textarea.value = '';
        charCount.textContent = '0';
        ratingHidden.value = '';
        ratingBtns.forEach(b => b.style.transform = 'scale(1)');
        replyCheckbox.checked = false;
        emailGroup.style.display = 'none';
        setTimeout(() => { area.style.display = 'none'; status.textContent = ''; }, 4000);
      } catch (err) {
        status.textContent = `❌ Error: ${err.message}`;
      } finally {
        sendBtn.disabled = false;
      }
    });
  }
}