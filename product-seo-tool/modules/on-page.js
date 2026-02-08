  function analyzeOnPageSEO(doc, data) {
    let details = {};
    let primaryKeyword = '';
    const h1Text = doc.querySelector('h1')?.textContent?.trim().toLowerCase() || '';
    const titleText = doc.title.trim().toLowerCase();
    if (h1Text.length > 10) {
      primaryKeyword = h1Text.split(' ').slice(0, 4).join(' ');
    } else if (titleText.length > 10) {
      const parts = titleText.split(/[\|\-–—]/)[0].trim().split(' ');
      primaryKeyword = parts.slice(0, 4).join(' ');
    } else {
      const urlObj = new URL(data.url);
      const slug = urlObj.pathname.split('/').filter(Boolean).pop() || '';
      primaryKeyword = slug.replace(/[-_]/g, ' ').replace(/\d{4,}/g, '').trim();
      if (primaryKeyword.length < 5) primaryKeyword = 'product';
    }
    const stopWords = /^(the|a|an|best|top|new|buy|shop|order|free|sale|online|free shipping|with|for|and|in|at|to|of)$/i;
    primaryKeyword = primaryKeyword.replace(stopWords, '').trim().replace(stopWords, '').trim();
    const keywordRegex = new RegExp('\\b' + primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');

    let titleScore = 0;
    const title = doc.title.trim();
    const titleLength = title.length;
    if (titleLength >= 50 && titleLength <= 60) titleScore += 50;
    else if (titleLength >= 40 && titleLength <= 70) titleScore += 35;
    else if (titleLength >= 30 && titleLength <= 80) titleScore += 20;
    else titleScore += 5;
    const separatorRegex = /[\|\-–—]/;
    if (separatorRegex.test(title)) titleScore += 20;
    if (keywordRegex.test(title.toLowerCase())) titleScore += 30;
    titleScore = Math.min(100, titleScore);
    details.title = { length: titleLength, hasSeparator: separatorRegex.test(title), hasKeyword: keywordRegex.test(title.toLowerCase()), score: titleScore };

    let descScore = 0;
    const metaDesc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
    const descLength = metaDesc.length;
    if (descLength >= 120 && descLength <= 160) descScore += 45;
    else if (descLength >= 100 && descLength <= 170) descScore += 35;
    else if (descLength > 0) descScore += 15;
    if (/buy|shop|add to cart|purchase|order|view|learn more|discover/i.test(metaDesc.toLowerCase())) descScore += 25;
    if (keywordRegex.test(metaDesc.toLowerCase())) descScore += 30;
    descScore = Math.min(100, descScore);
    details.metaDescription = { length: descLength, hasCta: /buy|shop|add to/i.test(metaDesc.toLowerCase()), hasKeyword: keywordRegex.test(metaDesc.toLowerCase()), score: descScore };

    let headingScore = 0;
    const h1s = doc.querySelectorAll('h1');
    const h2s = doc.querySelectorAll('h2');
    if (h1s.length === 1) headingScore += 45;
    else if (h1s.length === 0) headingScore += 20;
    else headingScore += 10;
    if (h2s.length >= 2) headingScore += 25;
    if (data.headingCount >= 5) headingScore += 30;
    headingScore = Math.min(100, headingScore);
    details.headings = { h1Count: h1s.length, h2Count: h2s.length, total: data.headingCount, score: headingScore };

    let urlScore = 0;
    const urlObj = new URL(data.url);
    const path = urlObj.pathname;
    if (!path.includes('?') && !path.includes('&') && !path.includes(';')) urlScore += 40;
    if (path.split('/').length <= 5) urlScore += 30;
    if (path.length > 15 && !/\d{8,}/.test(path)) urlScore += 30;
    urlScore = Math.min(100, urlScore);
    details.url = { clean: !path.includes('?'), segments: path.split('/').length, length: path.length, score: urlScore };

    // ────────────────────────────────────────────────
    // KEYWORD OPTIMIZATION (modernized scoring)
    // ────────────────────────────────────────────────
    let keywordScore = 0;
    const keywordRegexKw = new RegExp('\\b' + primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');

    const titleHasKeyword = keywordRegexKw.test(doc.title.toLowerCase());
    const h1HasKeyword = keywordRegexKw.test((doc.querySelector('h1')?.textContent || '').toLowerCase());

    if (titleHasKeyword) keywordScore += 25;
    if (h1HasKeyword) keywordScore += 25;

    const firstText = data.fullText.toLowerCase();
    const firstKeywordPos = firstText.search(keywordRegexKw);

    let frontLoadBonus = 0;
    if (firstKeywordPos !== -1) {
      if (firstKeywordPos < 150) frontLoadBonus = 25;
      else if (firstKeywordPos < 300) frontLoadBonus = 18;
      else if (firstKeywordPos < 600) frontLoadBonus = 10;
      else if (firstKeywordPos < 1000) frontLoadBonus = 5;
    }
    keywordScore += frontLoadBonus;

    if (data.wordCount > 600 && keywordScore < 60 && frontLoadBonus < 10) {
      const totalCount = (firstText.match(keywordRegexKw) || []).length;
      if (totalCount >= 3) keywordScore += 8;
    }

    const headingsText = Array.from(doc.querySelectorAll('h2,h3,h4,h5,h6'))
      .map(h => h.textContent?.toLowerCase() || '')
      .join(' ');
    const headingsCount = (headingsText.match(keywordRegexKw) || []).length;
    if (headingsCount >= 2) keywordScore += 15;
    else if (headingsCount === 1) keywordScore += 8;

    const keywordCount = (firstText.match(keywordRegexKw) || []).length;
    const density = data.wordCount > 0 ? (keywordCount / data.wordCount) * 100 : 0;

    if (keywordCount >= 4) keywordScore += 12;
    else if (keywordCount >= 2) keywordScore += 8;
    else if (keywordCount >= 1) keywordScore += 4;

    if (density > 5) keywordScore -= 12;
    else if (density > 4) keywordScore -= 8;

    const relatedTerms = ['review', 'price', 'buy', 'features', 'specification', 'material', 'color', 'size', 'brand', 'model'];
    const hasRelated = relatedTerms.some(term => firstText.includes(term));
    if (hasRelated && keywordCount > 0) keywordScore += 10;

    keywordScore = Math.min(100, Math.max(0, keywordScore));

    details.keywords = {
      primaryKeyword,
      count: keywordCount,
      density: Math.round(density * 10) / 10,
      firstOccurrenceChars: firstKeywordPos !== -1 ? firstKeywordPos : 'not found',
      frontLoadBonus,
      inTitle: titleHasKeyword,
      inH1: h1HasKeyword,
      inHeadings: headingsCount,
      hasRelatedTerms: hasRelated,
      score: keywordScore
    };
    // ────────────────────────────────────────────────

    const score = Math.round(
      titleScore * 0.30 +
      descScore * 0.20 +
      headingScore * 0.20 +
      urlScore * 0.15 +
      keywordScore * 0.15
    );
    return { score: Math.min(100, Math.max(0, score)), details };
  }