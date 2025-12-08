// script.js - Keyword Torch (Single URL Mode)
// Traffic Torch – Instant 360° SEO & UX Health Score

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('torchForm');
  const results = document.getElementById('results');
  const scoreDisplay = document.getElementById('finalScore');
  const fireEmoji = document.getElementById('fireEmoji');

  // Ideal benchmarks for perfect optimization
  const IDEAL = {
    titleLength: { min: 50, max: 60 },
    descriptionLength: { min: 150, max: 160 },
    h1ContainsPhrase: true,
    h1Length: { min: 20, max: 70 },
    contentWordCount: 800, // ideal minimum for most niches
    phraseInFirst100: true,
    phraseDensity: { min: 1.0, max: 2.5 }, // %
    altContainsPhrase: 0.5, // 50% of images
    internalAnchorsWithPhrase: 0.3, // 30% of internal links
    urlContainsPhrase: true,
    schemaDetected: true
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    results.classList.remove('visible');
    scoreDisplay.textContent = '--';
    fireEmoji.style.display = 'none';

    const url = document.getElementById('pageUrl').value.trim();
    const phrase = document.getElementById('targetPhrase').value.trim().toLowerCase();

    if (!url || !phrase) {
      alert('Please enter both URL and target keyword phrase');
      return;
    }

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const analysis = analyzePage(data, phrase);
      renderResults(analysis, phrase);
      results.classList.add('visible');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  function analyzePage(page, phrase) {
    const words = page.content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const phraseWords = phrase.split(' ');
    const exactPhrase = phrase;
    const containsExact = page.content.toLowerCase().includes(exactPhrase);
    const first100Words = words.slice(0, 100).join(' ');
    const inFirst100 = first100Words.includes(exactPhrase);

    // Count exact phrase occurrences
    let phraseCount = 0;
    let idx = page.content.toLowerCase().indexOf(exactPhrase);
    while (idx !== -1) {
      phraseCount++;
      idx = page.content.toLowerCase().indexOf(exactPhrase, idx + 1);
    }
    const density = wordCount > 0 ? (phraseCount / wordCount) * 100 : 0;

    // Image alts
    const altCount = page.images.filter(img => 
      img.alt && img.alt.toLowerCase().includes(phrase)
    ).length;
    const altRatio = page.images.length > 0 ? altCount / page.images.length : 0;

    // Internal anchor text
    const internalAnchors = page.links.filter(l => l.isInternal && l.text);
    const anchorWithPhrase = internalAnchors.filter(a => 
      a.text.toLowerCase().includes(phrase)
    ).length;
    const anchorRatio = internalAnchors.length > 0 ? anchorWithPhrase.length / internalAnchors.length : 0;

    // Scoring engine (0–100)
    let score = 0;

    // 1. Meta Title (15pts)
    const titleLen = page.title.length;
    if (page.title.toLowerCase().includes(phrase)) score += 10;
    if (titleLen >= IDEAL.titleLength.min && titleLen <= IDEAL.titleLength.max) score += 5;

    // 2. Meta Description (10pts)
    const descLen = page.description.length;
    if (page.description.toLowerCase().includes(phrase)) score += 7;
    if (descLen >= IDEAL.descriptionLength.min && descLen <= IDEAL.descriptionLength.max) score += 3;

    // 3. H1 (15pts)
    if (page.h1 && page.h1.toLowerCase().includes(phrase)) score += 12;
    if (page.h1 && page.h1.length >= IDEAL.h1Length.min && page.h1.length <= IDEAL.h1Length.max) score += 3;

    // 4. Content Density & Placement (25pts)
    if (containsExact) score += 8;
    if (inFirst100) score += 8;
    if (wordCount >= IDEAL.contentWordCount) score += 5;
    if (density >= IDEAL.phraseDensity.min && density <= IDEAL.phraseDensity.max) score += 4;

    // 5. Image Alts (10pts)
    score += Math.min(10, altRatio * 20); // 50% = full 10pts

    // 6. Anchor Text + URL + Schema (25pts)
    if (page.url.toLowerCase().includes(phrase.replace(/ /g, '-'))) score += 8;
    if (anchorRatio >= IDEAL.internalAnchorsWithPhrase) score += 7;
    if (page.schema) score += 10;

    score = Math.round(score);

    return {
      score,
      title: page.title,
      titleLen,
      description: page.description,
      descLen,
      h1: page.h1 || '(none)',
      wordCount,
      density: density.toFixed(2),
      containsExact,
      inFirst100,
      images: page.images,
      altRatio: (altRatio * 100).toFixed(0),
      internalAnchors: internalAnchors.length,
      anchorRatio: (anchorRatio * 100).toFixed(0),
      url: page.url,
      schema: !!page.schema,
      phrase
    };
  }

  function renderResults(data, phrase) {
    // Final Score
    scoreDisplay.textContent = data.score + '/100';
    if (data.score === 100) {
      fireEmoji.style.display = 'inline-block';
      scoreDisplay.style.color = '#ff9500';
      scoreDisplay.style.textShadow = '0 0 20px #ff9500';
    } else {
      fireEmoji.style.display = 'none';
      scoreDisplay.style.color = '';
      scoreDisplay.style.textShadow = '';
    }

    // Module 1: Meta Tags
    document.getElementById('yourTitle').textContent = data.title || '(empty)';
    document.getElementById('yourTitleLen').textContent = data.titleLen + ' chars';
    document.getElementById('yourTitleLen').style.color = 
      data.titleLen >= 50 && data.titleLen <= 60 ? '#00ff00' : '#ff4444';

    document.getElementById('yourDesc').textContent = data.description || '(empty)';
    document.getElementById('yourDescLen').textContent = data.descLen + ' chars';
    document.getElementById('yourDescLen').style.color = 
      data.descLen >= 150 && data.descLen <= 160 ? '#00ff00' : '#ff4444';

    // Module 2: H1
    document.getElementById('yourH1').textContent = data.h1;
    document.getElementById('yourH1').style.color = 
      data.h1 && data.h1.toLowerCase().includes(phrase) ? '#00ff00' : '#ff4444';

    // Module 3: Content Density
    document.getElementById('yourWordCount').textContent = data.wordCount.toLocaleString();
    document.getElementById('yourWordCount').style.color = data.wordCount >= 800 ? '#00ff00' : '#ff9500';

    document.getElementById('yourDensity').textContent = data.density + '%';
    document.getElementById('yourDensity').style.color = 
      data.density >= 1.0 && data.density <= 2.5 ? '#00ff00' : '#ff4444';

    document.getElementById('yourFirst100').innerHTML = data.inFirst100 
      ? 'Yes 🔥' : 'No';

    // Module 4: Image Alts
    document.getElementById('yourAltRatio').textContent = data.altRatio + '%';
    document.getElementById('yourAltRatio').style.color = 
      data.altRatio >= 50 ? '#00ff00' : '#ff9500';

    // Module 5: Internal Anchors
    document.getElementById('yourAnchorRatio').textContent = data.anchorRatio + '%';
    document.getElementById('yourAnchorRatio').style.color = 
      parseFloat(data.anchorRatio) >= 30 ? '#00ff00' : '#ff9500';

    // Module 6: URL & Schema
    const urlContains = data.url.toLowerCase().includes(phrase.replace(/ /g, '-'));
    document.getElementById('yourUrl').innerHTML = urlContains ? 'Yes 🔥' : 'No';

    document.getElementById('yourSchema').innerHTML = data.schema ? 'Detected 🔥' : 'Missing';
  }
});