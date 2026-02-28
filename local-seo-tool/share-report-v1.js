export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) {
    console.warn('[ShareReport] Button #share-report-btn not found');
    return;
  }

  shareBtn.addEventListener('click', async () => {
    const pageUrlInput = document.getElementById('page-url');
    const inputUrl = pageUrlInput?.value.trim() || '';

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = inputUrl 
      ? `${baseUrl}?url=${encodeURIComponent(inputUrl)}` 
      : baseUrl;

    let pageTitle = 'this page';
    const titleElement = document.getElementById('analyzed-page-title');
    if (titleElement) {
      pageTitle = titleElement.textContent.trim();
    } else {
      pageTitle = document.title.trim() || 'this page';
    }

    pageTitle = pageTitle
      .replace(/Local SEO On-Page Checker – Audit Tool | Traffic Torch/gi, '')
      .trim() || 'this page';

    // ── FINAL CLEAN FORMAT ───────────────────────────────────────────────────────
    // No line breaks, no extra spacing, URL only once at the end
    const shareText = `Check out ${pageTitle} local SEO report on Traffic Torch Local SEO Report ${shareUrl}`;

    try {
      if (navigator.share) {
        // Web Share API: explicit url property prevents most platforms from adding extra URL
        await navigator.share({
          title: 'Traffic Torch Local SEO Report',
          text: shareText,
          url: shareUrl
        });
        showMessage('Shared successfully!', 'success');
      } else {
        // Clipboard fallback: same clean single-line text
        await navigator.clipboard.writeText(shareText);
        showMessage('Link copied to clipboard!<br>Paste anywhere to share.', 'success');
      }
    } catch (err) {
      console.error('[ShareReport] Share/clipboard failed:', err);
      showMessage('Could not share or copy. Please copy manually.', 'error');
    }
  });

  function showMessage(text, type) {
    const messageDiv = document.getElementById('share-message');
    if (!messageDiv) return;

    messageDiv.innerHTML = type === 'success' 
      ? `✅ ${text}` 
      : `❌ ${text}`;

    messageDiv.className = `mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto ${
      type === 'success'
        ? 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-200 border border-green-300'
        : 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-200 border border-red-300'
    }`;

    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 6000);
  }
}