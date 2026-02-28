export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const pageUrlInput = document.getElementById('page-url');
    const inputUrl = pageUrlInput?.value.trim() || '';
    if (!inputUrl) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

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

    const shareText = `Check out ${pageTitle} local SEO report on Traffic Torch ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Traffic Torch Local SEO Report',
          text: shareText
          // No url: property — this is the key difference that works in your other tools
        });
        showMessage('Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link copied!<br>Paste anywhere to share.', 'success');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  });

  function showMessage(text, type) {
    const messageDiv = document.getElementById('share-message');
    if (!messageDiv) return;
    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.className = `mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto ${
      type === 'success' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-200 border border-green-300'
                         : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-200 border border-red-300'
    }`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 8000);
  }
} 