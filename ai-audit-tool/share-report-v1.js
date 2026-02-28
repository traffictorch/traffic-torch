export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const inputUrl = document.getElementById('url-input')?.value.trim();
    if (!inputUrl) return; // silent fail – button shouldn't be visible anyway

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

    // Use the exact same tested page title as shown in the score card (from data-title or document.title override)
    let pageTitle = document.querySelector('#results .text-center.text-lg.sm\\:text-xl.font-medium')?.textContent.trim() || 
                    document.title.trim() || 
                    'this page';

    // Clean up if it's still the tool's title
    if (pageTitle.includes('Traffic Torch') || pageTitle === 'AI Content Detector Tool – Perplex & Burst Checker | Traffic Torch') {
      pageTitle = 'this page';
    }

    const shareText = `Check out ${pageTitle} on Traffic Torch AI Audit Tool ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Traffic Torch AI Audit Report',
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