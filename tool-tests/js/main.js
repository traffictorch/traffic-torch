// tool-tests/js/main.js – FIXED LOADING & ERRORS (Dec 2025)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analysis-form');
  const toggleBtn = document.getElementById('toggle-mode');
  const body = document.body;

  // Day/Night toggle
  if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark');
  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark');
    localStorage.setItem('darkMode', body.classList.contains('dark'));
    toggleBtn.textContent = body.classList.contains('dark') ? 'Day Mode' : 'Night Mode';
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return alert('Enter a URL');

    // Sequential loading: GT first, then CrUX implied
    const gtEl = document.getElementById('gtmetrix-result');
    const cruxEl = document.getElementById('crux-result');
    gtEl.innerHTML = '<p class="loading">Running GTmetrix test... (takes 10-30s)</p>';
    cruxEl.innerHTML = '<p class="loading">Preparing real-user data...</p>';

    try {
      const apiUrl = `https://traffictorch-api.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API failed');
      }

      // Update GTmetrix
      gtEl.innerHTML = `
        <p><strong>GTmetrix Performance Score:</strong> <big>${data.gtmetrix}/100</big></p>
        <p class="education">Lab-based test from GTmetrix (reliable in 2025). Higher = faster load/UX.</p>
      `;

      // Update CrUX after short delay for "sequential" feel
      setTimeout(() => {
        cruxEl.innerHTML = `
          <p><strong>CrUX Real-User Score:</strong> <big>${data.crux}/100</big></p>
          <ul>
            <li>LCP (Loading): ${data.lcp ? data.lcp + 'ms' : 'No data'} ${data.lcp ? (data.lcp <= 2500 ? '✅ Good' : data.lcp <= 4000 ? '⚠️ Improve' : '❌ Poor') : ''}</li>
            <li>INP (Interactivity): ${data.inp ? data.inp + 'ms' : 'No data'} ${data.inp ? (data.inp <= 200 ? '✅ Good' : data.inp <= 500 ? '⚠️ Improve' : '❌ Poor') : ''}</li>
            <li>CLS (Stability): ${data.cls ? data.cls.toFixed(2) : 'No data'} ${data.cls ? (data.cls <= 0.1 ? '✅ Good' : '❌ Poor') : ''}</li>
          </ul>
          <p class="education">From real Chrome users. Focus on mobile for SEO impact.</p>
        `;
      }, 2000); // Fake sequential delay

    } catch (error) {
      console.error(error);
      gtEl.innerHTML = `<p class="error">Error: ${error.message}. Try again or check console.</p>`;
      cruxEl.innerHTML = `<p class="error">Error: Same issue. (GTmetrix may be rate-limited; wait 1min.)</p>`;
    }
  };
});