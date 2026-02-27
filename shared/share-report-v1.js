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
      const wasHidden = formContainer.classList.contains('hidden');
      if (!wasHidden) formContainer.classList.add('hidden');

      const originalTheme = document.documentElement.classList.contains('dark');
      if (originalTheme) document.documentElement.classList.remove('dark');

      const element = document.getElementById('results');
      if (!element) throw new Error('Results container not found');

      const maxPageHeight = 11000; // safe under 14400
      const scale = 1.0; // further reduced for size

      let targetWidth = element.offsetWidth * scale;
      let targetHeight = element.offsetHeight * scale;

      const aspect = targetWidth / targetHeight;
      if (targetHeight > maxPageHeight) {
        targetHeight = maxPageHeight;
        targetWidth = maxPageHeight * aspect;
      }
      if (targetWidth > maxPageHeight) {
        targetWidth = maxPageHeight;
        targetHeight = maxPageHeight / aspect;
      }

      console.log('Generating PDF at:', targetWidth, 'x', targetHeight);

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.75, // aggressive compression
        backgroundColor: '#ffffff',
        pixelRatio: scale,
        canvasWidth: targetWidth,
        canvasHeight: targetHeight,
        fontEmbedCSS: true,
        includeQueryParams: true,
        imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
      });

      if (originalTheme) document.documentElement.classList.add('dark');
      if (!wasHidden) formContainer.classList.remove('hidden');

      const imgProps = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
      });

      console.log('Final image size:', imgProps.width, 'x', imgProps.height);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4', // standard letter size fallback
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;

      pdf.addImage(dataUrl, 'PNG', (pageWidth - imgWidth) / 2, 0, imgWidth, imgHeight, undefined, 'FAST');

      pdfBlob = pdf.output('blob');

      console.log('PDF blob size:', pdfBlob.size / 1024 / 1024, 'MB');

      const formData = new FormData();
      formData.append('recipient_email', email);
      formData.append('name', 'Traffic Torch User');
      formData.append('email', 'no-reply@traffictorch.net');
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
        shareBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        shareBtn.classList.add('from-orange-500', 'to-pink-600', 'hover:from-orange-600', 'hover:to-pink-700');
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      console.error('Share report error:', err);
      showMessage(`Failed to generate or send report: ${err.message || 'Unknown error'}. Try again.`, 'error');
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