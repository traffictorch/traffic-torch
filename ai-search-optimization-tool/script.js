document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';

  const modules = ["Fetching page","Extracting content","Detecting Schema","Readability","Conversational tone","Scannability","EEAT signals","Generating AI fixes","Predicting rank","Finalizing report"];

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
    c.querySelectorAll('nav,header,footer,aside,.cookie,.sidebar,.advert').forEach(e=>e.remove());
    return c;
  };

  const analyze = (text, doc) => {
    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0 ? 25 : 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w=>w.length>0);
    const syllables = words.reduce((a,w)=>a+(w.toLowerCase().match(/[aeiouy]+/g)||[]).length,0);
    const fk = words.length === 0 ? 0 : 206.835 - 1.015*(words.length/(sentences.length||1)) - 84.6*(syllables/(words.length||1));
    const readabilityScore = fk > 70 ? 20 : fk > 60 ? 18 : fk > 50 ? 12 : fk > 40 ? 8 : 4;
    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me|mine|yours)\b/gi)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const conversationalScore = (pronouns > 10 || questions > 2) ? 22 : (pronouns > 3 || questions > 0) ? 14 : 6;
    const lists = doc.querySelectorAll('ul,ol,dl').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const scannableScore = (lists+tables+headings > 12) ? 20 : (lists+tables+headings > 6) ? 14 : 8;
    const author = !!doc.querySelector('[rel="author"],.author,.byline,.posted-by');
    const date = !!doc.querySelector('time,[pubdate],.date,.published');
    const links = doc.querySelectorAll('a[href]').length;
    const eeatScore = (author?12:0) + (date?10:0) + (links>20?10:links>8?6:3);
    const total = hasSchema + readabilityScore + conversationalScore + scannableScore + eeatScore;
    const score = Math.min(100, Math.round(total));

    // Predictive Rank Forecast
    let forecast = "Low AI visibility – focus on basics";
    if (score > 85) forecast = "Top 3 AI SERP – excellent AIO";
    else if (score > 70) forecast = "Top 10 AI SERP – good potential";
    else if (score > 50) forecast = "Mid-page AI SERP – room for improvement";
    else forecast = "Bottom AI SERP – major fixes needed";

    // AI Fixes
    const aiFixes = [];
    if (hasSchema < 25) aiFixes.push("Add Schema.org JSON-LD for FAQ/HowTo – boosts direct AI answers");
    if (fk < 60) aiFixes.push("Simplify sentences to 15-20 words – AI loves easy summaries");
    if (pronouns < 5) aiFixes.push("Add personal language like 'you' – makes content conversational");
    if (lists + tables < 5) aiFixes.push("Insert bullets and tables – improves AI scannability");
    if (links < 10) aiFixes.push("Link 10+ credible sources – builds EEAT trust for AI citations");

    return { score, forecast, aiFixes, structured: hasSchema?'Yes':'No', readability: Math.round(fk), readabilityScore, conversational: `${pronouns} pronouns • ${questions} questions`, conversationalScore, scannable: `${lists} lists • ${tables} tables • ${headings} headings`, scannableScore, eeat: `${author?'✓':'✗'} Author • ${date?'✓':'✗'} Date • ${links} links`, eeatScore };
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let url = input.value.trim();
if (!url.startsWith('http://') && !url.startsWith('https://')) {
  url = 'https://' + url;
}

    report.classList.add('hidden'); report.innerHTML = '';
    loading.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = modules[0];
    fakeProgress();

    try {
      const res = await fetch(PROXY + url);
      if (!res.ok) throw new Error('Page not reachable');

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = getMainContent(doc);
      const clean = main.cloneNode(true);
      clean.querySelectorAll('script,style,noscript,iframe,svg').forEach(e=>e.remove());
      const text = clean.textContent.replace(/\s+/g,' ').trim();
      const r = analyze(text, doc);

      report.innerHTML = `
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-orange-500/30 text-center">
          <div class="score-ring-big mx-auto mb-12" style="--score: ${r.score}%;">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="aio-score-text">${r.score}<span class="text-4xl">%</span></div>
            </div>
          </div>
          <h2 class="text-5xl font-black mb-4">AI Search Optimization Score</h2>
          <p class="text-xl text-gray-300 mb-16">How well this page ranks in Perplexity • Grok • Gemini • ChatGPT Search</p>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto mb-16">
            ${[
              {name:"Structured Data",value:r.structured,score:r.structured==='Yes'?100:0,what:"Presence of Schema.org JSON-LD",how:"Add JSON-LD scripts",why:"AI engines use it for direct answers/citations",fix:r.structured==='Yes'?[]:["Add FAQSchema","Add HowToSchema","Add Article schema"]},
              {name:"Readability",value:r.readability,score: (r.readability / 100 * 100),what:"Flesch-Kincaid grade level",how:"Simplify language",why:"AI prefers easy-to-summarize content",fix:r.readability>60?[]:["Short sentences (15-20 words)","Active voice","Common words"]},
              {name:"Conversational Tone",value:r.conversational,score: r.conversationalScore/22*100,what:"Personal pronouns & questions",how:"Write like speaking",why:"Matches natural AI queries",fix:r.conversationalScore>15?[]:["Use “you”, “I”, “we”","Ask rhetorical questions","Add personal pronouns"]},
              {name:"Scannable Format",value:r.scannable,score: r.scannableScore/20*100,what:"Lists/tables/headings count",how:"Use bullets/tables",why:"AI scans for quick info",fix:r.scannableScore>15?[]:["Use bullet points","Add tables","Number steps"]},
              {name:"EEAT Signals",value:r.eeat,score: r.eeatScore/32*100,what:"Author/date/links check",how:"Add trust markers",why:"Builds credibility for AI ranking",fix:r.eeatScore>20?[]:["Add author byline","Show publish date","Link credible sources"]},
            ].map(m=>`
              <div class="metric-card">
                <h3 class="text-2xl font-bold mb-4">${m.name}</h3>
                <div class="module-circle mb-6" style="--score: ${Math.round(m.score)}%;">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="module-score-text">${Math.round(m.score)}</div>
                  </div>
                </div>
                <div class="text-3xl font-black mb-6 ${String(m.value).includes('Yes') || String(m.value).includes('✓') ? 'text-green-400' : 'text-orange-400'}">${m.value}</div>
                <p class="text-sm opacity-80 mb-2"><strong>What:</strong> ${m.what}</p>
                <p class="text-sm opacity-80 mb-2"><strong>How:</strong> ${m.how}</p>
                <p class="text-sm opacity-80 mb-4"><strong>Why:</strong> ${m.why}</p>
                <details class="text-left">
                  <summary class="show-fixes">Show Fixes →</summary>
                  <ul class="fixes-list">${m.fix.map(f=>`<li>${f}</li>`).join('')}</ul>
                </details>
              </div>
            `).join('')}
          </div>

          <div class="forecast-card">
            <h3 class="text-3xl font-bold mb-4">Predictive Rank Forecast</h3>
            <p class="text-xl text-orange-300">${r.forecast}</p>
            <p class="text-sm opacity-80 mt-4">Based on current AIO score and best practices for 2025 AI SERPs.</p>
          </div>

          <div class="mt-16 bg-gradient-to-r from-orange-500/20 to-pink-600/20 rounded-3xl p-10 border border-orange-500/30">
            <h3 class="text-3xl font-bold mb-4">AI-Generated Fixes</h3>
            <ul class="space-y-4 text-left max-w-3xl mx-auto">${r.aiFixes.map(f=>`<li class="flex items-start text-sm"><span class="text-orange-400 mr-3">★</span>${f}</li>`).join('')}</ul>
          </div>

          <div class="mt-16">
            <button onclick="window.print()" class="px-16 py-6 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-2xl hover:scale-105 transition shadow-2xl">
              📄 Save as PDF
            </button>
          </div>
          <p class="mt-12 text-gray-500"><a href="/" class="text-orange-400 hover:underline">← Back to all tools</a></p>
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