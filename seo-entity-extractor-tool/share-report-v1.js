export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const urlInput = document.getElementById('url-input')?.value.trim();
    const codeInput = document.getElementById('code-input')?.value.trim();

    // For HTML code audits we cannot create a deep link, so show helpful message
    if (!urlInput && codeInput) {
      const messageDiv = document.getElementById('share-message');
      if (messageDiv) {
        messageDiv.innerHTML = `⚠️ Share Report only works for URL audits.<br>For pasted HTML code use "Save Report" button.`;
        messageDiv.className = `mt-4 p-4 rounded-2xl text-center font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200`;
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 6000);
      }
      return;
    }

    if (!urlInput) return; // fallback safety

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

    // Get the tested page title — prioritised from the big readiness score card
    let pageTitle = 'this page';

    // Primary source: the exact title paragraph we just fixed in script-v1.0.js
    const scoreCardTitle = document.querySelector(
      '.bg-white.dark\\:bg-gray-900.rounded-3xl.shadow-2xl.p-8.md\\:p-12.w-full.max-w-lg.border-4 p.mt-6.text-center.text-base.md\\:text-lg.text-gray-700.dark\\:text-gray-300.px-4.leading-relaxed.break-words'
    );
    if (scoreCardTitle) {
      pageTitle = scoreCardTitle.textContent.trim();
    }

    // Fallback 1: Any title paragraph inside results (safer than before)
    if (pageTitle === 'this page' || pageTitle.length < 5) {
      pageTitle = document.querySelector('#results p.mt-6.text-center.text-base.md\\:text-lg')?.textContent.trim() || 'this page';
    }

    // Fallback 2: Use the URL the user actually tested (cleaned)
    if (pageTitle === 'this page' || pageTitle.includes('Traffic Torch') || pageTitle.length < 8) {
      const inputUrl = document.getElementById('url-input')?.value.trim() || '';
      if (inputUrl) {
        // Extract domain or keep full URL if short
        pageTitle = inputUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      }
    }

    // Final cleanup — remove any possible tool branding
    pageTitle = pageTitle
      .replace(/Semantic Entity Extractor and Audit Tool \| Traffic Torch/gi, '')
      .replace(/Traffic Torch/gi, '')
      .replace(/[\|\-–_]+/g, ' ')
      .trim() || 'this page';

    const shareText = `Check out ${pageTitle} on Traffic Torch SEO Entity Tool ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText
        });
        showMessage('Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link copied!<br>Paste anywhere to share.', 'success');
      }
    } catch (err) {
      // Silent fail on error – no error message shown to user
    }
  });

  function showMessage(text, type) {
    const messageDiv = document.getElementById('share-message');
    if (!messageDiv) return;
    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.className = `mt-4 p-4 rounded-2xl text-center font-medium ${
      type === 'success' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-200' : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-200'
    }`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 8000);
  }
}