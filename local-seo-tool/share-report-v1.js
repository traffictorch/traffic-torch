export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) {
    console.warn('[ShareReport] Button #share-report-btn not found inside results container');
    return;
  }

  shareBtn.addEventListener('click', async () => {
    console.log('[ShareReport] Button clicked – starting share logic');

    // Get the analyzed URL from the input field (still visible on page)
    const pageUrlInput = document.getElementById('page-url');
    const inputUrl = pageUrlInput?.value.trim() || '';

    // Build shareable deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = inputUrl ? `${baseUrl}?url=${encodeURIComponent(inputUrl)}` : baseUrl;

    // Get page title from the visible element in score card
    let pageTitle = 'this page';
    const titleElement = document.getElementById('analyzed-page-title');
    if (titleElement) {
      pageTitle = titleElement.textContent.trim();
    } else {
      // Fallback
      pageTitle = document.title.trim() || 'this page';
    }

    pageTitle = pageTitle.replace(/Local SEO On-Page Checker – Audit Tool | Traffic Torch/gi, '').trim() || 'this page';

    const shareText = `Check out ${pageTitle} local SEO report on Traffic Torch:\n${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Traffic Torch Local SEO Report',
          text: shareText,
          url: shareUrl
        });
        showMessage('Shared successfully!', 'success');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        showMessage('Link copied to clipboard!<br>Paste it anywhere to share.', 'success');
      }
    } catch (err) {
      console.error('[ShareReport] Share/clipboard failed:', err);
      showMessage('Could not share or copy link. Please copy manually.', 'error');
    }
  });

  function showMessage(text, type) {
    const messageDiv = document.getElementById('share-message');
    if (!messageDiv) {
      console.warn('[ShareReport] #share-message element not found');
      return;
    }

    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.className = `mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto ${
      type === 'success'
        ? 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-200 border border-green-300'
        : 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-200 border border-red-300'
    }`;
    messageDiv.classList.remove('hidden');

    // Auto-hide after 6 seconds
    setTimeout(() => messageDiv.classList.add('hidden'), 6000);
  }

  console.log('[ShareReport] initShareReport completed – listener attached');
}