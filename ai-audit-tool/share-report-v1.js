// ai-audit-tool/share-report-v1.js
export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');

  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    try {
      const inputUrl = document.getElementById('url-input')?.value.trim();
      if (!inputUrl) {
        showMessage('No URL analyzed yet', 'error');
        return;
      }

      // Build clean deep link
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

      // Clean share text: use readable name from the tested/analyzed URL + single inline URL
      let pageName = 'this page';
      const inputUrl = document.getElementById('url-input')?.value.trim() || '';
      
      if (inputUrl) {
        try {
          const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : 'https://' + inputUrl);
          pageName = urlObj.hostname.replace(/^www\./i, '') + 
                     (urlObj.pathname !== '/' && urlObj.pathname ? ' ' + urlObj.pathname.slice(1).replace(/\//g, ' › ') : '');
        } catch {
          pageName = inputUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
        }
      }

      const shareText = `Check out ${pageName} on Traffic Torch AI Audit Tool: ${shareUrl}`;
      
      // Native share: only text with inline URL (no separate url param)
      if (navigator.share) {
        await navigator.share({
          title: 'Traffic Torch AI Audit Report',
          text: shareText
        });
        showMessage('Shared successfully!', 'success');
      } else {
        // Fallback: copy only the clean single-line text with one URL
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link copied!<br>Paste anywhere to share.', 'success');
      }
    } catch (err) {
      console.error('Share failed:', err);
      showMessage('Failed to share. Try copying the link manually.', 'error');
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

    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 8000);
}
}