document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';

  const modules = ["Fetching page","Extracting content","Answerability","Structured Data","EEAT","Scannability","Conversational Tone","Readability","Human Insights","Anti-AI Detection","Finalizing"];

  const fakeProgress = () => {
    let i = 0;
    const total = modules.length;
    const duration = 5000 + Math.random()*2000;
    const int = setInterval(() => {
      i++;
      progressBar.style.width = (i/total*100)+'%';
      progressText.textContent = modules[i-1] || "Finalizing...";
      if (i >= total) clearInterval(int);
    }, duration/total);
  };

  const getMainContent = doc => {
    const s = ['article','main','[role="main"]','.post-content','.entry-content','#content','.blog-post'];
    for (let sel of s) if (doc.querySelector(sel)) return doc.querySelector(sel);
    const c = doc.body.cloneNode(true);
    c.querySelectorAll('nav,header,footer,aside,.cookie,.sidebar').forEach(e=>e.remove());
    return c;
  };

  const analyze = (text, doc) => {
    // (same full scoring as last version – unchanged)
    // ... (use the full analyze function from my previous message)

    // Placeholder return – use the full one you already have
    return { score: 78, forecast: "Top 10 AI SERP", aiFixes: [/* your 3-5 fixes */], modules: [/* 8 modules with score */] };
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let url = input.value.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    report.classList.add('hidden'); report.innerHTML = '';
    loading.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = modules[0];
    fakeProgress();

    try {
      const res = await fetch(PROXY + url);
      if (!res.ok) throw new Error('Failed');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html,'text/html');
      const main = getMainContent(doc);
      const clean = main.cloneNode(true);
      clean.querySelectorAll('script,style,noscript,iframe').forEach(e=>e.remove());
      const text = clean.textContent.replace(/\s+/g,' ').trim();
      const r = analyze(text, doc);

      report.innerHTML = `
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-orange-500/30">
          <div class="flex justify-center mb-12">
            <div class="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                        stroke-dasharray="${(r.score / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="bigGradient">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-7xl font-black text-white drop-shadow-2xl">${r.score}</div>
              </div>
            </div>
          </div>
          <h2 class="text-5xl font-black text-center mb-16">AI Search Optimization Score</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
            ${r.modules.map(m=>`
              <div class="metric-card text-center">
                <div class="relative mx-auto w-32 h-32 mb-6">
                  <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                    <circle cx="64" cy="64" r="56" stroke="${m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#f59e0b' : '#ef4444'}"
                            stroke-width="12" fill="none" stroke-dasharray="${(m.score/100)*352} 352" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">${m.score}</div>
                </div>
                <h3 class="text-xl font-bold mb-4">${m.name}</h3>
                <button class="show-fixes-btn">Show Fixes</button>
                <div class="hidden mt-6 space-y-4 text-left">
                  <p class="what">What: [definition]</p>
                  <p class="how">How: [how to fix]</p>
                  <p class="why">Why: [why it matters]</p>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- AI Fixes & Forecast – exact design -->
          <div class="ai-fixes-card">
            <h3 class="text-4xl font-black text-center mb-10">Prioritised AI-Style Fixes</h3>
            ${r.aiFixes.map(f=>`
              <div class="bg-white/10 rounded-2xl p-8 mb-8">
                <h4 class="text-3xl font-bold mb-6">${f.title}</h4>
                <p class="what">What: ${f.what}</p>
                <p class="how">How: ${f.how}</p>
                <p class="why">Why: ${f.why}</p>
              </div>
            `).join('')}
          </div>

          <div class="forecast-card text-center">
            <h3 class="text-4xl font-black mb-6">Predictive Rank Forecast</h3>
            <p class="text-7xl font-black mb-4">${r.forecast}</p>
            <p class="text-4xl font-bold mb-6">+${Math.round((100 - r.score) * 1.5)}% potential traffic gain if fixed</p>
          </div>

          <div class="mt-16 text-center">
            <button onclick="window.print()" class="px-16 py-6 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-2xl hover:scale-105 transition shadow-2xl">
              📄 Save as PDF
            </button>
          </div>
        </div>
      `;

      // Show Fixes toggle
      report.addEventListener('click', e => {
        if (e.target.classList.contains('show-fixes-btn')) {
          e.target.nextElementSibling.classList.toggle('hidden');
        }
      });

      setTimeout(() => {
        loading.classList.add('hidden');
        report.classList.remove('hidden');
        report.scrollIntoView({behavior:'smooth'});
      }, 1200);
    } catch (err) {
      loading.classList.add('hidden');
      alert('Error – try another URL');
    }
  });
});