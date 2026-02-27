// shared/share-report-v1.js
export function initShareReport(resultsContainer) {
  const shareBtn = resultsContainer.querySelector('#share-report-btn');
  const formContainer = resultsContainer.querySelector('#share-form-container');
  const shareForm = resultsContainer.querySelector('#share-form');
  const messageDiv = resultsContainer.querySelector('#share-message');

  if (!shareBtn || !formContainer) return;

  shareBtn.addEventListener('click', () => {
    const isHidden = formContainer.classList.contains('hidden');
    formContainer.classList.toggle('hidden');
    shareBtn.textContent = isHidden ? 'Cancel Share ✕' : 'Share Report 🔗';
    shareBtn.classList.toggle('bg-gray-500', isHidden);
    shareBtn.classList.toggle('hover:bg-gray-600', isHidden);
    shareBtn.classList.toggle('from-orange-500', !isHidden);
    shareBtn.classList.toggle('to-pink-600', !isHidden);
    shareBtn.classList.toggle('hover:from-orange-600', !isHidden);
    shareBtn.classList.toggle('hover:to-pink-700', !isHidden);
  });

  shareForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = shareForm.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    messageDiv.classList.add('hidden');

    const email = shareForm.querySelector('#share-email').value.trim();
    const title = shareForm.querySelector('#share-title').value.trim();
    const body = shareForm.querySelector('#share-body').value.trim();

    if (!email || !title || !body) {
      showMessage('Please fill all fields', 'error');
      resetButton();
      return;
    }

    try {
      const analyzedUrl = document.body.getAttribute('data-url') || 'unknown';

      const overallScoreEl = document.querySelector('.text-5xl.sm\\:text-6xl.font-black.drop-shadow-lg, .text-5xl.font-black.drop-shadow-lg');
      const overallScore = overallScoreEl ? overallScoreEl.textContent.trim() : 'N/A';

      const verdictEl = document.querySelector('.text-4xl.sm\\:text-5xl.font-bold.text-center.mt-4.sm\\:mt-6.drop-shadow-lg, .text-4xl.font-bold.text-center.mt-4.drop-shadow-lg');
      const verdict = verdictEl ? verdictEl.textContent.trim() : 'N/A';

      // More precise selector for all module cards (both full-width Perplexity and grid others)
      const moduleCards = document.querySelectorAll(
        'div.bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-md.p-6.md\\:p-8.text-center.border-l-4, ' +
        'div.max-w-2xl.mx-auto > div.bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-md.p-6.md\\:p-8.text-center.border-l-4'
      );

      let moduleSummary = '';

      moduleCards.forEach((card, index) => {
        // Module name
        const nameEl = card.querySelector('p.mt-6.text-2xl.font-bold, p.mt-4.text-xl.font-bold, p.text-xl.font-bold');
        const name = nameEl ? nameEl.textContent.trim() : `Module ${index + 1}`;

        // Score
        const scoreEl = card.querySelector('.text-5xl.font-bold, .text-3xl.font-bold');
        const scoreText = scoreEl ? scoreEl.textContent.trim() : 'N/A';

        // Pass/fail
        const scoreNum = parseInt(scoreText.split('/')[0]) || 0;
        const emoji = scoreNum === 20 ? '✅' : scoreNum >= 10 ? '⚠️' : '❌';

        moduleSummary += `${name}: ${scoreText} ${emoji}\n`;

        // Fix suggestions if failed
        if (scoreNum < 20) {
          // Look for the fixes section (hidden by default, but we can access it)
          const fixesButtons = card.querySelectorAll('button');
          let fixesSection = null;

          // Find the "Show Fixes" button and its next sibling (the fixes div)
          for (const btn of fixesButtons) {
            if (btn.textContent.includes('Show Fixes')) {
              fixesSection = btn.nextElementSibling;
              break;
            }
          }

          if (fixesSection && !fixesSection.classList.contains('hidden')) {
            // Already open → grab fixes
            const fixParagraphs = fixesSection.querySelectorAll('p.text-gray-700.dark\\:text-gray-300');
            if (fixParagraphs.length > 0) {
              moduleSummary += 'Fix suggestions:\n';
              fixParagraphs.forEach(p => {
                const fixText = p.textContent.trim();
                if (fixText && fixText.length > 20) {
                  moduleSummary += `- ${fixText}\n`;
                }
              });
              moduleSummary += '\n';
            }
          } else {
            // If hidden, try priority fixes block as fallback
            const priorityFixes = document.querySelectorAll('.bg-orange-50.dark\\:bg-orange-900\\/20.rounded-3xl.p-8.md\\:p-10.shadow-lg.border-l-8.border-orange-500 p.font-bold.mb-2');
            if (priorityFixes.length > 0) {
              moduleSummary += 'Priority fixes:\n';
              priorityFixes.forEach(el => {
                moduleSummary += `- ${el.textContent.trim()}\n`;
              });
              moduleSummary += '\n';
            }
          }
        }
      });

      const reportSummary = `
${title}

${body}

Analyzed Page: ${analyzedUrl}

Overall AI Audit Score: ${overallScore}
Verdict: ${verdict}

Module Scores:
${moduleSummary || '(No detailed module data found)'}

Full interactive report: ${window.location.href}

Thank you for using Traffic Torch!
`;

      const formData = new FormData();
      formData.append('recipient_email', email);
      formData.append('name', 'Traffic Torch User');
      formData.append('email', 'no-reply@traffictorch.net');
      formData.append('message', reportSummary);

      const res = await fetch('/api/contact', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        showMessage(`Report shared successfully! 📧 Sent to ${email}`, 'success');
        shareForm.reset();
        formContainer.classList.add('hidden');
        shareBtn.textContent = 'Share Report 🔗';
        shareBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        shareBtn.classList.add('from-orange-500', 'to-pink-600', 'hover:from-orange-600', 'hover:to-pink-700');
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      console.error('Share report error:', err);
      showMessage(`Failed to send report: ${err.message}. Try again.`, 'error');
      formContainer.classList.remove('hidden');
    } finally {
      resetButton();
    }

    function showMessage(text, type) {
      messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
      messageDiv.classList.remove('hidden', 'text-green-400', 'bg-green-900/20', 'text-red-400', 'bg-red-900/20');
      messageDiv.classList.add(
        type === 'success' ? 'text-green-400' : 'text-red-400',
        type === 'success' ? 'bg-green-900/20' : 'bg-red-900/20'
      );
      messageDiv.classList.add('dark:text-gray-200');
    }

    function resetButton() {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}