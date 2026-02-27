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
  submitBtn.textContent = 'Generating & Sending...';
  messageDiv.classList.add('hidden');

  const email = shareForm.querySelector('#share-email').value.trim();
  const title = shareForm.querySelector('#share-title').value.trim();
  const body = shareForm.querySelector('#share-body').value.trim();

  if (!email || !title || !body) {
    showMessage('Please fill all fields', 'error');
    resetButton();
    return;
  }

  let pdfBlob;
  try {
    // Hide form for clean PDF capture (avoids including input fields in PDF)
    const wasHidden = formContainer.classList.contains('hidden');
    if (!wasHidden) {
      formContainer.classList.add('hidden');
    }

    const element = document.getElementById('results');
    if (!element) throw new Error('Results container not found');

    const opt = {
      margin:       0.4,                    // Slightly tighter margins for mobile reports
      filename:     'Traffic-Torch-AI-Audit-Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: null },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }  // Better handling of breaks
    };

    pdfBlob = await html2pdf().set(opt).from(element).output('blob');

    // Restore form visibility if it was open
    if (!wasHidden) {
      formContainer.classList.remove('hidden');
    }

    const formData = new FormData();
    formData.append('recipient_email', email);          // Backend should use this as 'to'
    formData.append('name', 'Traffic Torch User');
    formData.append('email', 'no-reply@traffictorch.net'); // Sender / reply-to
    formData.append('message', `${title}\n\n${body}\n\nReport URL: ${window.location.href}\nAnalyzed page: ${document.body.getAttribute('data-url') || 'unknown'}`);
    formData.append('attachment', pdfBlob, 'AI-Audit-Report.pdf');

    const res = await fetch('/api/contact', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error ${res.status}`);
    }

    const data = await res.json();

    if (data.success) {
      showMessage(`Report shared successfully! 📧 Sent to ${email}`, 'success');
      shareForm.reset();
      formContainer.classList.add('hidden');
      shareBtn.textContent = 'Share Report 🔗';
      // Reset button classes (from your toggle logic)
      shareBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
      shareBtn.classList.add('from-orange-500', 'to-pink-600', 'hover:from-orange-600', 'hover:to-pink-700');
    } else {
      throw new Error(data.error || 'Failed');
    }
  } catch (err) {
    console.error('Share report error:', err);
    showMessage(`Failed to generate or send report: ${err.message || 'Unknown error'}. Try again.`, 'error');
    // Ensure form is visible on error
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
    // Dark mode text fallback (gray-800 / gray-200 per your guideline)
    messageDiv.classList.add('dark:text-gray-200');
  }

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});