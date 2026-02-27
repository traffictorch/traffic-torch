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
      // Trigger print dialog → user must "Save as PDF" manually first? Wait – current Save uses window.print()
      // To attach auto-PDF we need client-side PDF generation. Current code has no auto-PDF blob.
      // Temporary: alert user to save PDF first then share, or implement html2pdf later.
      // For now: reuse print flow + manual note; real fix needs blob.

      // Placeholder: assume we have PDF blob from future html2pdf or jspdf
      // For minimal: send without attachment first, backend can handle as text email

      const formData = new FormData();
      formData.append('email', email);
      formData.append('name', 'Traffic Torch User'); // or add name field
      formData.append('message', `${title}\n\n${body}\n\n--- Report for: ${document.body.getAttribute('data-url') || 'unknown'}`);

      // If we had PDF blob:
      // formData.append('attachment', pdfBlob, 'report.pdf');

      const res = await fetch('/api/contact', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        showMessage('Report shared successfully! 📧', 'success');
        shareForm.reset();
        formContainer.classList.add('hidden');
        shareBtn.textContent = 'Share Report 🔗';
        // reset classes...
      } else {
        throw new Error();
      }
    } catch (err) {
      showMessage('Failed to send. Try again.', 'error');
    }

    function showMessage(text, type) {
      messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
      messageDiv.classList.remove('hidden', 'text-green-400', 'bg-green-900/20', 'text-red-400', 'bg-red-900/20');
      messageDiv.classList.add(type === 'success' ? 'text-green-400' : 'text-red-400', type === 'success' ? 'bg-green-900/20' : 'bg-red-900/20');
    }

    function resetButton() {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }

    resetButton();
  });
}