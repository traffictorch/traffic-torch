export function initShareReport() {
  const resultsContainer = document.getElementById('results');
  if (!resultsContainer) return;

  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const inputUrl = document.getElementById('url-input')?.value.trim();
    if (!inputUrl) return; // silent fail – button shouldn't be visible anyway

    // Build clean deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?url=${encodeURIComponent(inputUrl)}`;

// Get the tested page title
let pageTitle = 'this page';

// Primary: Target the score card title paragraph (simple & reliable)
const scoreCardTitle = document.querySelector('#results .mt-6.text-xl.md\\:text-2xl.font-semibold.text-center');
// or even better if you add class: document.querySelector('.score-card-title');

if (scoreCardTitle) {
  pageTitle = scoreCardTitle.textContent.trim();
}

// Fallback 1: Same selector inside #results
if (pageTitle === 'this page') {
  pageTitle = document.querySelector('#results .mt-6.text-xl.md\\:text-2xl.font-semibold.text-center')?.textContent.trim() || 'this page';
}

// Fallback 2: Clean document.title
if (pageTitle === 'this page' || pageTitle.includes('Traffic Torch')) {
  pageTitle = document.title
    .replace(/Topical Authority Audit Tool.*Traffic Torch/gi, '')
    .trim() || 'this page';
}

// Final cleanup
pageTitle = pageTitle
  .replace(/Topical Authority Audit Tool \| Traffic Torch/gi, '')
  .replace(/Traffic Torch/gi, '')
  .replace(/[\|\-–_]+/g, '')
  .trim() || 'this page';

const shareText = `Check out ${pageTitle} on Traffic Torch Topical Authority Audit Tool ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText
        });
        showMessage('Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(shareText);
        showMessage('Report link copied!<br>Paste anywhere to share.', 'success');
      }
    } catch (err) {
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