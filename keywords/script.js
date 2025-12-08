document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('torchForm');
  const results = document.getElementById('results');
  const scoreEl = document.getElementById('finalScore');
  const fire = document.getElementById('fireEmoji');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    results.classList.add('hidden');
    scoreEl.textContent = '--';
    fire.style.display = 'none';

    const url = document.getElementById('pageUrl').value.trim();
    const phrase = document.getElementById('targetPhrase').value.trim().toLowerCase();

    if (!url || !phrase) return alert('Enter both URL and keyword');

    try {
      // This matches exactly how your competition tool works
      const res = await fetch(`/api.php?url=${encodeURIComponent(url)}&t=${Date.now()}`);
      
      const text = await res.text(); // Get raw text first

      // Fix the "<?php" garbage your api.php sometimes returns
      const jsonText = text.trim().replace(/^<\?php.*?\?>\s*/i, '').trim();
      
      let page;
      try {
        page = JSON.parse(jsonText);
      } catch {
        throw new Error('API returned invalid data. Check if api.php is up-to-date.');
      }

      if (page.error) throw new Error(page.error);

      const analysis = analyze(page, phrase);
      render(analysis);
      results.classList.remove('hidden');
    } catch (err) {
      alert('Error: ' + err.message);
      console.log('Raw response from api.php:', text ?? 'empty');
    }
  });

  function analyze(p, phrase) {
    let score = 0;
    const add = (pts, cond) => { if (cond) score += pts; };

    const titleOk = p.title?.toLowerCase().includes(phrase);
    const titleLen = p.title?.length || 0;
    add(15, titleOk && titleLen >= 50 && titleLen <= 60);
    add(10, titleOk);

    const descOk = p.description?.toLowerCase().includes(phrase);
    const descLen = p.description?.length || 0;
    add(10, descOk && descLen >= 150 && descLen <= 160);
    add(7, descOk);

    add(15, p.h1?.toLowerCase().includes(phrase));

    const words = p.content?.toLowerCase().split(/\s+/).filter(Boolean) || [];
    const wordCount = words.length;
    const exactCount = (p.content?.toLowerCase().match(new RegExp(phrase, 'g')) || []).length;
    const density = wordCount ? (exactCount / wordCount * 100).toFixed(1) : 0;
    const inFirst100 = words.slice(0,100).join(' ').includes(phrase);
    add(10, wordCount >= 800);
    add(10, density >= 1 && density <= 2.5);
    add(8, inFirst100);

    const images = p.images || [];
    const imgWithPhrase = images.filter(i => i.alt?.toLowerCase().includes(phrase)).length;
    const altPercent = images.length ? Math.round(imgWithPhrase / images.length * 100) : 0;
    add(10, altPercent >= 50);

    const internalLinks = p.links?.filter(l => l.isInternal && l.text) || [];
    const goodAnchors = internalLinks.filter(l => l.text.toLowerCase().includes(phrase)).length;
    const anchorPercent = internalLinks.length ? Math.round(goodAnchors / internalLinks.length * 100) : 0;
    add(10, anchorPercent >= 30);

    add(10, p.url?.toLowerCase().includes(phrase.replace(/ /g,'-')));
    add(10, !!p.schema);

    // 2025 Bonus Modules
    const lazyCount = images.filter(i => i.lazy === true).length;
    const lazyPercent = images.length ? Math.round(lazyCount / images.length * 100) : 0;
    const missingAlts = images.filter(i => !i.alt || i.alt.trim() === '').length;
    const readingTime = Math.max(1, Math.round(wordCount / 225));
    const paragraphs = (p.content?.match(/\n\n/g) || []).length + 1;

    if (missingAlts === 0) score += 8;
    // +8 pts
    if (lazyPercent >= 90) score += 7      // +7 pts
    if (wordCount >= 1200) score += 10     // +10 pts
    if (paragraphs >= 15) score += 5       // +5 pts

    → max 100

    score = Math.min(100, Math.round(score));

    const forecast = score >= 95 ? 'Top 3 domination' :
                     score >= 85 ? 'Top 10 locked' :
                     score >= 70 ? 'Page 1 possible' : 'Needs work';

    return {
      score, title: p.title || '(no title)', titleLen, titleOk,
      desc: p.description || '(no desc)', descLen, descOk,
      h1: p.h1 || '(no h1)',
      wordCount, density, inFirst100, altPercent, anchorPercent,
      urlOk: p.url?.toLowerCase().includes(phrase.replace(/ /g,'-')),
      hasSchema: !!p.schema,
      totalImages: images.length,
      missingAlts, lazyPercent, readingTime, paragraphs,
      forecast, missingTo100: 100 - score
    };
 ；
  }

  function render(a) {
    scoreEl.textContent = a.score + '/100';
    if (a.score === 100) {
      fire.style.display = 'block';
      scoreEl.style.color = '#ff9500';
      scoreEl.style.textShadow = '0 0 30px #ff9500';
    }

    document.getElementById('titleInfo').innerHTML = `<strong>${a.title}</strong> (${a.titleLen} chars)`;
    document.getElementById('descInfo').innerHTML = `${a.desc.substring(0,120)}… (${a.descLen} chars)`;
    document.getElementById('h1Info').innerHTML = a.h1;
    document.getElementById('contentInfo').innerHTML = `${a.wordCount} words • ${a.density}% density`;
    document.getElementById('altInfo').innerHTML = `${a.altPercent}% images optimized`;
    document.getElementById('anchorInfo').innerHTML = `${a.anchorPercent}% phrase-rich anchors`;
    document.getElementById('urlSchemaInfo').innerHTML = `URL: ${a.urlOk ? 'Yes' : 'No'} | Schema: ${a.hasSchema ? 'Yes' : 'No'}`;

    document.getElementById('imagePro').innerHTML = `<h2>Image Optimization Pro</h2><p>${a.totalImages} images • ${a.missingAlts} missing alts • ${a.lazyPercent}% lazy-loaded</p><p class="fix">Fix alts + add loading="lazy"</p>`;
    document.getElementById('depthRadar').innerHTML = `<h2>Content Depth Radar</h2><p>${a.wordCount} words • ${a.readingTime} min • ${a.paragraphs} paragraphs</p><p class="fix">Add 2–3 new H2 sections if under 1200 words</p>`;
    document.getElementById('linkFlow').innerHTML = `<h2>Internal Link Flow</h2><p>${a.anchorPercent}% use exact phrase</p><p class="fix">Change "click here" → "<u>${phrase}</u>"</p>`;
    document.getElementById('forecastCard').innerHTML = `<h2>Predictive Rank Forecast</h2><p style="font-size:1.5rem"><strong>${a.forecast}</strong></p>${a.score<100?`<p>Missing <strong>${a.missingTo100} points</strong> to 100/100</p>`:'<p>PERFECTION ACHIEVED</p>'}`;
    document.getElementById('aiFixes').innerHTML = `<h2>AI Fix Prescription</h2><ul style="text-align:left">${a.missingAlts>0?'<li>Fix '+a.missingAlts+' missing alt texts</li>':''}${a.lazyPercent<90?'<li>Add loading="lazy" to images</li>':''}${a.wordCount<1200?'<li>Add '+(1200-a.wordCount)+' words</li>':''}${a.anchorPercent<30?'<li>Upgrade generic anchors</li>':'' || '<li>Perfect – nothing to fix!</li>'}</ul>`;
  }
});