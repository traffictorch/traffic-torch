document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  const modules = [
    "Fetching page", "Extracting content", "Detecting Schema", "Readability check",
    "Conversational tone", "Scannable format", "EEAT signals", "Calculating AIO score"
  ];

  const fakeProgress = () => {
    let i = 0;
    const total = modules.length;
    const duration = 4000 + Math.random() * 3000;

    const int = setInterval(() => {
      i++;
      const pct = (i / total) * 100;
      progressBar.style.width = pct + '%';
      progressText.textContent = modules[i - 1] || "Finalizing...";
      if (i >= total) {
        clearInterval(int);
        setTimeout(() => loading.classList.add('hidden'), 800);
      }
    }, duration / total);
  };

  const getMainContent = doc => { /* (same as before – unchanged) */ ... };
  const analyzeAIO = (text, doc) => { /* (same scoring logic – unchanged) */ ... };

  form.addEventListener('submit', async e => {
    e.preventDefault();               // ← this is the only line that mattered
    const url = input.value.trim();
    if (!url) return;

    report.classList.add('hidden');
    report.innerHTML = '';
    loading.classList.remove('hidden');
    progressBar.style.width = '5%';
    progressText.textContent = modules[0];
    fakeProgress();

    try {
      const res = await fetch(PROXY + url);
      if (!res.ok) throw new Error('Failed');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = getMainContent(doc);
      const clean = main.cloneNode(true);
      clean.querySelectorAll('script,style,noscript,iframe').forEach(el => el.remove());
      const text = clean.textContent.replace(/\s+/g, ' ').trim();

      const result = analyzeAIO(text, doc);

      // (exact same report HTML you already love – unchanged)
      report.innerHTML = `... your beautiful report ...`;
      report.classList.remove('hidden');
      report.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      loading.classList.add('hidden');
      alert('Error – try another URL');
    }
  });
});