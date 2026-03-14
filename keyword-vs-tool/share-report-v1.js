export function initShareReport(resultsContainer) {
  const shareBtn = document.getElementById('share-report-btn');
  if (!shareBtn) {
    console.warn("Share button #share-report-btn not found");
    return;
  }

  shareBtn.addEventListener('click', async () => {
    const yourUrl = document.getElementById('your-url')?.value.trim();
    const compUrl = document.getElementById('competitor-url')?.value.trim();
    const keyword = document.getElementById('target-phrase')?.value.trim();

    if (!yourUrl || !compUrl || !keyword) {
      showMessage('Missing one or more fields to share', 'error');
      return;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?your-url=${encodeURIComponent(yourUrl)}&comp-url=${encodeURIComponent(compUrl)}&keyword=${encodeURIComponent(keyword)}`;

    let pageTitle = 'this comparison';
    const titleElement = document.getElementById('analyzed-page-title');
    if (titleElement) {
      pageTitle = titleElement.textContent.trim();
    } else {
      pageTitle = document.title.trim() || 'this comparison';
    }

    pageTitle = pageTitle
      .replace(/Keyword Gap Analysis – SEO Audit Tool | Traffic Torch/gi, '')
      .trim() || 'this comparison';

    const shareText = `Check out ${pageTitle} on Traffic Torch Keyword VS Tool: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText
        });
        showMessage('Shared successfully!', 'success');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link & description copied!<br>Paste anywhere to share.', 'success');
      } else {
        showMessage('Copy manually:<br>' + shareText, 'info');
      }
    } catch (err) {
      console.error('Share action failed or cancelled:', err);
      // Silent on cancel/close
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