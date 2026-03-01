export function initShareReport(resultsContainer) {
  const shareBtn = document.getElementById('share-report-btn');
  if (!shareBtn) {
    console.warn("Share button #share-report-btn not found");
    return;
  }

  shareBtn.addEventListener('click', async () => {
    const inputUrl = document.getElementById('page-url')?.value.trim();
    if (!inputUrl) {
      showMessage('No URL entered yet', 'error');
      return;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const inputKeyword = document.getElementById('target-keyword')?.value.trim();
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}&keyword=${encodeURIComponent(inputKeyword || '')}`;

    let pageTitle = 'this page';
    const titleElement = document.getElementById('analyzed-page-title');
    if (titleElement) {
      pageTitle = titleElement.textContent.trim();
    } else {
      pageTitle = document.title.trim() || 'this page';
    }

    pageTitle = pageTitle
      .replace(/Keyword Optimizer & SEO Checker – Audit Tool | Traffic Torch/gi, '')
      .trim() || 'this page';

    const shareText = `Check out ${pageTitle} on Traffic Torch Keyword Tool: ${shareUrl}`;

    try {
      if (navigator.share) {
        // Native share – no clipboard involved unless user cancels
        await navigator.share({
          text: shareText
        });
        showMessage('Shared successfully!', 'success');
      } else if (navigator.clipboard) {
        // No share API available → fallback to clipboard (this may show prompt once)
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link & description copied!<br>Paste anywhere to share.', 'success');
      } else {
        // Very old browser – manual copy instruction
        showMessage('Copy manually:<br>' + shareText, 'info');
      }
    } catch (err) {
      // User cancelled share sheet, permission denied, or other error → silent (no prompt, no message)
      console.error('Share action failed or cancelled:', err);
      // Do NOT attempt clipboard.writeText() here to avoid permission popup on cancel
    }
  });

  function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('share-message');
    if (!messageDiv) return;

    let classNames = 'mt-6 p-5 rounded-2xl text-center font-medium max-w-xl mx-auto shadow-sm ';
    let prefix = '';

    if (type === 'success') {
      classNames += 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200';
      prefix = '✅ ';
    } else if (type === 'error') {
      classNames += 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200';
      prefix = '⚠️ ';
    } else {
      classNames += 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      prefix = 'ℹ️ ';
    }

    messageDiv.innerHTML = prefix + text;
    messageDiv.className = classNames;
    messageDiv.classList.remove('hidden');

    setTimeout(() => messageDiv.classList.add('hidden'), 9000);
  }
}