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
      // Extract analyzed URL
      const analyzedUrl = document.body.getAttribute('data-url') || 'unknown';

      // Overall score & verdict
      const overallScoreEl = document.querySelector('.text-5xl.sm\\:text-6xl.font-black.drop-shadow-lg');
      const overallScore = overallScoreEl ? overallScoreEl.textContent.trim() : 'N/A';

      const verdictEl = document.querySelector('.text-4xl.sm\\:text-5xl.font-bold.text-center.mt-4.sm\\:mt-6.drop-shadow-lg');
      const verdict = verdictEl ? verdictEl.textContent.trim() : 'N/A';

      // Build module summary
      let moduleSummary = '';
      const moduleCards = document.querySelectorAll('.bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-md.p-6.md\\:p-8.text-center.border-l-4');

      moduleCards.forEach(card => {
        const nameEl = card.querySelector('p.mt-6.text-2xl.font-bold, p.mt-4.text-xl.font-bold');
        const scoreEl = card.querySelector('.text-5xl.font-bold, .text-3xl.font-bold');
        const name = nameEl ? nameEl.textContent.trim() : 'Unknown';
        const scoreText = scoreEl ? scoreEl.textContent.trim() : 'N/A';

        // Determine pass/fail emoji
        const scoreNum = parseInt(scoreText.split('/')[0]) || 0;
        const emoji = scoreNum === 20 ? '✅' : '❌';

        moduleSummary += `${name}: ${scoreText} ${emoji}\n`;

        // If failed, try to grab fix text
        if (scoreNum < 20) {
          const fixesSection = card.querySelector('.hidden.mt-6.space-y-8, .hidden.mt-4.space-y-8');
          if (fixesSection) {
            const fixItems = fixesSection.querySelectorAll('p.text-gray-700.dark\\:text-gray-300.max-w-lg.mx-auto, p.text-gray-700.dark\\:text-gray-300.max-w-md.mx-auto');
            if (fixItems.length > 0) {
              moduleSummary += 'Fix suggestions:\n';
              fixItems.forEach(item => {
                const fixText = item.textContent.trim();
                if (fixText && fixText.length > 10) {
                  moduleSummary += `- ${fixText}\n`;
                }
              });
              moduleSummary += '\n';
            }
          }
        }
      });

      // Full report summary text
      const reportSummary = `
${title}

${body}

Analyzed Page: ${analyzedUrl}

Overall AI Audit Score: ${overallScore}
Verdict: ${verdict}

Module Scores:
${moduleSummary}

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