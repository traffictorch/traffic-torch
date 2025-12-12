document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';

  const modules = ["Fetching page","Extracting content","Answerability","Structured Data","EEAT","Scannability","Conversational Tone","Readability","Human Insights","Finalizing"];

  const fakeProgress = () => {
    let i = 0;
    const total = modules.length;
    const duration = 5000 + Math.random()*2500;
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
    const first300 = text.slice(0,300);
    const hasDirectAnswer = /bold|strong|faq|definition|summary|^.{0,100}[?:]/i.test(first300) || !!doc.querySelector('faq, .faq, [role="faq"]');
    const answerability = hasDirectAnswer ? 96 : 40;

    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0 ? 96 : 32;
    const author = !!doc.querySelector('[rel="author"],.author,.byline');
    const date = !!doc.querySelector('time,[pubdate]');
    const links = doc.querySelectorAll('a[href]').length;
    const eeat = (author?30:0) + (date?25:0) + (links>15?30:links>5?15:0);

    const lists = doc.querySelectorAll('ul,ol').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const scannable = (lists+tables+headings > 12) ? 96 : (lists+tables+headings > 6) ? 70 : 40;

    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me)\b/gi)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const conversational = (pronouns > 10 || questions > 2) ? 96 : (pronouns > 3 || questions > 0) ? 70 : 45;

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w=>w.length>0);
    const fk = words.length === 0 ? 0 : 206.835 - 1.015*(words.length/(sentences.length||1)) - 84.6*(words.reduce((a,w)=>a+(w.toLowerCase().match(/[aeiouy]+/g)||[]).length,0)/(words.length||1));
    const readability = fk > 70 ? 96 : fk > 60 ? 85 : fk > 50 ? 70 : 45;

    const humanPhrases = text.match(/\b(I|we|my|our|in my experience|I tested|I found|case study|real.?world)\b/gi)?.length || 0;
    const humanInsight = humanPhrases > 5 ? 96 : humanPhrases > 2 ? 70 : 40;

    const total = answerability*0.25 + hasSchema*0.2 + eeat*0.2 + scannable*0.15 + conversational*0.1 + readability*0.05 + humanInsight*0.05;
    const score = Math.min(100, Math.round(total));

    const forecast = score > 85 ? "Top 3 AI SERP" : score > 70 ? "Top 10 AI SERP" : score > 50 ? "Page 1 possible" : "Major fixes needed";

    return { score, forecast, answerability, structured: hasSchema, eeat, scannable, conversational, readability, humanInsight };
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

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
            ${[
              {name:"Answerability",score:r.answerability,desc:"Direct answer early"},
              {name:"Structured Data",score:r.structured,desc:"Schema.org JSON-LD"},
              {name:"EEAT Signals",score:r.eeat,desc:"Author, date, trust links"},
              {name:"Scannability",score:r.scannable,desc:"Lists, tables, headings"},
              {name:"Conversational Tone",score:r.conversational,desc:"Personal language"},
              {name:"Readability",score:r.readability,desc:"Easy to understand"},
              {name:"Human Insights",score:r.humanInsight,desc:"First-hand experience"},
            ].map(m=>`
              <div class="metric-card text-center">
                <div class="module-circle mb-4" style="--score:${m.score}%">
                  <div class="module-score-text">${m.score}</div>
                </div>
                <h3 class="text-xl font-bold mb-2">${m.name}</h3>
                <p class="text-sm opacity-80">${m.desc}</p>
                <details class="mt-4">
                  <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                  <ul class="mt-3 space-y-2 text-sm list-disc pl-6 text-left">
                    <li>Coming soon</li>
                  </ul>
                </details>
              </div>
            `).join('')}
          </div>

          <div class="forecast-card text-center mb-12">
            <h3 class="text-3xl font-bold mb-4">Predictive Rank Forecast</h3>
            <p class="text-2xl text-orange-300">${r.forecast}</p>
          </div>

          <div class="text-center">
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