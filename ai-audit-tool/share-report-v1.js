export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const inputUrl = document.getElementById('url-input')?.value.trim();
    if (!inputUrl) return; // silent fail – button shouldn't be visible anyway

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

    // Readable name from tested URL (domain + path)
    let pageName = 'this page';
    try {
      const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : 'https://' + inputUrl);
      pageName = urlObj.hostname.replace(/^www\./i, '') +
                 (urlObj.pathname !== '/' && urlObj.pathname ? ' › ' + urlObj.pathname.slice(1).replace(/\//g, ' › ') : '');
    } catch {
      pageName = inputUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    }

    // Clean text: tested page + tool + single URL (no colon break, no duplicate feel)
    const shareText = `Check out ${pageName} on Traffic Torch AI Audit Tool ${shareUrl}`;

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