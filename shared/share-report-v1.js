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
      // Collect key report data from DOM (simple text summary)
      const overallScore = document.querySelector('.text-5xl.font-black.drop-shadow-lg')?.textContent.trim() || 'N/A';
      const verdict = document.querySelector('.text-4xl.sm\\:text-5xl.font-bold.text-center.mt-4.sm\\:mt-6.drop-shadow-lg')?.textContent.trim() || 'N/A';
      const urlAnalyzed = document.body.getAttribute('data-url') || 'unknown';

      const reportSummary = `
${title}

${body}

Overall AI Audit Score: ${overallScore}
Verdict: ${verdict}
Analyzed Page: ${urlAnalyzed}
Full report link: ${window.location.href}

Thank you for using Traffic Torch!
`;

      const formData = new FormData();
      formData.append('recipient_email', email);
      formData.append('name', 'Traffic Torch User');
      formData.append('email', 'no-reply@traffictorch.net');
      formData.append('message', reportSummary);

      const res = await fetch('/api/contact', {  // keep existing endpoint
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