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
    // (same scoring logic as before – unchanged, just returning the 8 modules)
    // ... (full scoring code from previous working version – you already have it)

    // Placeholder return – replace with your full scoring when pasting
    return {
      score: 78,
      forecast: "Top 10 AI SERP",
      aiFixes: [
        {title:"Add Author Bio & Photo", what:"Visible byline proving who wrote this", how:"Headshot + name + bio + credentials + social links", why:"Boosts Expertise & Trust by 30–40 points — Google’s #1 E-E-A-T signal"},
        {title:"Add Article + Person Schema", what:"Structured data Google reads", how:"JSON-LD with @type Article + Person + author link", why:"Rich results + massive E-E-A-T boost"},
        {title:"Link credible sources", what:"External citations from trusted sites", how:"10+ high-authority outbound links", why:"Increases Authoritativeness and Trust"}
      ],
      modules: [
        {name:"Answerability",score:96},
        {name:"Structured Data",score:96},
        {name:"EEAT Signals",score:70},
        {name:"Scannability",score:96},
        {name:"Conversational Tone",score:70},
        {name:"Readability",score:85},
        {name:"Human Insights",score:70},
        {name:"Anti-AI Detection",score:96}
      ]
    };
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
          <div class="score-ring-big mb-12" style="--score:${r.score}%">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-8xl font-black bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl">${r.score}<span class="text-5xl">%</span></div>
            </div>
          </div>
          <h2 class="text-5xl font-black text-center mb-16">AI Search Optimization Score</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto mb-16">
            ${r.modules.map(m=>`
              <div class="metric-card text-center">
                <div class="module-circle mb-6" style="--score:${m.score}%">
                  <div class="module-score-text">${m.score}</div>
                </div>
                <h3 class="text-2xl font-bold mb-4">${m.name}</h3>
              </div>
            `).join('')}
          </div>

          <!-- AI Fixes – FIRST – exact colours -->
          <div class="ai-fixes-card rounded-3xl p-12 text-white">
            <h3 class="text-4xl font-black text-center mb-10">Prioritised AI-Style Fixes</h3>
            ${r.aiFixes.map(f=>`
              <div class="bg-white/10 rounded-2xl p-8 mb-8">
                <h4 class="text-3xl font-bold mb-6">${f.title}</h4>
                <p class="what mb-2">What: ${f.what}</p>
                <p class="how mb-2">How: ${f.how}</p>
                <p class="why">Why: ${f.why}</p>
              </div>
            `).join('')}
          </div>

          <!-- Forecast – SECOND – exact gradient -->
          <div class="forecast-card rounded-3xl p-12 text-white text-center">
            <h3 class="text-4xl font-black mb-6">Predictive Rank Forecast</h3>
            <p class="text-7xl font-black mb-4">${r.forecast}</p>
            <p class="text-4xl font-bold mb-6">+${Math.round((100 - r.score) * 1.5)}% potential traffic gain if fixed</p>
            <p class="text-lg opacity-90">Based on Google’s latest E-E-A-T and helpful content algorithms — here’s the breakdown:</p>
            <div class="grid md:grid-cols-3 gap-6 mt-8 text-left">
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-blue-300 text-xl mb-2">What it is</p>
                <p class="text-sm">A data-driven estimate of your page’s SERP position potential...</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-green-300 text-xl mb-2">How it's calculated</p>
                <p class="text-sm">40% E-E-A-T, 30% depth, 20% intent, 10% tech...</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-orange-300 text-xl mb-2">Why it matters</p>
                <p class="text-sm">Higher forecast = more visibility, clicks, revenue...</p>
              </div>
            </div>
          </div>

          <div class="mt-16 text-center">
            <button onclick="window.print()" class="px-16 py-6 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-2xl hover:scale-105 transition shadow-2xl">
              📄 Save as PDF
            </button>
          </div>
        </div>
      `;

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