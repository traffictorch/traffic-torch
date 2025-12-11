document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');
  

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    results.innerHTML = '<p class="text-center text-2xl py-20">Analyzing page…</p>';
    results.classList.remove('hidden');

    try {
      const res = await fetch(`https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(url)}`, {
  headers: { Origin: 'https://traffictorch.net' }
});
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const text = doc.body.textContent || '';
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = (text.match(/[.!?]+/g) || []).length || 1;
      const syllables = text.split(/\s+/).reduce((a,w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
      const readability = Math.round(206.835 - 1.015*(words/sentences) - 84.6*(syllables/words));

      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const schemaTypes = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const json = JSON.parse(s.textContent);
          const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
          schemaTypes.push(...types.filter(Boolean));
        } catch {}
      });

      const title = doc.title.toLowerCase();
      let intent = 'Informational', confidence = 60;
      if (/buy|best|review|price/.test(title)) { intent = 'Commercial'; confidence = 88; }
      else if (/how|what|guide|tutorial/.test(title)) { intent = 'Informational'; confidence = 92; }
      else if (/near me|location/.test(title)) { intent = 'Local'; confidence = 82; }

      const eeat = {
        Experience: (text.match(/\b(I|we|my|our|I've|we've)\b/gi) || []).length > 12 ? 92 : 45,
        Expertise: hasAuthor ? 90 : 32,
        Authoritativeness: schemaTypes.length > 0 ? 94 : 40,
        Trustworthiness: url.startsWith('https') ? 96 : 60
      };
      const eeatAvg = Math.round(Object.values(eeat).reduce((a,b)=>a+b)/4);
      const depthScore = words > 2000 ? 95 : words > 1200 ? 82 : words > 700 ? 65 : 35;
      const readScore = readability > 70 ? 90 : readability > 50 ? 75 : 45;
      const overall = Math.round((depthScore + readScore + eeatAvg + confidence + schemaTypes.length*8)/5);

      // Render everything into your original sections
      document.getElementById('overall-score').textContent = `${overall}/100`;
      document.getElementById('radar-chart').innerHTML = generateRadar(eeat);
      document.getElementById('intent-type').innerHTML = `<strong>${intent}</strong> (${confidence}% confidence)`;
      document.getElementById('content-depth').innerHTML = `
        <p><strong>Word Count:</strong> ${words.toLocaleString()}</p>
        <p><strong>Readability (Flesch):</strong> ${readability} ${readability<60?'→ too complex':''}</p>`;

      const eeatDiv = document.getElementById('eeat-breakdown');
      eeatDiv.innerHTML = Object.entries(eeat).map(([k,v]) => `
        <div class="text-center p-6 bg-white/10 dark:bg-white/5 rounded-2xl">
          <div class="text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${v}</div>
          <div class="mt-2 opacity-80">${k}</div>
        </div>`).join('');

      document.getElementById('schema-types').innerHTML = schemaTypes.length
        ? `<select class="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800">${schemaTypes.map(t=>`<option>${t}</option>`).join('')}</select>`
        : '<p>No schema detected</p>';

      const tbody = document.querySelector('#gap-table tbody');
      tbody.innerHTML = `
        <tr><td class="p-4">Word Count</td><td class="p-4">${words}</td><td class="p-4">>1500</td><td class="p-4">${words<1500?'Add depth':''}</td></tr>
        <tr><td class="p-4">Readability</td><td class="p-4">${readability}</td><td class="p-4">60–70</td><td class="p-4">${readability<60?'Simplify':''}</td></tr>
        <tr><td class="p-4">Schema</td><td class="p-4">${schemaTypes.length}</td><td class="p-4">≥2</td><td class="p-4">${schemaTypes.length<2?'Add':''}</td></tr>
        <tr><td class="p-4">Author</td><td class="p-4">${hasAuthor?'Yes':'No'}</td><td class="p-4">Yes</td><td class="p-4">${!hasAuthor?'Add bio':''}</td></tr>`;

      const fixesList = document.getElementById('fixes-list');
      fixesList.innerHTML = '';
      if (overall < 90) fixesList.innerHTML += `<li class="p-6 bg-red-500/20 rounded-xl"><strong>Add Author Bio + Credentials</strong><br>→ +30–40 E-E-A-T points</li>`;
      if (words < 1200) fixesList.innerHTML += `<li class="p-6 bg-orange-500/20 rounded-xl"><strong>Add 800+ words with examples</strong><br>→ Biggest ranking lever 2025</li>`;
      if (schemaTypes.length < 2) fixesList.innerHTML += `<li class="p-6 bg-yellow-500/20 rounded-xl"><strong>Add Article + Person schema</strong><br>→ Rich results boost</li>`;

      document.getElementById('rank-forecast').textContent = `${overall > 88 ? 'Top 3' : overall > 70 ? 'Top 10' : 'Page 2+'} – Apply fixes → +${Math.round((100-overall)*1.3)}% traffic`;

    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center">Error: ${err.message}</p>`;
    }
  });

  function generateRadar(data) {
    const size = 380, c = size/2, n = 4;
    let points = '';
    const labels = ['Experience','Expertise','Authoritativeness','Trustworthiness'];
    labels.forEach((label,i) => {
      const val = data[label] / 100;
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const x = c + val * (c-60) * Math.cos(angle);
      const y = c + val * (c-60) * Math.sin(angle);
      points += `${x},${y} `;
    });
    return `<svg viewBox="0 0 ${size} ${size}" class="drop-shadow-2xl"><polygon points="${points}" fill="#f9731660" stroke="#f97316" stroke-width="4"/><circle cx="${c}" cy="${c}" r="${c-60}" fill="none" stroke="#fff3" stroke-dasharray="8"/></svg>`;
  }
});