document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';

  const modules = ["Fetching page","Extracting content","Detecting Schema","Readability","Conversational tone","Scannability","EEAT signals","Finalizing report"];

  const fakeProgress = () => {
    let i = 0;
    const total = modules.length;
    const duration = 4500 + Math.random()*2000;
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
    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w=>w.length>0);
    const syllables = words.reduce((a,w)=>a+(w.toLowerCase().match(/[aeiouy]+/g)||[]).length,0);
    const fk = words.length === 0 ? 0 : 206.835 - 1.015*(words.length/(sentences.length||1)) - 84.6*(syllables/(words.length||1));
    const readabilityScore = fk > 70 ? 96 : fk > 60 ? 85 : fk > 50 ? 70 : fk > 40 ? 50 : 32;
    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me)\b/gi)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const conversationalScore = (pronouns > 10 || questions > 2) ? 96 : (pronouns > 3 || questions > 0) ? 70 : 45;
    const lists = doc.querySelectorAll('ul,ol').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const scannableScore = (lists+tables+headings > 10) ? 96 : (lists+tables+headings > 5) ? 70 : 45;
    const author = !!doc.querySelector('[rel="author"],.author,.byline');
    const date = !!doc.querySelector('time,[pubdate]');
    const links = doc.querySelectorAll('a[href]').length;
    const eeatScore = (author?30:0) + (date?25:0) + (links>15?30:links>5?15:0);
    const total = hasSchema*25 + readabilityScore*0.2 + conversationalScore*0.2 + scannableScore*0.2 + eeatScore;
    const score = Math.min(100, Math.round(total));

    let forecast = "Low visibility";
    if (score > 85) forecast = "Top 3 AI SERP";
    else if (score > 70) forecast = "Top 10 AI SERP";
    else if (score > 50) forecast = "Page 1 possible";
    else forecast = "Major fixes needed";

    const aiFixes = [];
    if (!hasSchema) aiFixes.push("Add Schema.org JSON-LD (FAQ, HowTo, Article)");
    if (fk < 60) aiFixes.push("Shorten sentences to 15-20 words");
    if (pronouns < 5) aiFixes.push("Use more personal language like 'you'");
    if (lists + tables < 5) aiFixes.push("Add bullet points and tables");
    if (links < 10) aiFixes.push("Link credible sources");

    return { score, forecast, aiFixes, structured: hasSchema?96:32, readability: readabilityScore, conversational: conversationalScore, scannable: scannableScore, eeat: eeatScore };
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

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl mx-auto mb-16">
            <div class="metric-card text-center">
              <div class="module-circle mb-4" style="--score:${r.structured}%">
                <div class="module-score-text">${r.structured}</div>
              </div>
              <h3 class="text-xl font-bold">Structured Data</h3>
              <p class="text-sm opacity-80 mt-2">Schema.org JSON-LD detected</p>
              <details>
                <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                <ul class="mt-3 space-y-2 text-sm pl-4 list-disc">
                  <li>Add FAQ Schema</li>
                  <li>Add HowTo Schema</li>
                  <li>Add Article Schema</li>
                </ul>
              </details>
            </div>
            <div class="metric-card text-center">
              <div class="module-circle mb-4" style="--score:${r.readability}%">
                <div class="module-score-text">${r.readability}</div>
              </div>
              <h3 class="text-xl font-bold">Readability</h3>
              <p class="text-sm opacity-80 mt-2">Flesch-Kincaid ease</p>
              <details>
                <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                <ul class="mt-3 space-y-2 text-sm pl-4 list-disc">
                  <li>Short sentences</li>
                  <li>Active voice</li>
                  <li>Common words</li>
                </ul>
              </details>
            </div>
            <div class="metric-card text-center">
              <div class="module-circle mb-4" style="--score:${r.conversational}%">
                <div class="module-score-text">${r.conversational}</div>
              </div>
              <h3 class="text-xl font-bold">Conversational Tone</h3>
              <p class="text-sm opacity-80 mt-2">Personal & engaging language</p>
              <details>
                <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                <ul class="mt-3 space-y-2 text-sm pl-4 list-disc">
                  <li>Use "you", "I"</li>
                  <li>Ask questions</li>
                  <li>Add pronouns</li>
                </ul>
              </details>
            </div>
            <div class="metric-card text-center">
              <div class="module-circle mb-4" style="--score:${r.scannable}%">
                <div class="module-score-text">${r.scannable}</div>
              </div>
              <h3 class="text-xl font-bold">Scannable Format</h3>
              <p class="text-sm opacity-80 mt-2">Lists, tables, headings</p>
              <details>
                <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                <ul class="mt-3 space-y-2 text-sm pl-4 list-disc">
                  <li>Use bullets</li>
                  <li>Add tables</li>
                  <li>Number steps</li>
                </ul>
              </details>
            </div>
            <div class="metric-card text-center">
              <div class="module-circle mb-4" style="--score:${r.eeat}%">
                <div class="module-score-text">${r.eeat}</div>
              </div>
              <h3 class="text-xl font-bold">EEAT Signals</h3>
              <p class="text-sm opacity-80 mt-2">Author, date, links</p>
              <details>
                <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                <ul class="mt-3 space-y-2 text-sm pl-4 list-disc">
                  <li>Add author</li>
                  <li>Show date</li>
                  <li>Link sources</li>
                </ul>
              </details>
            </div>
          </div>

          <div class="forecast-card text-center mb-12">
            <h3 class="text-3xl font-bold mb-4">Predictive Rank Forecast</h3>
            <p class="text-2xl text-orange-300">${r.forecast}</p>
          </div>

          <div class="ai-fixes-card text-center">
            <h3 class="text-3xl font-bold mb-6">AI-Generated Fixes</h3>
            <ul class="space-y-4 text-left max-w-3xl mx-auto">
              ${r.aiFixes.map(f=>`<li class="flex items-start"><span class="text-orange-400 mr-3">→</span>${f}</li>`).join('')}
            </ul>
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