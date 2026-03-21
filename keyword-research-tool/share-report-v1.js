export function initShareReport() {
  const shareBtn = document.getElementById('share-report-btn');
  if (!shareBtn) {
    console.warn("Share button #share-report-btn not found");
    return;
  }

  shareBtn.addEventListener('click', async () => {
    const keywordInput = document.getElementById('seed');
    const urlInput = document.getElementById('url');

    const keyword = keywordInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';

    if (!keyword && !url) {
      showMessage('Please enter a keyword or URL to share a report', 'error');
      return;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    let shareParams = '';
    if (keyword) shareParams += `&keyword=${encodeURIComponent(keyword)}`;
    if (url) shareParams += `&url=${encodeURIComponent(url)}`;
    const shareUrl = `${baseUrl}?${shareParams.slice(1)}`; // remove leading &

    // Try to get the title of the analyzed/tested page first
    let pageTitle = 'Keyword Research Report';
    
    // Option 1: Look for a dedicated element that shows the page title after analysis
    const analyzedTitleEl = document.getElementById('analyzed-page-title');
    if (analyzedTitleEl && analyzedTitleEl.textContent.trim()) {
      pageTitle = analyzedTitleEl.textContent.trim();
    }
    // Option 2: Fallback to document.title (cleaned)
    else if (document.title && document.title !== 'Keyword Research Tool | Traffic Torch') {
      pageTitle = document.title
        .replace(/ \| Traffic Torch$/, '')
        .replace(/Keyword Research Tool – /, '')
        .trim() || 'this page';
    }
    // Option 3: Build from inputs if no title found
    else {
      if (keyword) pageTitle = `Keyword Research: ${keyword}`;
      if (url) pageTitle += ` for ${url}`;
      pageTitle = pageTitle.trim() || 'Keyword Research';
    }

    // Build natural share text centered on the tested page title
    let shareText = `Check out this AI keyword research report from Traffic Torch`;
    if (pageTitle !== 'Keyword Research Report') {
      shareText += ` for ${pageTitle}`;
    } else if (keyword) {
      shareText += ` on "${keyword}"`;
    }
    if (url && !pageTitle.includes(url)) {
      shareText += ` (${url})`;
    }
    shareText += `: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: pageTitle,
          text: shareText,
          url: shareUrl
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
      // Silent on cancel/close/error
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