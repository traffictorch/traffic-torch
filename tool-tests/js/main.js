// tool-tests/js/main.js – super simple now
document.getElementById('analysis-form').onsubmit = async e => {
  e.preventDefault();
  const url = document.getElementById('url-input').value.trim();

  document.getElementById('gtmetrix-result').innerHTML = '<p>Running GTmetrix…</p>';
  document.getElementById('crux-result').innerHTML = '<p>Fetching real-user data…</p>';

  const result = await fetch(`https://traffictorch-api.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`);
  const data = await result.json();

  document.getElementById('gtmetrix-result').innerHTML = `
    <p><strong>GTmetrix Score:</strong> <big>${data.gtmetrix}/100</big></p>
    <small>Runs directly from Cloudflare – no blocks ever</small>`;

  document.getElementById('crux-result').innerHTML = `
    <p><strong>Real-User Core Web Vitals Score:</strong> <big>${data.crux}/100</big></p>
    <ul><li>LCP: ${data.lcp??'No data'}</li><li>INP: ${data.inp??'No data'}</li><li>CLS: ${data.cls??'No data'}</li></ul>`;
};