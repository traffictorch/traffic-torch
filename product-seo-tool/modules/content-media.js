  function analyzeContentMedia(doc, data) {
    let details = {};
    let descScore = 20;
    if (data.wordCount >= 500) descScore = 90;
    else if (data.wordCount >= 300) descScore = 75;
    else if (data.wordCount >= 200) descScore = 55;
    else if (data.wordCount >= 100) descScore = 35;
    else descScore = 15;
    const hasStructure = doc.querySelectorAll('h2,h3,ul,ol').length >= 3;
    if (hasStructure) descScore += 15;
    descScore = Math.min(100, descScore);
    details.description = { wordCount: data.wordCount, hasStructure, score: descScore };

    let imgScore = 30;
    const { missingCount, filenameOnlyCount, goodCount, meaningfulCount, decorativeCount, totalImages } = data.altData;
    if (totalImages === 0) {
      imgScore = 40;
    } else if (meaningfulCount === 0) {
      imgScore = 70;
    } else {
      const badCount = missingCount + filenameOnlyCount;
      const altQualityRatio = goodCount / meaningfulCount;
      const badRatio = badCount / meaningfulCount;
      if (altQualityRatio >= 0.8 || badRatio <= 0.1) {
        imgScore = 90;
      } else if (altQualityRatio >= 0.5 || badRatio <= 0.3) {
        imgScore = 75;
      } else if (altQualityRatio >= 0.2 || badRatio <= 0.6) {
        imgScore = 50;
      } else {
        imgScore = 25;
      }
      if (decorativeCount > meaningfulCount * 2) imgScore += 10;
      imgScore = Math.min(100, imgScore);
    }
    details.images = {
      missingAlt: missingCount,
      filenameOnly: filenameOnlyCount,
      goodDescriptive: goodCount,
      meaningful: meaningfulCount,
      decorativeIgnored: decorativeCount,
      total: totalImages,
      score: imgScore
    };

    const videoElements = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="youtu.be"]');
    let videoScore = videoElements.length > 0 ? 50 : 25;
    if (videoElements.length > 0 && doc.querySelector('track')) videoScore += 30;
    if (videoElements.length > 1) videoScore += 10;
    videoScore = Math.min(100, videoScore);
    details.video = { present: videoElements.length > 0, captions: !!doc.querySelector('track'), count: videoElements.length, score: videoScore };

    // UGC / Reviews
    const selectors = [
      '.reviews', '.product-reviews', '#reviews', '.rating', '.customer-reviews',
      '.product-rating', '.reviews-section', '.review-widget', '.ratings-reviews',
      '.yotpo', '.judge-me', '.loox', '.stamped', '.trustpilot-widget', '.okendo',
      '.rivyo', '.growave', '.ali-reviews', '.seal-subscriptions', '.power-reviews',
      '.bazaarvoice', '.reevo', '.reviews.io', '.endorsal', '.shoppable',
      '[itemprop="aggregateRating"]', '[itemprop="review"]', '[itemscope][itemtype*="Review"]',
      '[data-rating]', '[data-average-rating]', '[aria-label*="star rating"]',
      '.woocommerce-product-rating', '.spr-reviews', '.shopify-section--product-reviews',
      '.product-single__reviews', '.rating-stars', '.star-rating', '.product-reviews__container',
      '.review-summary', '.aggregate-rating', '.rating-summary'
    ];
    const hasVisibleUGC = selectors.some(sel => doc.querySelector(sel));

    const schemas = extractProductSchema(doc);
    let hasSchemaUGC = false;
    schemas.forEach(s => {
      if (s.aggregateRating && typeof s.aggregateRating.ratingValue === 'number' &&
          s.aggregateRating.ratingValue > 0 &&
          (s.aggregateRating.reviewCount > 0 || s.aggregateRating.ratingCount > 0)) {
        hasSchemaUGC = true;
      }
    });

    let ugcScore = 20;
    if (hasVisibleUGC && hasSchemaUGC) ugcScore = 90;
    else if (hasSchemaUGC) ugcScore = 75;
    else if (hasVisibleUGC) ugcScore = 60;

    details.ugc = { detected: hasVisibleUGC || hasSchemaUGC, score: ugcScore };

    let linkScore = 20;
    if (data.linkCount >= 8) linkScore = 85;
    else if (data.linkCount >= 5) linkScore = 70;
    else if (data.linkCount >= 3) linkScore = 50;
    else linkScore = 25;
    details.internalLinks = { count: data.linkCount, score: linkScore };

    const breadcrumbSelectors = '[aria-label*="breadcrumb" i], .breadcrumbs, .breadcrumb, .woocommerce-breadcrumb, .yoast-breadcrumb, .site-breadcrumb, .bread-crumb, .crumbs, .pathway, [itemprop="breadcrumb"]';
    const hasBreadcrumbs = !!doc.querySelector(breadcrumbSelectors);
    let breadcrumbScore = hasBreadcrumbs ? 90 : 30;
    details.breadcrumbs = { present: hasBreadcrumbs, score: breadcrumbScore };

    const score = Math.round(
      descScore * 0.30 +
      imgScore * 0.25 +
      videoScore * 0.10 +
      ugcScore * 0.15 +
      linkScore * 0.10 +
      breadcrumbScore * 0.10
    );
    return { score: Math.min(100, Math.max(0, score)), details };
  }
  
    export { analyzeContentMedia };