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
      // Hide share form for clean capture
      const wasHidden = formContainer.classList.contains('hidden');
      if (!wasHidden) formContainer.classList.add('hidden');

      // Temporarily switch to light mode for consistent PDF colors
      const originalTheme = document.documentElement.classList.contains('dark');
      if (originalTheme) document.documentElement.classList.remove('dark');

      const element = document.getElementById('results');
      if (!element) throw new Error('Results container not found');

      // Lower resolution to avoid jsPDF 14400 limit and reduce blob size
      const scale = 1.5; // was 3 → much smaller file
      const maxDimension = 12000; // safety margin under 14400

      let canvasWidth = element.offsetWidth * scale;
      let canvasHeight = element.offsetHeight * scale;

      // Clamp dimensions if too large
      const aspectRatio = canvasWidth / canvasHeight;
      if (canvasWidth > maxDimension) {
        canvasWidth = maxDimension;
        canvasHeight = maxDimension / aspectRatio;
      }
      if (canvasHeight > maxDimension) {
        canvasHeight = maxDimension;
        canvasWidth = maxDimension * aspectRatio;
      }

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.92, // slight compression
        backgroundColor: '#ffffff',
        pixelRatio: scale,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        fontEmbedCSS: true,
        includeQueryParams: true,
        imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
      });

      // Restore theme and form
      if (originalTheme) document.documentElement.classList.add('dark');
      if (!wasHidden) formContainer.classList.remove('hidden');

      // Create PDF with clamped dimensions
      const imgProps = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: imgProps.width > imgProps.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgProps.width, imgProps.height],
        compress: true // enable compression
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
      pdfBlob = pdf.output('blob');

      // Send
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