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

      // Nice share text
      const pageTitle = document.title || 'this page';
      const shareText = `Check out ${pageTitle} on Traffic Torch AI Audit Tool:\n${shareUrl}`;

      // Try native share first
      if (navigator.share) {
        await navigator.share({
          title: 'Traffic Torch AI Audit Report',
          text: shareText,
          url: shareUrl
        });
        showMessage('Shared successfully!', 'success');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        showMessage('Link copied to clipboard!<br>Paste it anywhere to share the report.', 'success');
      }
    } catch (err) {
      console.error('Share failed:', err);
      showMessage('Failed to share. Try copying the link manually.', 'error');
    }
  });

  function showMessage(text, type) {
    const messageDiv = resultsContainer.querySelector('#share-message') || document.createElement('div');
    messageDiv.id = 'share-message';
    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.className = `mt-4 p-4 rounded-2xl text-center font-medium ${
      type === 'success' ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
    } dark:text-gray-200`;
    resultsContainer.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 8000);
  }
}