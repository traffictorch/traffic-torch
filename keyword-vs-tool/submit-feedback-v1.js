// keyword-vs-tool/submit-feedback-v1.js
export function initSubmitFeedback(resultsContainer) {
  const feedbackBtn = resultsContainer.querySelector('#feedback-btn');
  const formContainer = resultsContainer.querySelector('#feedback-form-container');
  const feedbackForm = resultsContainer.querySelector('#feedback-form');
  const messageDiv = resultsContainer.querySelector('#feedback-message');
  const ratingButtons = resultsContainer.querySelectorAll('[data-rating]');
  const replyCheckbox = resultsContainer.querySelector('#reply-requested');
  const emailGroup = resultsContainer.querySelector('#email-group');
  const charCount = resultsContainer.querySelector('#char-count');
  const textarea = resultsContainer.querySelector('#feedback-text');

  if (!feedbackBtn || !formContainer) return;

  feedbackBtn.addEventListener('click', () => {
    const isHidden = formContainer.classList.contains('hidden');
    formContainer.classList.toggle('hidden');
    feedbackBtn.textContent = isHidden ? 'Cancel Feedback ✕' : 'Submit Feedback 💬';
    feedbackBtn.classList.toggle('bg-gray-500', isHidden);
    feedbackBtn.classList.toggle('hover:bg-gray-600', isHidden);
    feedbackBtn.classList.toggle('from-blue-500', !isHidden);
    feedbackBtn.classList.toggle('to-indigo-600', !isHidden);
    feedbackBtn.classList.toggle('hover:from-blue-600', !isHidden);
    feedbackBtn.classList.toggle('hover:to-indigo-700', !isHidden);
  });

  // Rating buttons - persistent selection feedback (ring stays after click)
  ratingButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Reset all to default (no ring, no bg, hover enabled)
      ratingButtons.forEach(b => {
        b.classList.remove(
          'scale-150',
          'ring-4',
          'ring-blue-500',
          'ring-opacity-80',
          'bg-blue-100',
          'dark:bg-blue-900/30',
          'selected-rating'  // custom class for persistence
        );
        b.classList.add('hover:scale-125', 'transition-all', 'duration-200');
      });

      // Apply persistent selected state to clicked emoji
      btn.classList.remove('hover:scale-125');
      btn.classList.add(
        'scale-150',
        'ring-4',
        'ring-blue-500',
        'ring-opacity-80',
        'bg-blue-100',
        'dark:bg-blue-900/30',
        'selected-rating'
      );

      // Store the rating value
      document.getElementById('feedback-rating').value = btn.dataset.rating;
    });
  });

  // Show/hide email field
  replyCheckbox.addEventListener('change', () => {
    emailGroup.classList.toggle('hidden', !replyCheckbox.checked);
  });

  // Character counter
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
    });
  }

  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = feedbackForm.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    messageDiv.classList.add('hidden');

    const rating = document.getElementById('feedback-rating').value;
    const replyRequested = replyCheckbox.checked;
    const email = replyRequested ? document.getElementById('feedback-email').value.trim() : '';
    const feedbackText = textarea.value.trim();

    if (!feedbackText) {
      showMessage('Please enter your feedback', 'error');
      resetButton();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name || 'Anonymous');
      formData.append('email', email || 'no-reply@traffictorch.net');
      formData.append('message', `Feedback for Keyword VS Tool on ${document.body.getAttribute('data-url') || 'unknown'}\nRating: ${rating || 'None'}\n\n${feedbackText}`);

      const res = await fetch('/api/contact', {  // or /api/share-report if preferred
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }

      const data = await res.json();

      if (data.success) {
        showMessage('Thank you! Feedback sent. We\'ll review it soon.', 'success');
        feedbackForm.reset();
        // Keep form open
        submitBtn.textContent = 'Send More Feedback →';
        setTimeout(() => {
          submitBtn.textContent = 'Send Feedback';
        }, 10000);
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      console.error('Feedback error:', err);
      showMessage(`Failed to send feedback: ${err.message}. Try again.`, 'error');
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