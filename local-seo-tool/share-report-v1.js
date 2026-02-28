export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    // Use the correct input ID from your form (page-url, not url-input)
    const pageUrlInput = document.getElementById('page-url');
    const inputUrl = pageUrlInput?.value.trim() || '';

    if (!inputUrl) return; // silent fail if no URL

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

    // Get page title from the score card element
    let pageTitle = 'this page';
    const titleElement = document.getElementById('analyzed-page-title');
    if (titleElement) {
      pageTitle = titleElement.textContent.trim();
    } else {
      // Fallback (robust selector from your HTML structure)
      pageTitle = document.querySelector('#analyzed-page-title')?.textContent.trim() ||
                  document.title.trim() ||
                  'this page';
    }

    // Clean up any leftover branding if present
    pageTitle = pageTitle
      .replace(/Local SEO On-Page Checker – Audit Tool | Traffic Torch/gi, '')
      .trim() || 'this page';

    // Final clean single-line text (exactly what you want)
    const shareText = `Check out ${pageTitle} local SEO report on Traffic Torch ${shareUrl}`;

    try {
      if (navigator.share) {
        // Mobile: send short text without URL + explicit url to avoid duplication
        await navigator.share({
          title: 'Traffic Torch Local SEO Report',
          text: `Check out ${pageTitle} local SEO report on Traffic Torch`,
          url: shareUrl
        });
        showMessage('Shared successfully!', 'success');
      } else {
        // Desktop/fallback: copy the exact desired line
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link copied!<br>Paste anywhere to share.', 'success');
      }
    } catch (err) {
      console.error('Share failed:', err);
      showMessage('Could not share or copy. Please copy manually.', 'error');
    }
  });

  function showMessage(text, type) {
    const messageDiv = document.getElementById('share-message');
    if (!messageDiv) return;

    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.className = `mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto ${
      type === 'success' 
        ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-200 border border-green-300' 
        : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-200 border border-red-300'
    }`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 8000);
  }
}