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

    if (!url || !phrase) return alert('Enter URL and keyword');

    try {
      const res = await fetch(`/api.php?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Server error');

      const text = await res.text();
      if (!text.trim()) throw new Error('Empty response from api.php');

      const page = JSON.parse(text.trim());
      if (page.error) throw new Error(page.error);

      const analysis = analyze(page, phrase);
      render(analysis);
      results.classList.remove('hidden');
    } catch (err) {
      alert('API Error: ' + err.message);
    }
  });

  function analyze(p, phrase) {
    let score = 0;
    const add = (n, ok) => { if (ok) score += n; };

    add(15, p.title?.toLowerCase().includes(phrase) && p.title.length >= 50 && p.title.length <= 60);
    add(10, p.title?.toLowerCase().includes(phrase));
    add(10, p.description?.toLowerCase().includes(phrase) && p.description.length >= 150 && p.description.length <= 160);
    add(7,  p.description?.toLowerCase().includes(phrase));
    add(15, p.h1?.toLowerCase().includes(phrase));

    const words = p.content?.toLowerCase().split(/\s+/).filter(Boolean) || [];
    const wordCount = words.length;
    const matches = (p.content?.toLowerCase().match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const density = wordCount ? (matches / wordCount * 100).toFixed(1) : 0;

    add(10, wordCount >= 800);
    add(10, density >= 1 && density <= 2.5);
    add(8, words.slice(0,100).join(' ').includes(phrase));

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
    const lazy = images.filter(i => i.lazy).length;
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
      desc: p.description || '(no description)',
      h1: p.h1 || '(no h1)',
      wordCount,
      density,
      altPercent,
      anchorPercent,
      totalImages: images.length,
      missingAlts,
      lazyPercent,
      readingTime,
      paragraphs,
      forecast,
      missingTo100: 100 - score
    };
  }

  function render(a) {
    scoreEl.textContent = a.score + '/100';
    if (a.score === 100) {
      fire.style.display = 'block';
      scoreEl.style.color = '#ff9500';
      scoreEl.style.textShadow = '0 0 30px #ff9500';
    }

    document.getElementById('titleInfo').innerHTML = `<strong>${a.title}</strong>`;
    document.getElementById('descInfo').innerHTML = a.desc.substring(0,120) + '...';
    document.getElementById('h1Info').innerHTML = a.h1;
    document.getElementById('contentInfo').innerHTML = `${a.wordCount} words • ${a.density}%`;
    document.getElementById('altInfo').innerHTML = `${a.altPercent}% alt optimized`;
    document.getElementById('anchorInfo').innerHTML = `${a.anchorPercent}% phrase anchors`;

    document.getElementById('imagePro').innerHTML = `
      <h2>Image Optimization Pro</h2>
      <p>${a.totalImages} images • ${a.missingAlts} missing alts • ${a.lazyPercent}% lazy</p>`;

    document.getElementById('depthRadar').innerHTML = `
      <h2>Content Depth Radar</h2>
      <p>${a.wordCount} words • ${a.readingTime} min • ${a.paragraphs} paragraphs</p>`;

    document.getElementById('linkFlow').innerHTML = `
      <h2>Internal Link Flow</h2>
      <p>${a.anchorPercent}% use exact phrase</p>`;

    document.getElementById('forecastCard').innerHTML = `
      <h2>Predictive Rank Forecast</h2>
      <p><strong>${a.forecast}</strong></p>
      ${a.score < 100 ? `<p>Missing ${a.missingTo100} points to perfection</p>` : '<p>PERFECTION</p>'}`;

    document.getElementById('aiFixes').innerHTML = `
      <h2>AI Fix Prescription</h2>
      <ul style="text-align:left">
        ${a.missingAlts > 0 ? `<li>Fix ${a.missingAlts} missing alts</li>` : ''}
        ${a.lazyPercent < 90 ? '<li>Add loading="lazy"</li>' : ''}
        ${a.wordCount < 1200 ? `<li>Add ${1200 - a.wordCount} words</li>` : ''}
        ${a.anchorPercent < 30 ? '<li>Upgrade anchor text</li>' : ''}
        ${a.missingAlts === 0 && a.lazyPercent >= 90 && a.wordCount >= 1200 && a.anchorPercent >= 30 ? '<li>Perfect!</li>' : ''}
      </ul>`;
  }
});