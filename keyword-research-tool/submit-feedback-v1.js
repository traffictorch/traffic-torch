export function initSubmitFeedback() {
  // Get all elements directly from document (no resultsContainer needed)
  const feedbackBtn = document.getElementById('feedback-btn');
  const formContainer = document.getElementById('feedback-form-container');
  const feedbackForm = document.getElementById('feedback-form');
  const messageDiv = document.getElementById('feedback-message');
  const ratingButtons = document.querySelectorAll('[data-rating]');
  const replyCheckbox = document.getElementById('reply-requested');
  const emailGroup = document.getElementById('email-group');
  const charCount = document.getElementById('char-count');
  const textarea = document.getElementById('feedback-text');

  // Early exit if core elements missing (prevents TypeError)
  if (!feedbackBtn || !formContainer || !feedbackForm) {
    console.warn('Feedback form elements not found – skipping initSubmitFeedback');
    return;
  }

  // Toggle feedback form visibility
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

  // Rating buttons with persistent selection
  ratingButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Reset all
      ratingButtons.forEach(b => {
        b.classList.remove(
          'scale-150', 'ring-4', 'ring-blue-500', 'ring-opacity-80',
          'bg-blue-100', 'dark:bg-blue-900/30', 'selected-rating'
        );
        b.classList.add('hover:scale-125', 'transition-all', 'duration-200');
      });

      // Select this one
      btn.classList.remove('hover:scale-125');
      btn.classList.add(
        'scale-150', 'ring-4', 'ring-blue-500', 'ring-opacity-80',
        'bg-blue-100', 'dark:bg-blue-900/30', 'selected-rating'
      );

      document.getElementById('feedback-rating').value = btn.dataset.rating;
    });
  });

  // Show/hide email field
  if (replyCheckbox && emailGroup) {
    replyCheckbox.addEventListener('change', () => {
      emailGroup.classList.toggle('hidden', !replyCheckbox.checked);
    });
  }

  // Character counter
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
    });
  }

  // Form submit
  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = feedbackForm.querySelector('button');
    if (!submitBtn) return;

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    messageDiv.classList.add('hidden');

    const rating = document.getElementById('feedback-rating')?.value || '';
    const replyRequested = replyCheckbox?.checked || false;
    const email = replyRequested ? document.getElementById('feedback-email')?.value.trim() : '';
    const feedbackText = textarea?.value.trim() || '';

    if (!feedbackText) {
      showMessage('Please enter your feedback', 'error');
      resetButton();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', 'Anonymous'); // or pull from input if added later
      formData.append('email', email || 'no-reply@traffictorch.net');
      formData.append('message', `Feedback for Keyword Research Tool\nRating: ${rating || 'None'}\n\n${feedbackText}`);

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
        showMessage('Thank you! Feedback sent. We\'ll review it soon.', 'success');
        feedbackForm.reset();
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

    function resetButton() {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  function showMessage(text, type) {
    if (!messageDiv) return;
    messageDiv.innerHTML = type === 'success' ? `✅ ${text}` : `❌ ${text}`;
    messageDiv.classList.remove('hidden', 'text-green-400', 'bg-green-900/20', 'text-red-400', 'bg-red-900/20');
    messageDiv.classList.add(
      type === 'success' ? 'text-green-400' : 'text-red-400',
      type === 'success' ? 'bg-green-900/20' : 'bg-red-900/20'
    );
    messageDiv.classList.add('dark:text-gray-200');
  }
}