export function initShareReport() {
  const shareBtn = document.getElementById('share-report-btn');
  if (!shareBtn) {
    return;
  }

  shareBtn.addEventListener('click', async () => {
    const keywordInput = document.getElementById('seed');
    const urlInput = document.getElementById('url');
    const codeInput = document.getElementById('code-input');

    const keyword = keywordInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';
    const hasCode = codeInput && codeInput.value.trim() !== '';

    // Detect if user is in HTML Code mode (has content in code input)
    if (hasCode) {
      showMessage('⚠️ Share Report only works for URL audits.<br>For HTML code audit use "Save Report" button.', 'error');
      return;
    }

    if (!keyword && !url) {
      showMessage('Please enter a keyword or URL to share a report', 'error');
      return;
    }

    const baseUrl = window.location.origin + window.location.pathname;

    // Clean keyword for URL
    const encodedKeyword = encodeURIComponent(keyword);

    // Clean URL param + readable domain
    let encodedUrl = '';
    let displayDomain = '';
    if (url) {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        encodedUrl = encodeURIComponent(urlObj.href);
        displayDomain = urlObj.hostname.replace(/^www\./i, '');
      } catch {
        encodedUrl = encodeURIComponent(url);
        displayDomain = url;
      }
    }

    // Build short share URL with params (only keyword + url, never code)
    let shareParams = '';
    if (keyword) shareParams += `keyword=${encodedKeyword}`;
    if (url) shareParams += (shareParams ? '&' : '') + `url=${encodedUrl}`;

    const shareUrl = `${baseUrl}${shareParams ? '?' + shareParams : ''}`;

    // Short, clean share text
    let shareText = 'Check out Smarter Keyword Research';
    if (keyword) shareText += `: ${keyword}`;
    if (displayDomain) shareText += ` for ${displayDomain}`;
    shareText += `: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Smarter Keyword Research Report',
          text: shareText,
          url: shareUrl
        });
        showMessage('Shared successfully!', 'success');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showMessage('Short report link copied!<br>Paste anywhere to share.', 'success');
      } else {
        showMessage('Copy manually:<br>' + shareText, 'info');
      }
    } catch (err) {
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
      prefix = '';
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