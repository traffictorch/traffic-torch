document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('torchForm');
  const results = document.getElementById('results');
  const scoreEl = document.getElementById('finalScore');
  const fire = document.getElementById('fireEmoji');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    results.classList.add('hidden');
    scoreEl.textContent = '--';
    fire.style.display = 'none';

    const url = document.getElementById('pageUrl').value.trim();
    const phrase = document.getElementById('targetPhrase').value.trim().toLowerCase();

    if (!url || !phrase) return alert('Please enter both URL and keyword phrase');

    try {
      const res = await fetch(`/api.php?url=${encodeURIComponent(url)}&t=${Date.now()}`);
      const text = await res.text();

      // Remove any <?php ... ?> garbage that your api.php sometimes adds
      const clean = text.trim().replace(/^<\?php[\s\S]*?\?>\s*/i, '').trim();
      const page = JSON.parse(clean);

      if (page.error) throw new Error(page.error);

      const analysis = analyze(page, phrase);
      render(analysis);
      results.classList.remove('hidden');
    } catch (err) {
      alert('Error: ' + err.message);
      console.log('Raw API response →', text ?? '(empty)');
    }
  });

  function analyze(p, phrase) {
    let score = 0;
    const add = (pts, ok) => { if (ok) score += pts; };

    // Basic scoring
    add(15, p.title?.toLowerCase().includes(phrase) && p.title.length >= 50 && p.title.length <= 60);
    add(10, p.title?.toLowerCase().includes(phrase));
    add(10, p.description?.toLowerCase().includes(phrase) && p.description.length >= 150 && p.description.length <= 160);
    add(7,  p.description?.toLowerCase().includes(phrase));
    add(15, p.h1?.toLowerCase().includes(phrase));

    const words = p.content?.toLowerCase().split(/\s+/).filter(Boolean) || [];
    const wordCount = words.length;
    const exactMatches = (p.content?.toLowerCase().match(new RegExp(phrase, 'g')) || []).length;
    const density = wordCount ? (exactMatches / wordCount * 100).toFixed(1) : 0;
    add(10, wordCount >= 800);
    add(10, density >= 1 && density <= 2.5);
    add(8,  words.slice(0,100).join(' ').includes(phrase));

    const images = p.images || [];
    const goodAlts = images.filter(i => i.alt?.toLowerCase().includes(phrase)).length;
    const altPercent = images.length ? Math.round(goodAlts / images.length * 100) : 0;
    add(10, altPercent >= 50);

    const internal = p.links?.filter(l => l.isInternal && l.text) || [];
    const goodAnchors = internal.filter(l => l.text.toLowerCase().includes(phrase)).length;
    const anchorPercent = internal.length ? Math.round(goodAnchors / internal.length * 100) : 0;
    add(10, anchorPercent >= 30);

    add(10, p.url?.toLowerCase().includes(phrase.replace(/ /g,'-')));
    add(10, !!p.schema);

    // 2025 Bonus Modules
    const lazy = images.filter(i => i.lazy === true).length;
    const lazyPercent = images.length ? Math.round(lazy / images.length * 100) : 0;
    const missingAlts = images.filter(i => !i.alt?.trim()).length;
    const readingTime = Math.max(1, Math.round(wordCount / 225));
    const paragraphs = (p.content?.match(/\n\n/g) || []).length + 1;

    if (missingAlts === 0) score += 8;
    if (lazyPercent >= 90) score += 7;
    if (wordCount >= 1200) score += 10;
    if (paragraphs >= 15) score += 5;

    score = Math.min(100, Math.round(score));

    const forecast = score >= 95 ? 'Top 3 domination' :
                     score >= 85 ? 'Top 10 locked' :
                     score >= 70 ? 'Page 1 possible' : 'Needs work';

    return {
      score,
      title: p.title || '(no title)',
      titleLen: p.title?.length || 0,
      desc: p.description || '(no description)',
      descLen: p.description?.length || 0,
      h1: p.h1 || '(no h1)',
      wordCount, density, inFirst100: words.slice(0,100).join(' ').includes(phrase),
      altPercent, anchorPercent,
      urlOk: p.url?.toLowerCase().includes(phrase.replace(/ /g,'-')),
      hasSchema: !!p.schema,
      totalImages: images.length,
      missingAlts, lazyPercent, readingTime, paragraphs,
      forecast, missingTo100: 100 - score
    };
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
    document.getElementById('contentInfo').innerHTML = `${a.wordCount.toLocaleString()} words • ${a.density}% density`;
    document.getElementById('altInfo').innerHTML = `${a.altPercent}% images optimized`;
    document.getElementById('anchorInfo').innerHTML = `${a.anchorPercent}% phrase-rich anchors`;
    document.getElementById('urlSchemaInfo').innerHTML = `URL: ${a.urlOk ? 'Yes' : 'No'} | Schema: ${a.hasSchema ? 'Yes' : 'No'}`;

    document.getElementById('imagePro').innerHTML = `
      <h2>Image Optimization Pro</h2>
      <p>${a.totalImages} images • ${a.missingAlts} missing alts • ${a.lazyPercent}% lazy-loaded</p>
      <p class="fix">Add alt text + loading="lazy" to every image</p>`;

    document.getElementById('depthRadar').innerHTML = `
      <h2>Content Depth Radar</h2>
      <p>${a.wordCount.toLocaleString()} words • ${a.readingTime} min read • ${a.paragraphs} paragraphs</p>
      <p class="fix">Aim for 1200+ words & 15+ paragraphs</p>`;

    document.getElementById('linkFlow').innerHTML = `
      <h2>Internal Link Flow</h2>
      <p>${a.anchorPercent}% use exact phrase</p>
      <p class="fix">Replace "click here" with your keyword</p>`;

    document.getElementById('forecastCard').innerHTML = `
      <h2>Predictive Rank Forecast</h2>
      <p style="font-size:1.5rem><strong>${a.forecast}</strong></p>
      ${a.score<100 ? `<p>Missing <strong>${a.missingTo100}</strong> points to perfection</p>` : '<p>PERFECTION ACHIEVED</p>'}`;

    document.getElementById('aiFixes').innerHTML = `
      <h2>AI Fix Prescription</h2>
      <ul style="text-align:left">
        ${a.missingAlts > 0 ? `<li>Fix ${a.missingAlts} missing alt texts</li>` : ''}
        ${a.lazyPercent < 90 ? '<li>Add loading="lazy" to images</li>' : ''}
        ${a.wordCount < 1200 ? `<li>Add ${1200-a.wordCount} more words</li>` : ''}
        ${a.anchorPercent < 30 ? '<li>Upgrade generic anchor text</li>' : ''}
        ${a.missingAlts===0 && a.lazyPercent>=90 && a.wordCount>=1200 && a.anchorPercent>=30 ? '<li>Perfect – nothing to fix!</li>' : ''}
      </ul>`;
  }
});