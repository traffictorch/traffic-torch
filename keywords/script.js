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

    if (!url || !phrase) return alert('Enter URL + keyword phrase');

    try {
      const res = await fetch(`/api.php?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const page = await res.json();
      if (page.error) throw new Error(page.error);

      const analysis = analyze(page, phrase);
      render(analysis);
      results.classList.remove('hidden');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  function analyze(p, phrase) {
    let score = 0;
    const add = (pts, cond) => { if (cond) score += pts; };

    // === BASIC SCORING (same as before) ===
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
    const inFirst100 = words.slice(0, 100).join(' ').includes(phrase);
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

    add(10, p.url?.toLowerCase().includes(phrase.replace(/ /g, '-')));
    add(10, !!p.schema);

    // === NEW 2025 MODULES (BONUS POINTS) ===
    const lazyCount = images.filter(i => i.lazy === true).length;
    const lazyPercent = images.length ? Math.round(lazyCount / images.length * 100) : 0;
    const missingAlts = images.filter(i => !i.alt || i.alt.trim() === '').length;
    const readingTime = Math.max(1, Math.round(wordCount / 225));
    const paragraphs = (p.content?.match(/\n\s*\n/g) || []).length + 1;

    if (missingAlts === 0) score += 8;
    if (lazyPercent >= 90) score += 7;
    if (wordCount >= 1200) score += 10;
    if (paragraphs >= 15) score += 5;

    score = Math.min(100, Math.round(score));

    const forecast =
      score >= 95 ? 'Top 3 domination incoming' :
      score >= 85 ? 'Top 10 locked – just add links' :
      score >= 70 ? 'Page 1 possible' : 'Needs work – page 2+';

    return {
      score,
      title: p.title || '(no title)',
      titleLen, titleOk,
      desc: p.description || '(no desc)',
      descLen, descOk,
      h1: p.h1 || '(no h1)',
      wordCount,
      density,
      inFirst100,
      altPercent,
      anchorPercent,
      urlOk: p.url?.toLowerCase().includes(phrase.replace(/ /g, '-')),
      hasSchema: !!p.schema,
      // New modules
      totalImages: images.length,
      missingAlts,
      lazyPercent,
      readingTime,
      paragraphs,
      paragraphs,
      anchorPercent,
      forecast,
      missingTo100: 100 - score
    };
  }

  function render(a) {
    scoreEl.textContent = a.score + '/100';
    if (a.score === 100) {
      fire.style.display = 'block';
      scoreEl.style.color = '#ff9500';
      scoreEl.style.textShadow = '0 0 20px #ff9500';
    } else {
      fire.style.display = 'none';
    }

    // Basic cards (your original ones)
    document.getElementById('titleInfo').innerHTML = `<strong>${a.title}</strong> (${a.titleLen} chars)`;
    document.getElementById('descInfo').innerHTML = `${a.desc.substring(0,120)}… (${a.descLen} chars)`;
    document.getElementById('h1Info').innerHTML = a.h1;
    document.getElementById('contentInfo').innerHTML = `${a.wordCount.toLocaleString()} words • ${a.density}% density • First 100: ${a.inFirst100 ? 'Yes' : 'No'}`;
    document.getElementById('altInfo').innerHTML = `${a.altPercent}% images optimized`;
    document.getElementById('anchorInfo').innerHTML = `${a.anchorPercent}% phrase-rich anchors`;
    document.getElementById('urlSchemaInfo').innerHTML = `URL: ${a.urlOk ? 'Yes' : 'No'} | Schema: ${a.hasSchema ? 'Yes' : 'No'}`;

    // === NEW MODULES ===
    document.getElementById('imagePro').innerHTML = `
      <h2>Image Optimization Pro</h2>
      <p><strong>${a.totalImages}</strong> images • <strong>${a.missingAlts}</strong> missing alts • <strong>${a.lazyPercent}%</strong> lazy-loaded</p>
      <p class="fix">What: Fix missing alts + add loading="lazy"<br>Why: Google loves fast + accessible images in 2025<br>How: <code>alt="best wireless earbuds 2025 guide"</code> + <code>loading="lazy"</code></p>
    `;

    document.getElementById('depthRadar').innerHTML = `
      <h2>Content Depth Radar</h2>
      <p><strong>${a.wordCount.toLocaleString()}</strong> words • ${a.readingTime} min read • ${a.paragraphs} paragraphs</p>
      <p class="fix">What: Thin content loses in 2025<br>Why: 1200+ words + 15+ paragraphs wins featured snippets<br>How: Add 2–3 new H2 sections with 300–400 words each</p>
    `;

    document.getElementById('linkFlow').innerHTML = `
      <h2>Internal Link Flow</h2>
      <p><strong>${a.anchorPercent}%</strong> of internal links use exact phrase</p>
      <p class="fix">What: Generic anchors waste PageRank<br>Why: Phrase-rich anchors = massive authority boost<br>How: Change "click here" → "<u>best wireless earbuds 2025</u>"</p>
    `;

    document.getElementById('forecastCard').innerHTML = `
      <h2>Predictive Rank Forecast</h2>
      <p style="font-size:1.4rem;font-weight:bold;">${a.forecast}</p>
      ${a.score < 100 ? `<p>Missing <strong>${a.missingTo100} points</strong> to hit <span style="font-size:2rem;">100/100 Fire emoji</span></p>` : '<p style="font-size:2rem;">PERFECTION ACHIEVED Fire emoji Fire emoji Fire emoji</p>'}
    `;

    // AI Fix Prescription
    const issues = [];
    if (a.missingAlts > 0) issues.push(`Fix ${a.missingAlts} missing alt texts`);
    if (a.lazyPercent < 90) issues.push(`Add loading="lazy" to ${a.totalImages - images.filter(i=>i.lazy).length} images`);
    if (a.wordCount < 1200) issues.push(`Add ${1200 - a.wordCount} words`);
    if (a.anchorPercent < 30) issues.push(`Upgrade generic anchors`);

    document.getElementById('aiFixes').innerHTML = `
      <h2>AI Fix Prescription – One-Click Plan</h2>
      <ul style="text-align:left;line-height:1.8;">
        ${issues.map(i => `<li>${i}</li>`).join('') || '<li>Nothing to fix – you are perfect Fire emoji</li>'}
      </ul>
    `;
  }
});