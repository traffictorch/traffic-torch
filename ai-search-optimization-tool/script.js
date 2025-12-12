document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';

  const modules = ["Fetching page","Extracting content","Detecting Schema","Readability","Conversational tone","Scannability","EEAT signals","AI fixes","Rank forecast","Finalizing"];

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
    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w=>w.length>0);
    const syllables = words.reduce((a,w)=>a+(w.toLowerCase().match(/[aeiouy]+/g)||[]).length,0);
    const fk = words.length === 0 ? 0 : 206.835 - 1.015*(words.length/(sentences.length||1)) - 84.6*(syllables/(words.length||1));
    const readabilityScore = fk > 70 ? 100 : fk > 60 ? 90 : fk > 50 ? 70 : fk > 40 ? 50 : 20;
    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me|mine|yours)\b/gi)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const conversationalScore = (pronouns > 10 || questions > 2) ? 100 : (pronouns > 3 || questions > 0) ? 70 : 30;
    const lists = doc.querySelectorAll('ul,ol,dl').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const scannableScore = (lists+tables+headings > 12) ? 100 : (lists+tables+headings > 6) ? 75 : 40;
    const author = !!doc.querySelector('[rel="author"],.author,.byline,.posted-by');
    const date = !!doc.querySelector('time,[pubdate],.date,.published');
    const links = doc.querySelectorAll('a[href]').length;
    const eeatScore = (author?30:0) + (date?25:0) + (links>20?30:links>8?20:10);
    const total = hasSchema*25 + readabilityScore*0.2 + conversationalScore*0.22 + scannableScore*0.2 + eeatScore;
    const score = Math.min(100, Math.round(total));

    let forecast = "Low visibility";
    if (score > 85) forecast = "Top 3 in AI search";
    else if (score > 70) forecast = "Top 10 — strong contender";
    else if (score > 50) forecast = "Page 1 possible";
    else forecast = "Needs major AIO improvements";

    const aiFixes = [];
    if (!hasSchema) aiFixes.push("Add Schema.org JSON-LD (FAQ, HowTo, Article)");
    if (fk < 60) aiFixes.push("Shorten sentences to 15-20 words max");
    if (pronouns < 5) aiFixes.push("Use 'you', 'I', 'we' more often");
    if (lists + tables < 5) aiFixes.push("Add bullet points and tables");
    if (links < 10) aiFixes.push("Link 10+ credible sources");

    return {
      score,
      forecast,
      aiFixes,
      modules: [
        {name:"Structured Data",value:hasSchema?"Yes":"No",score:hasSchema?100:0},
        {name:"Readability",value:Math.round(fk),score:readabilityScore},
        {name:"Conversational Tone",value:`${pronouns} pronouns • ${questions} questions`,score:conversationalScore},
        {name:"Scannable Format",value:`${lists} lists • ${tables} tables • ${headings} headings`,score:scannableScore},
        {name:"EEAT Signals",value:`${author?'✓':'✗'} Author • ${date?'✓':'✗'} Date • ${links} links`,score:eeatScore/0.95}
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
          <div class="score-ring-big mx-auto mb-12" style="--score:${r.score}%">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-8xl font-black bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">${r.score}<span class="text-5xl">%</span></div>
            </div>
          </div>

          <h2 class="text-5xl font-black mb-16">AI Search Optimization Score</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto mb-16">
            ${r.modules.map(m=>`
              <div class="metric-card">
                <h3 class="text-2xl font-bold mb-6">${m.name}</h3>
                <div class="module-circle mb-6" style="--score:${m.score}%">
                  <div class="module-score-text">${Math.round(m.score)}</div>
                </div>
                <div class="text-3xl font-black mb-6 ${m.score>70?'text-green-400':'text-orange-400'}">${m.value}</div>
                <details class="text-left">
                  <summary class="text-orange-400 font-bold cursor-pointer hover:text-pink-400">Show Fixes →</summary>
                  <ul class="mt-4 space-y-2 text-sm list-disc pl-6">
                    ${m.name==="Structured Data" && m.value==="No" ? '<li>Add FAQSchema, HowToSchema, Article schema</li>' : ''}
                    ${m.name==="Readability" && m.score<80 ? '<li>Short sentences • Active voice • Simple words</li>' : ''}
                    ${m.name==="Conversational Tone" && m.score<80 ? '<li>Use "you", "I", ask questions</li>' : ''}
                    ${m.name==="Scannable Format" && m.score<80 ? '<li>Bullets • Tables • Numbered steps</li>' : ''}
                    ${m.name==="EEAT Signals" && m.score<80 ? '<li>Add author • Publish date • Source links</li>' : ''}
                  </ul>
                </details>
              </div>
            `).join('')}
          </div>

          <div class="forecast-card">
            <h3 class="text-3xl font-bold mb-4">Predictive Rank Forecast</h3>
            <p class="text-2xl text-orange-300">${r.forecast}</p>
          </div>

          <div class="ai-fixes-card mt-12">
            <h3 class="text-3xl font-bold mb-6">AI-Generated Fixes</h3>
            <ul class="space-y-4 text-left max-w-3xl mx-auto text-lg">${r.aiFixes.map(f=>`<li class="flex"><span class="text-orange-400 mr-3">▶</span>${f}</li>`).join('')}</ul>
          </div>

          <div class="mt-16">
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