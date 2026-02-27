// ai-audit-tool/share-report-v1.js
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

    const name = shareForm.querySelector('#share-name').value.trim();
    const senderEmail = shareForm.querySelector('#share-sender-email').value.trim();
    const recipientEmail = shareForm.querySelector('#share-email').value.trim();
    const title = shareForm.querySelector('#share-title').value.trim();
    const body = shareForm.querySelector('#share-body').value.trim();

    if (!name || !senderEmail || !recipientEmail || !title || !body) {
      showMessage('Please fill all fields', 'error');
      resetButton();
      return;
    }

    try {
      const analyzedUrl = document.body.getAttribute('data-url') || 'unknown';

      const overallScoreEl = document.querySelector('.text-5xl.sm\\:text-6xl.font-black.drop-shadow-lg');
      const overallScore = overallScoreEl ? overallScoreEl.textContent.trim() : 'N/A';

      const verdictEl = document.querySelector('.text-4xl.sm\\:text-5xl.font-bold.text-center.mt-4.sm\\:mt-6.drop-shadow-lg');
      const verdict = verdictEl ? verdictEl.textContent.trim() : 'N/A';

      const moduleCards = document.querySelectorAll(
        '.max-w-2xl.mx-auto .bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-md.p-6.md\\:p-8.text-center.border-l-4, ' +
        '.grid.grid-cols-1.md\\:grid-cols-2 .bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-md.p-6.text-center.border-l-4'
      );

      let moduleSummary = '';

      moduleCards.forEach(card => {
        const nameEl = card.querySelector('p.mt-6.text-2xl.font-bold, p.mt-4.text-xl.font-bold');
        const name = nameEl ? nameEl.textContent.trim() : 'Unknown';

        const gradeEl = card.querySelector('p.mt-2.text-xl.flex.items-center.justify-center.gap-2');
        const gradeText = gradeEl ? gradeEl.textContent.trim().replace(/\s+/g, ' ') : '';

        const scoreEl = card.querySelector('div.text-5xl.font-bold, div.text-3xl.font-bold');
        const scoreText = scoreEl ? scoreEl.textContent.trim() : 'N/A';
        const scoreNum = parseInt(scoreText.split('/')[0]) || 0;

        moduleSummary += `${name} ${scoreText} ${gradeText}\n`;

        // Sub-metrics - combined selector for both card types
        const subLines = card.querySelectorAll('.space-y-3.text-base p.font-medium, .space-y-2.text-sm p.font-medium');
        subLines.forEach(line => {
          let lineText = line.textContent.trim();
          const emojiSpan = line.querySelector('span');
          const emoji = emojiSpan ? emojiSpan.textContent.trim() : '';
          if (emoji === '✅' || emoji === '❌' || emoji === '⚠️') {
            lineText = lineText.replace(emoji, '').trim();
            lineText = `${emoji} ${lineText}`;
          }
          moduleSummary += `  ${lineText}\n`;
        });

        // Fixes
        if (scoreNum < 20) {
          const fixesDiv = card.querySelector('div.hidden.mt-4.space-y-8, div.hidden.mt-6.space-y-8');
          if (fixesDiv) {
            const fixItems = fixesDiv.querySelectorAll('div.text-center p.text-gray-700.dark\\:text-gray-300');
            if (fixItems.length > 0) {
              moduleSummary += 'Fix suggestions:\n';
              fixItems.forEach(item => {
                const fix = item.textContent.trim();
                if (fix.length > 30) {
                  moduleSummary += `- ${fix}\n`;
                }
              });
              moduleSummary += '\n';
            }
          }
        }

        moduleSummary += '\n';
      });

      const reportSummary = `
${title || 'Traffic Torch Report Shared'}

${body || ''}

Sent by: ${name} (${senderEmail})

Analyzed Page: ${analyzedUrl}

Overall AI Audit Score: ${overallScore}
Verdict: ${verdict}

Module Scores:
${moduleSummary.trim() || '(No module details extracted)'}

Full interactive report: ${window.location.href}

Thank you for using Traffic Torch!
`;

      const formData = new FormData();
      formData.append('recipient_email', recipientEmail);
      formData.append('name', name);
      formData.append('email', senderEmail);
      formData.append('message', reportSummary);

      const res = await fetch('/api/share-report', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }

      const data = await res.json();

      if (data.success) {
        showMessage(`Report shared successfully! 📧 Sent to ${recipientEmail}.<br>Send to someone else?`, 'success');
        shareForm.reset();
        // Keep form open
        shareBtn.textContent = 'Send Another Report →';
        shareBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        shareBtn.classList.add('from-orange-500', 'to-pink-600', 'hover:from-orange-600', 'hover:to-pink-700');

        // Revert button after 10 seconds
        setTimeout(() => {
          shareBtn.textContent = 'Share Report 🔗';
        }, 10000);
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