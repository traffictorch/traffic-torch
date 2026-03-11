export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

shareBtn.addEventListener('click', async () => {
  const inputUrl = document.getElementById('url-input')?.value.trim();
  if (!inputUrl) return; // silent fail

  // Build clean deep link
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

  // Get clean page title from URL path (fallback to domain if empty)
  let pageTitle = inputUrl
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .split('/').pop()
    .replace(/-/g, ' ')
    .replace(/\.[a-z]+$/, '')
    .trim();

  if (!pageTitle || pageTitle.includes('.')) {
    pageTitle = inputUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'this page';
  }

  // Final share text – clean and natural
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
      // Clipboard fallback + explicit message
      await navigator.clipboard.writeText(shareText);
      showMessage('Report link copied to clipboard!<br>Paste anywhere to share.', 'success');
    }
  } catch (err) {
    console.error('Share failed:', err);
    showMessage('Could not copy/share – please copy manually.', 'error');
  }
});

function showMessage(text, type = 'success') {
  let messageDiv = document.getElementById('share-message');
  
  // Create message div if it doesn't exist yet
  if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.id = 'share-message';
    messageDiv.className = 'mt-4 p-4 rounded-2xl text-center font-medium hidden';
    document.querySelector('#results')?.appendChild(messageDiv); // append to results container
  }

  messageDiv.innerHTML = type === 'success' 
    ? `✅ ${text}` 
    : `❌ ${text}`;
  
  messageDiv.classList.remove('hidden', 'text-green-600', 'bg-green-100', 'dark:bg-green-900/30', 
                              'text-red-600', 'bg-red-100', 'dark:bg-red-900/30');
  
  messageDiv.classList.add(
    type === 'success' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30',
    'dark:text-gray-200'
  );

  // Show and auto-hide after 6 seconds
  messageDiv.classList.remove('hidden');
  setTimeout(() => messageDiv.classList.add('hidden'), 6000);
}
}