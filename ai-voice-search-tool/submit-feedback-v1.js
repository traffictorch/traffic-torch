// ai-voice-search-tool/submit-feedback-v1.js – safer version with null checks & MutationObserver fallback

export function initSubmitFeedback(resultsContainer) {
  // Early exit if container missing
  if (!resultsContainer) {
    console.warn('initSubmitFeedback: resultsContainer not provided');
    return;
  }

  const feedbackBtn = resultsContainer.querySelector('#feedback-btn');
  const formContainer = resultsContainer.querySelector('#feedback-form-container');
  const feedbackForm = resultsContainer.querySelector('#feedback-form');
  const messageDiv = resultsContainer.querySelector('#feedback-message');
  const ratingButtons = resultsContainer.querySelectorAll('[data-rating]');
  const replyCheckbox = resultsContainer.querySelector('#reply-requested');
  const emailGroup = resultsContainer.querySelector('#email-group');
  const charCount = resultsContainer.querySelector('#char-count');
  const textarea = resultsContainer.querySelector('#feedback-text');

  // If core elements missing, log and exit gracefully
  if (!feedbackBtn || !formContainer) {
    console.warn('Feedback button or form container not found in resultsContainer');
    return;
  }

  // Button toggle
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

  // Rating buttons – safe loop
  if (ratingButtons.length > 0) {
    ratingButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        ratingButtons.forEach(b => {
          b.classList.remove(
            'scale-150', 'ring-4', 'ring-blue-500', 'ring-opacity-80',
            'bg-blue-100', 'dark:bg-blue-900/30', 'selected-rating'
          );
          b.classList.add('hover:scale-125', 'transition-all', 'duration-200');
        });
        btn.classList.remove('hover:scale-125');
        btn.classList.add(
          'scale-150', 'ring-4', 'ring-blue-500', 'ring-opacity-80',
          'bg-blue-100', 'dark:bg-blue-900/30', 'selected-rating'
        );
        const ratingInput = document.getElementById('feedback-rating');
        if (ratingInput) ratingInput.value = btn.dataset.rating;
      });
    });
  }

  // Email toggle – safe check
  if (replyCheckbox && emailGroup) {
    replyCheckbox.addEventListener('change', () => {
      emailGroup.classList.toggle('hidden', !replyCheckbox.checked);
    });
  } else {
    console.warn('reply-requested checkbox or email-group not found – skipping email toggle');
  }

  // Char counter – safe check
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
    });
  }

  // Form submit – only attach if form exists
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = feedbackForm.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      if (messageDiv) messageDiv.classList.add('hidden');

      const rating = document.getElementById('feedback-rating')?.value || 'None';
      const replyRequested = replyCheckbox ? replyCheckbox.checked : false;
      const email = replyRequested ? document.getElementById('feedback-email')?.value.trim() : '';
      const feedbackText = textarea ? textarea.value.trim() : '';

      if (!feedbackText) {
        if (messageDiv) showMessage('Please enter your feedback', 'error');
        resetButton(submitBtn, originalText);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('name', 'Anonymous');
        formData.append('email', email || 'no-reply@traffictorch.net');
        formData.append('message', `Feedback for AI Voice Search Tool on ${document.body.getAttribute('data-url') || 'unknown'}\nRating: ${rating}\n\n${feedbackText}`);

        const res = await fetch('/api/contact', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server error ${res.status}: ${errText}`);
        }

        const data = await res.json();
        if (data.success) {
          if (messageDiv) showMessage('Thank you! Feedback sent. We\'ll review it soon.', 'success');
          if (feedbackForm) feedbackForm.reset();
          submitBtn.textContent = 'Send More Feedback →';
          setTimeout(() => {
            submitBtn.textContent = 'Send Feedback';
          }, 10000);
        } else {
          throw new Error(data.error || 'Failed');
        }
      } catch (err) {
        console.error('Feedback error:', err);
        if (messageDiv) showMessage(`Failed to send feedback: ${err.message}. Try again.`, 'error');
      } finally {
        resetButton(submitBtn, originalText);
      }
    });
  } else {
    console.warn('feedback-form not found – submit listener not attached');
  }

  // Helper functions (unchanged)
  function showMessage(text, type) {
    if (!messageDiv) return;
    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.classList.remove('hidden', 'text-green-400', 'bg-green-900/20', 'text-red-400', 'bg-red-900/20');
    messageDiv.classList.add(
      type === 'success' ? 'text-green-400' : 'text-red-400',
      type === 'success' ? 'bg-green-900/20' : 'bg-red-900/20',
      'dark:text-gray-200'
    );
  }

  function resetButton(btn, originalText) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}