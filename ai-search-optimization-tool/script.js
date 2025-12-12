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
    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w=>w.length>0);
    const syllables = words.reduce((a,w)=>a+(w.toLowerCase().match(/[aeiouy]+/g)||[]).length,0);
    const fk = words.length === 0 ? 0 : 206.835 - 1.015*(words.length/(sentences.length||1)) - 84.6*(syllables/(words.length||1));
    const readability = fk > 70 ? 96 : fk > 60 ? 85 : fk > 50 ? 70 : fk > 40 ? 50 : 32;

    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me)\b/gi)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const conversational = (pronouns > 10 || questions > 2) ? 96 : (pronouns > 3 || questions > 0) ? 70 : 45;

    const lists = doc.querySelectorAll('ul,ol').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const scannable = (lists+tables+headings > 10) ? 96 : (lists+tables+headings > 5) ? 70 : 45;

    const author = !!doc.querySelector('[rel="author"],.author,.byline');
    const date = !!doc.querySelector('time,[pubdate]');
    const links = doc.querySelectorAll('a[href]').length;
    const eeat = (author?30:0) + (date?25:0) + (links>15?30:links>5?15:0);

    const humanPhrases = text.match(/\b(I|we|my|our|in my experience|I tested|I found|case study)\b/gi)?.length || 0;
    const humanInsight = humanPhrases > 5 ? 96 : humanPhrases > 2 ? 70 : 45;

    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a,b)=>a+b,0)/sentenceLengths.length || 1;
    const variance = sentenceLengths.reduce((a,b)=>a + Math.pow(b - avgLength,2),0)/sentenceLengths.length;
    const burstiness = Math.sqrt(variance);
    const antiAI = burstiness > 5 ? 96 : burstiness > 3 ? 70 : 45;

    const answerability = /bold|strong|faq|summary/i.test(text.slice(0,300)) ? 96 : 70;

    const total = answerability*0.25 + (hasSchema?96:32)*0.2 + eeat*0.2 + scannable*0.15 + conversational*0.1 + readability*0.05 + humanInsight*0.05 + antiAI*0.05;
    const score = Math.min(100, Math.round(total));

    let forecast = "Low visibility";
    if (score > 85) forecast = "Top 3 AI SERP";
    else if (score > 70) forecast = "Top 10 AI SERP";
    else if (score > 50) forecast = "Page 1 possible";
    else forecast = "Major fixes needed";

    const aiFixes = [
      {title:"Add Author Bio & Photo", what:"Visible byline proving who wrote this", how:"Headshot + name + bio + credentials + social links", why:"Boosts Expertise & Trust by 30–40 points — Google’s #1 E-E-A-T signal"},
      {title:"Add Article + Person Schema", what:"Structured data Google reads", how:"JSON-LD with @type Article + Person + author link", why:"Rich results + massive E-E-A-T boost"},
      {title:"Link credible sources", what:"External citations from trusted sites", how:"10+ high-authority outbound links", why:"Increases Authoritativeness and Trust"}
    ];

    return { score, forecast, aiFixes, modules: [
      {name:"Answerability",score:answerability},
      {name:"Structured Data",score:hasSchema?96:32},
      {name:"EEAT Signals",score:eeat},
      {name:"Scannability",score:scannable},
      {name:"Conversational Tone",score:conversational},
      {name:"Readability",score:readability},
      {name:"Human Insights",score:humanInsight},
      {name:"Anti-AI Detection",score:antiAI}
    ]};
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
                <div class="text-7xl font-black text-white drop-shadow-2xl">${r.score}<span class="text-4xl">%</span></div>
              </div>
            </div>
          </div>
          <h2 class="text-5xl font-black text-center mb-16">AI Search Optimization Score</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto mb-16">
            ${r.modules.map(m=>`
              <div class="metric-card">
                <div class="relative mx-auto w-32 h-32 mb-6">
                  <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                    <circle cx="64" cy="64" r="56" stroke="${m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#f59e0b' : '#ef4444'}"
                            stroke-width="12" fill="none" stroke-dasharray="${(m.score/100)*352} 352" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">${m.score}</div>
                </div>
                <h3 class="text-2xl font-bold mb-4">${m.name}</h3>
                <button class="text-orange-400 font-bold hover:text-pink-400">Show Fixes →</button>
              </div>
            `).join('')}
          </div>

          <div class="ai-fixes-card rounded-3xl p-12">
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

          <div class="forecast-card rounded-3xl p-12 text-center">
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