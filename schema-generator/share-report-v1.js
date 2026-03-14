export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const inputUrl = document.getElementById('url-input')?.value.trim();
    if (!inputUrl) return; // silent fail if no URL

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

    // Extract clean page title/domain (fallback to domain if path is empty or messy)
    let pageTitle = '';
    try {
      const urlObj = new URL(inputUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        pageTitle = pathParts.pop()
          .replace(/-/g, ' ')
          .replace(/\.[a-z]+$/, '')
          .trim();
      }
      if (!pageTitle) {
        pageTitle = urlObj.hostname.replace('www.', '');
      }
    } catch {
      pageTitle = inputUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'this site';
    }

    // Final share text – natural and concise
    const shareText = `Check out ${pageTitle} on Traffic Torch Schema Markup Generator & Detector Tool\n${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Traffic Torch Schema Report',
          text: shareText,
          url: shareUrl
        });
        showMessage('Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(shareText);
        showMessage('Link copied to clipboard!', 'success');
      }
    } catch (err) {
      console.error('Share/clipboard failed:', err);
      // No user-visible error message – silent fail as requested
    }
  });
}

function showMessage(text, type = 'success') {
  let messageDiv = document.getElementById('share-message');

  if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.id = 'share-message';
    messageDiv.className = 'mt-4 p-4 rounded-2xl text-center font-medium hidden';
    document.querySelector('#results')?.appendChild(messageDiv);
  }

  messageDiv.innerHTML = `✅ ${text}`;
  messageDiv.className = 'mt-4 p-4 rounded-2xl text-center font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-gray-200';

  messageDiv.classList.remove('hidden');
  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}