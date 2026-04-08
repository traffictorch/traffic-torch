export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const urlInput = document.getElementById('url-input')?.value.trim();
    const codeInput = document.getElementById('code-input')?.value.trim();

    // For HTML code audits we cannot create a deep link
    if (!urlInput && codeInput) {
      const messageDiv = document.getElementById('share-message');
      if (messageDiv) {
        messageDiv.innerHTML = `⚠️ Share Report only works for URL audits.<br>For HTML code audit use "Save Report" button.`;
        messageDiv.className = `mt-4 p-4 rounded-2xl text-center font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200`;
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 6000);
      }
      return;
    }

    if (!urlInput) {
      // Fallback safety - try to get the original analyzed URL from page title display or main input
      const titleDisplay = document.getElementById('page-title-display');
      if (titleDisplay && titleDisplay.textContent.includes('http')) {
        // rare case - but we still need a proper URL for sharing
      } else {
        const messageDiv = document.getElementById('share-message');
        if (messageDiv) {
          messageDiv.innerHTML = `⚠️ No URL found to share.<br>Please run a URL analysis first.`;
          messageDiv.className = `mt-4 p-4 rounded-2xl text-center font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200`;
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 6000);
        }
        return;
      }
    }

    // Build clean deep link using the current urlInput value
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(urlInput)}`;

    // Get the tested page title
    let pageTitle = 'this page';
    const titleDisplay = document.getElementById('page-title-display');
    if (titleDisplay && titleDisplay.textContent.trim()) {
      pageTitle = titleDisplay.textContent.trim();
    } else {
      pageTitle = document.title.replace(/ \| Traffic Torch SEO UX Audit Tool|Traffic Torch/gi, '').trim() || 'this page';
    }

    const shareText = `Check out ${pageTitle} on Traffic Torch SEO UX Audit Tool ${shareUrl}`;

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
      // Silent fail on error
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