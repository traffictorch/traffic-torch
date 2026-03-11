export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const inputUrl = document.getElementById('url-input')?.value.trim();
    if (!inputUrl) return; // silent fail – button shouldn't be visible anyway

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

    // Get the tested page title directly from the visible element in the score card
    let pageTitle = 'this page';
    const titleElement = document.getElementById('analyzed-page-title');
    if (titleElement) {
      pageTitle = titleElement.textContent.trim();
    } else {
      // Fallback if ID not found (e.g. old deploy)
      pageTitle = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-3xl.shadow-2xl.p-6.sm\\:p-8.md\\:p-10 p.mt-6.text-base.sm\\:text-lg')?.textContent.trim() ||
                  document.title.trim() ||
                  'this page';
    }

    // Remove any leftover tool name if needed
    pageTitle = pageTitle.replace(/AI Content Detector Tool – Perplex & Burst Checker | Traffic Torch/gi, '').trim() || 'this page';

    const shareText = `Check out ${pageTitle} on Traffic Torch AI Audit Tool ${shareUrl}`;

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
      console.error('Share failed:', err);
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