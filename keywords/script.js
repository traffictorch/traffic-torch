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

    try {
      const res = await fetch('/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

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
    const add = (points, condition) => { if (condition) score += points; };

    // Title
    const titleOk = p.title?.toLowerCase().includes(phrase);
    const titleLen = p.title?.length || 0;
    add(15, titleOk && titleLen >= 50 && titleLen <= 60);
    add(10, titleOk);

    // Description
    const descOk = p.description?.toLowerCase().includes(phrase);
    const descLen = p.description?.length || 0;
    add(10, descOk && descLen >= 150 && descLen <= 160);
    add(7, descOk);

    // H1
    add(15, p.h1?.toLowerCase().includes(phrase));

    // Content
    const words = p.content?.toLowerCase().split(/\s+/).filter(w => w) || [];
    const count = words.length;
    const exactCount = (p.content?.toLowerCase().match(new RegExp(phrase, 'g')) || []).length;
    const density = count ? (exactCount / count * 100).toFixed(1) : 0;
    const inFirst100 = words.slice(0,100).join(' ').includes(phrase);
    add(10, count >= 800);
    add(10, density >= 1 && density <= 2.5);
    add(8, inFirst100);

    // Images
    const imgWithPhrase = p.images?.filter(i => i.alt?.toLowerCase().includes(phrase)).length || 0;
    const imgTotal = p.images?.length || 0;
    const altPercent = imgTotal ? Math.round(imgWithPhrase / imgTotal * 100) : 0;
    add(10, altPercent >= 50);

    // Anchors
    const internal = p.links?.filter(l => l.isInternal && l.text) || [];
    const goodAnchor = internal.filter(l => l.text.toLowerCase().includes(phrase)).length;
    const anchorPercent = internal.length ? Math.round(goodAnchor / internal.length * 100) : 0;
    add(10, anchorPercent >= 30);

    // URL + Schema
    add(10, p.url?.toLowerCase().includes(phrase.replace(/ /g,'-')));
    add(10, !!p.schema);

    score = Math.min(100, Math.round(score));

    return {
      score,
      title: p.title || '(missing)',
      titleLen, titleOk,
      desc: p.description || '(missing)',
      descLen, descOk,
      h1: p.h1 || '(missing)',
      wordCount: count,
      density,
      inFirst100,
      altPercent,
      anchorPercent,
      urlOk: p.url?.toLowerCase().includes(phrase.replace(/ /g,'-')),
      hasSchema: !!p.schema
    };
  }

  function render(a) {
    scoreEl.textContent = a.score + '/100';
    if (a.score === 100) fire.style.display = 'block';

    document.getElementById('titleInfo').innerHTML = `<strong>${a.title}</strong> (${a.titleLen} chars) → ${a.titleOk ? 'Perfect' : 'Missing phrase'}`;
    document.getElementById('descInfo').innerHTML = `${a.desc.substring(0,120)}… (${a.descLen} chars) → ${a.descOk ? 'Perfect' : 'Missing phrase'}`;
    document.getElementById('h1Info').innerHTML = a.h1;
    document.getElementById('contentInfo').innerHTML = `${a.wordCount.toLocaleString()} words | ${a.density}% density | First 100 words: ${a.inFirst100 ? 'Yes' : 'No'}`;
    document.getElementById('altInfo').innerHTML = `${a.altPercent}% of images have phrase in alt`;
    document.getElementById('anchorInfo').innerHTML = `${a.anchorPercent}% of internal anchors use phrase`;
    document.getElementById('urlSchemaInfo').innerHTML = `URL: ${a.urlOk ? 'Yes' : 'No'} | Schema: ${a.hasSchema ? 'Detected' : 'Missing'}`;
  }
});