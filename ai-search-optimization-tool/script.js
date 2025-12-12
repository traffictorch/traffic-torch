document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';

  const modules = ["Fetching page","Extracting content","Detecting Schema","Readability","Conversational tone","Scannability","EEAT signals","Final score"];

  const fakeProgress = () => {
    let i = 0;
    const total = modules.length;
    const duration = 4500 + Math.random()*3000;
    const int = setInterval(() => {
      i++;
      progressBar.style.width = (i/total*100)+'%';
      progressText.textContent = modules[i-1] || "Finalizing...";
      if (i >= total) clearInterval(int);
    }, duration/total);
  };

  const getMainContent = doc => {
    const s = ['article','main','[role="main"]','.post-content','.entry-content','#content'];
    for (let sel of s) if (doc.querySelector(sel)) return doc.querySelector(sel);
    const c = doc.body.cloneNode(true);
    c.querySelectorAll('nav,header,footer,aside,.cookie,.sidebar').forEach(e=>e.remove());
    return c;
  };

  const analyze = (text, doc) => {
    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0 ? 25 : 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w=>w);
    const syllables = words.reduce((a,w)=>a+(w.match(/[aeiouy]+/gi)||[]).length,0);
    const fk = 206.835 - 1.015*(words.length/sentences.length) - 84.6*(syllables/words.length);
    const readability = fk > 70 ? 20 : fk > 60 ? 15 : fk > 50 ? 8 : 3;

    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me)\b/gi)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const conversational = (pronouns > 8 || questions > 2) ? 20 : 8;

    const lists = doc.querySelectorAll('ul,ol').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const scannable = (lists+tables+headings > 10) ? 20 : 10;

    const author = !!doc.querySelector('[rel="author"],.author,.byline');
    const date = !!doc.querySelector('time,[pubdate]');
    const links = doc.querySelectorAll('a[href]').length;
    const eeat = (author?10:0) + (date?8:0) + (links>10?7:3);

    const total = hasSchema + readability + conversational + scannable + eeat;
    return {
      score: Math.min(100, Math.round(total)),
      structured: hasSchema ? 'Yes' : 'No',
      readability: Math.round(fk),
      conversational: `${pronouns} pronouns • ${questions} questions`,
      scannable: `${lists} lists • ${tables} tables • ${headings} headings`,
      eeat: `${author?'✓':'✗'} Author • ${date?'✓':'✗'} Date • ${links} links`
    };
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    report.classList.add('hidden'); report.innerHTML = '';
    loading.classList.remove('hidden');
    progressBar.style.width = '5%';
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
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-orange-500/30 text-center">
          <div class="inline-block score-ring relative mx-auto mb-12">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="aio-score-text">${r.score}<span class="text-4xl">%</span></div>
            </div>
          </div>
          <style>.score-ring{--score:${r.score}%}</style>
          <h2 class="text-4xl font-bold mb-4">AI Search Optimization Score</h2>
          <p class="text-xl text-gray-300 mb-12">How well this page ranks in Perplexity • Grok • Gemini • ChatGPT Search</p>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            ${[
              {name:"Structured Data",value:r.structured,why:"AI uses JSON-LD for rich answers",fix:["Add FAQSchema","Add HowToSchema","Add Article schema"]},
              {name:"Readability",value:r.readability,why:"Easy content = better summarization",fix:["Short sentences","Active voice","Common words"]},
              {name:"Conversational Tone",value:r.conversational,why:"Matches real user queries",fix:["Use “you” and “I”","Ask rhetorical questions","Add personal pronouns"]},
              {name:"Scannable Format",value:r.scannable,why:"AI extracts lists instantly",fix:["Use bullet points","Add tables","Number steps"]},
              {name:"EEAT Signals",value:r.eeat,why:"Trust = higher citation chance",fix:["Add author byline","Show publish date","Link sources"]},
            ].map(m=>`
              <div class="metric-card">
                <h3 class="text-2xl font-bold mb-4">${m.name}</h3>
                <div class="text-3xl font-black mb-6 ${m.value.includes('Yes')||m.value.includes('✓')?'text-green-400':'text-orange-400'}">${m.value}</div>
                <p class="text-sm opacity-80 mb-4"><strong>Why:</strong> ${m.why}</p>
                <details class="text-left">
                  <summary class="cursor-pointer text-orange-400 font-bold">Show Fixes →</summary>
                  <ul class="mt-3 space-y-2 text-sm">${m.fix.map(f=>`<li class="flex items-start"><span class="text-orange-400 mr-2">▶</span>${f}</li>`).join('')}</ul>
                </details>
              </div>
            `).join('')}
          </div>

          <div class="mt-16">
            <button onclick="window.print()" class="px-12 py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-xl hover:scale-105 transition shadow-2xl">
              📄 Save as PDF
            </button>
          </div>
          <p class="mt-12 text-gray-500"><a href="/" class="text-orange-400 hover:underline">← Back to tools</a></p>
        </div>
      `;

      setTimeout(() => {
        loading.classList.add('hidden');
        report.classList.remove('hidden');
        report.scrollIntoView({behavior:'smooth'});
      }, 1000);
    } catch (err) {
      loading.classList.add('hidden');
      alert('Error – try another URL');
    }
  });
});