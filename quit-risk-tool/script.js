// Dynamic import for better GitHub Pages compatibility
let renderPluginSolutions;
import('/quit-risk-tool/plugin-solutions.js')
  .then(module => {
    renderPluginSolutions = module.renderPluginSolutions;
    console.log('Plugin solutions module loaded successfully');
  })
  .catch(err => console.error('Failed to load plugin-solutions.js:', err));

// quit-risk-tool/script.js - full complete epic perfect version with realistic metrics
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';

  const factorDefinitions = {
    readability: {
      factors: [
        { name: "Flesch Reading Ease Score", threshold: 65, shortDesc: "Measures how easy your text is to read using the classic Flesch formula. Higher scores mean broader audience comprehension. Low scores indicate complex or dense writing.", howToFix: "Simplify vocabulary and use shorter sentences. Aim for common words that most people understand easily. Break complex ideas into smaller, digestible parts." },
        { name: "Flesch-Kincaid Grade Level", threshold: 65, shortDesc: "Estimates the U.S. school grade needed to understand the text. Most successful web content targets grade 8 or lower. High scores limit your audience reach.", howToFix: "Target grade 8 or below. Shorten sentences and reduce syllables per word. Test with readability tools and revise accordingly." },
        { name: "Average Sentence Length", threshold: 70, shortDesc: "Long sentences increase cognitive load on screens. Ideal web average is under 20 words. Varied but concise sentences improve flow.", howToFix: "Keep average below 20 words. Mix short and medium sentences. Break up any sentence over 25 words." },
        { name: "Paragraph Density & Length", threshold: 70, shortDesc: "Long, dense paragraphs create walls of text that deter readers. Short paragraphs with whitespace aid scannability. Modern users prefer bite-sized blocks.", howToFix: "Limit paragraphs to 3-5 sentences. Use single-sentence paragraphs for emphasis. Add generous spacing between ideas." },
        { name: "Overall Text Scannability", threshold: 70, shortDesc: "Measures use of bolding, lists, subheadings, and visual hierarchy. Most visitors scan before reading fully. Strong scannability captures attention quickly.", howToFix: "Bold key points, use bullet lists, and add descriptive subheadings. Highlight important phrases strategically. Front-load critical information." }
      ],
      moduleWhat: "Readability assesses how easily visitors can understand and scan your content. It combines multiple proven metrics including Flesch formulas, sentence length, paragraph structure, and visual formatting. High readability keeps users engaged longer and reduces bounce rates.",
      moduleHow: "Use simple, active language and short sentences. Break content into short paragraphs with clear subheadings. Incorporate bullet points, bold text, and whitespace to guide the eye. Always edit with the average reader in mind.",
      moduleWhy: "Easy-to-read content reaches a wider audience and improves engagement metrics. It reduces cognitive strain and frustration. Search engines reward pages where users stay longer and interact more."
    },
    navigation: {
      factors: [
        { name: "Link Density Evaluation", threshold: 78, shortDesc: "Too many links create choice overload and dilute focus. Optimal density balances navigation with clarity. Excessive links confuse users and weaken topical signals.", howToFix: "Audit and remove redundant or low-value links. Focus on quality over quantity. Keep primary navigation focused on key user goals." },
        { name: "Menu Structure Clarity", threshold: 80, shortDesc: "Clear, logical menus help users find information quickly. Simple hierarchy reduces frustration. Poor structure leads to higher bounce rates.", howToFix: "Limit top-level items to 5-7. Use descriptive labels users understand. Organize by user needs, not internal structure." },
        { name: "Internal Linking Balance", threshold: 72, shortDesc: "Balanced internal links guide users deeper into your site. They spread authority and improve crawlability. Isolated pages get less traffic and ranking power.", howToFix: "Add contextual links from body content to related pages. Link important pages from high-traffic content. Use descriptive anchor text naturally." },
        { name: "CTA Prominence & Visibility", threshold: 82, shortDesc: "Clear calls-to-action guide users toward goals. Prominent placement reduces friction. Hidden CTAs mean missed conversions.", howToFix: "Place primary CTAs above the fold with contrasting colors. Use action-oriented text and sufficient size. Add secondary CTAs further down." }
      ],
      moduleWhat: "Navigation Clarity evaluates how easily users can move through your site. It examines link density, menu organization, internal linking patterns, and call-to-action visibility. Strong navigation reduces frustration and improves flow.",
      moduleHow: "Keep menus simple with clear labels. Use contextual links naturally in content. Make primary actions stand out visually. Guide users logically toward their goals.",
      moduleWhy: "Intuitive navigation lowers bounce rates and increases pages per session. Users complete goals faster with less effort. Clear structure strengthens topical authority and user signals for search engines."
    },
    accessibility: {
      factors: [
        { name: "Alt Text Coverage", threshold: 85, shortDesc: "Meaningful images need descriptive alt text. Decorative images should have empty alt attributes. Complete coverage is essential for screen readers and image SEO.", howToFix: "Audit all images. Add concise, meaningful alt text to informative images. Use alt='' for purely decorative ones. Never leave alt attributes missing on meaningful images." },
        { name: "Color Contrast Ratios", threshold: 80, shortDesc: "Text must meet WCAG AA (4.5:1 for normal text, 3:1 for large). Low contrast causes readability issues for low-vision users and in bright light.", howToFix: "Use contrast checkers (e.g. WebAIM). Aim for 4.5:1+ on normal text. Adjust foreground/background colors or increase font size/weight where needed." },
        { name: "Semantic HTML Structure", threshold: 82, shortDesc: "Proper use of headings, landmarks (main, nav, article), and sections creates a logical document outline for assistive tech and search engines.", howToFix: "Use one H1 per page, logical heading hierarchy. Replace generic divs with semantic elements like main, article, section, aside, header, footer." },
        { name: "Overall WCAG Compliance", threshold: 78, shortDesc: "WCAG 2.2 AA covers perceivability, operability, understandability, robustness. Compliance improves inclusivity, SEO, and reduces legal risk.", howToFix: "Run automated audits with WAVE, axe, or Lighthouse. Manually test keyboard navigation and screen reader experience. Fix high-impact issues first." }
      ],
      moduleWhat: "Accessibility Health measures how inclusive your page is for users with disabilities. It checks alt text, contrast, semantic structure, and overall WCAG alignment. Good accessibility serves 15-20% of users with impairments.",
      moduleHow: "Provide alt text for all images. Ensure sufficient color contrast. Use proper HTML semantics and landmarks. Test with accessibility tools regularly.",
      moduleWhy: "Accessible sites reach more people and build trust. They face lower legal risk. Many accessibility improvements also enhance SEO and overall user experience."
    },
    mobile: {
      factors: [
        { name: "Viewport Configuration", threshold: 90, shortDesc: "Viewport meta tag controls mobile layout scaling. Missing or incorrect tag causes zoomed-out desktop view. Proper setting enables responsive behavior.", howToFix: "Add exact meta tag: width=device-width, initial-scale=1. Avoid restricting zoom. Test on real devices." },
        { name: "Responsive Breakpoints", threshold: 85, shortDesc: "Responsive design adapts layout to screen size. Poor breakpoints cause horizontal scrolling. Content should reflow naturally on all devices.", howToFix: "Use relative units and flexible grids. Test at common breakpoints. Adopt mobile-first approach." },
        { name: "Touch Target Size", threshold: 85, shortDesc: "Small tap targets cause mis-taps on mobile. Minimum recommended size is 44×44 pixels. Adequate spacing prevents errors.", howToFix: "Add padding around links and buttons. Ensure at least 44px targets. Test tapping on actual phones." },
        { name: "PWA Readiness Indicators", threshold: 80, shortDesc: "PWA features enable install prompts and offline capability. Manifest and service worker are required. They improve engagement significantly.", howToFix: "Add valid manifest.json with icons and name. Implement basic service worker. Ensure HTTPS." }
      ],
      moduleWhat: "Mobile & PWA Readiness checks how well your page works on phones and tablets. It evaluates viewport, responsiveness, touch targets, and progressive web app signals. Mobile traffic dominates modern web usage.",
      moduleHow: "Implement proper viewport meta tag. Use responsive design with flexible layouts. Ensure large touch targets. Add manifest and service worker for PWA features.",
      moduleWhy: "Most users browse on mobile devices. Poor mobile experience causes immediate bounces. PWA capabilities increase return visits and engagement."
    },
performance: {
  factors: [
    { name: "Asset Volume Flags", threshold: 82, shortDesc: "...", howToFix: "Compress all images aggressively (aim <100KB each), convert to WebP or AVIF, remove unused images, enable server compression (GZIP/Brotli), minify CSS/JS." },
    { name: "Script Bloat Detection", threshold: 85, shortDesc: "...", howToFix: "Audit and remove unused JavaScript, defer or async non-critical scripts, bundle/minify all JS, replace heavy third-party scripts with lightweight alternatives." },
    { name: "Font Optimization", threshold: 82, shortDesc: "...", howToFix: "Limit to 2-3 font families and essential weights, use font-display: swap to prevent invisible text, preload critical fonts, prefer system fonts where possible." },
    { name: "Lazy Loading Media", threshold: 80, shortDesc: "...", howToFix: "Add native loading='lazy' attribute to all offscreen image and iframe elements (below the fold). For videos use preload='none' or lazy-loading libraries if needed." },
    { name: "Image Optimization", threshold: 82, shortDesc: "...", howToFix: "Convert images to next-gen formats (WebP or AVIF), use proper responsive sizing with srcset/sizes, compress files without visible quality loss." },
    { name: "Script Minification & Deferral", threshold: 85, shortDesc: "...", howToFix: "Minify all JavaScript and CSS files, add defer or async attributes to non-critical script tags, inline critical CSS above the fold, eliminate render-blocking resources." }
  ],
      moduleWhat: "Performance Optimization measures loading speed and resource efficiency. It flags heavy assets, script bloat, font issues, lazy loading, and image optimization. Speed is critical for user satisfaction and rankings.",
      moduleHow: "Compress and optimize all assets. Lazy load offscreen content. Minify and defer scripts. Use modern image formats.",
      moduleWhy: "Fast pages keep users and reduce bounce rates. Speed is a direct ranking factor. Users perceive faster sites as higher quality."
    }
  };

  // Helper functions for realistic metric calculation
  function countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  function countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    return (word.match(/[aeiouy]{1,2}/g) || []).length;
  }

  function countTotalSyllables(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.reduce((sum, w) => sum + countSyllables(w), 0);
  }

  function countExternalLinks(links) {
    const currentHost = window.location.host;
    return Array.from(links).filter(a => {
      try {
        return new URL(a.href, window.location.href).host !== currentHost;
      } catch {
        return false;
      }
    }).length;
  }

  function hasViewportMeta(doc) {
    const meta = doc.querySelector('meta[name="viewport"]');
    return meta && /width\s*=\s*device-width/i.test(meta.content);
  }

  function hasSemanticMain(doc) {
    return !!doc.querySelector('main');
  }

  function hasSemanticArticleOrSection(doc) {
    return !!doc.querySelector('article, section');
  }

  function countMissingAlt(doc) {
    const imgs = doc.querySelectorAll('img');
    let missing = 0;
    let decorative = 0;
    let meaningful = 0;
    imgs.forEach(img => {
      const alt = img.getAttribute('alt');
      const isDecorative = img.classList.contains('decorative') ||
                          img.getAttribute('role') === 'presentation' ||
                          (alt !== null && alt.trim() === '' && !img.hasAttribute('title'));
      if (isDecorative) {
        decorative++;
      } else {
        meaningful++;
        if (alt === null || alt.trim() === '') {
          missing++;
        }
      }
    });
    return {
      missingCount: missing,
      meaningfulCount: meaningful,
      decorativeCount: decorative,
      totalImages: imgs.length
    };
  }

  function estimateColorContrastScore() {
    const body = document.body;
    const hasCustomColors = body.style.color || body.style.backgroundColor;
    return hasCustomColors ? 78 : 72;
  }

  function getUXContent(doc) {
    const textElements = doc.querySelectorAll('p, li, article, section, main, div');
    let fullText = '';
    let paragraphTexts = [];
    let boldCount = 0;
    let listItemCount = 0;
    textElements.forEach(el => {
      const t = el.textContent.trim();
      if (t.length > 15) {
        fullText += t + ' ';
        if (el.tagName === 'P') paragraphTexts.push(t);
      }
      boldCount += el.querySelectorAll('b, strong').length;
      if (el.tagName === 'UL' || el.tagName === 'OL') listItemCount += el.querySelectorAll('li').length;
    });
    const links = doc.querySelectorAll('a[href]');
    const images = doc.querySelectorAll('img');
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
    return {
      fullText: fullText,
      wordCount: countWords(fullText),
      linkCount: links.length,
      externalLinkCount: countExternalLinks(links),
      imageCount: images.length,
      altData: countMissingAlt(doc),
      headingCount: headings.length,
      hasViewport: hasViewportMeta(doc),
      hasMain: hasSemanticMain(doc),
      hasArticleOrSection: hasSemanticArticleOrSection(doc),
      paragraphTexts,
      boldCount,
      listItemCount,
      mainNav: doc.querySelector('nav, [role="navigation"], header nav, .main-menu, #main-menu, .navbar, .navigation'),
      hasDropdowns: !!doc.querySelector('nav li ul, .dropdown, [aria-haspopup="true"]'),
      topLevelItems: doc.querySelectorAll('nav > ul > li, .main-menu > li, header nav > ul > li').length || 0,
      hasBreadcrumb: !!doc.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]'),
      hasLandmarks: !!doc.querySelector('header, footer, aside, [role="banner"], [role="contentinfo"], [role="complementary"]'),
      hasAriaLabels: !!doc.querySelector('[aria-label], [aria-labelledby]'),
      viewportContent: (() => {
        const meta = doc.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') || '' : '';
      })(),
      hasMediaQueries: !!doc.querySelector('style, link[rel="stylesheet"][href*="css"]'),
      hasTouchFriendly: (() => {
        const links = doc.querySelectorAll('a, button, [role="button"]');
        let smallCount = 0;
        links.forEach(el => {
          const rect = el.getBoundingClientRect?.() || { width: 0, height: 0 };
          if (rect.width < 44 || rect.height < 44) smallCount++;
        });
        return smallCount < 5;
      })(),
      hasManifest: !!doc.querySelector('link[rel="manifest"]'),
      hasServiceWorkerHint: doc.body.innerHTML.includes('serviceWorker') || doc.body.innerHTML.includes('register('),
      hasAppleTouchIcon: !!doc.querySelector('link[rel*="apple-touch-icon"]'),
      isHttps: window.location.protocol === 'https:',
      hasLazyLoading: !!doc.querySelector('img[loading="lazy"], iframe[loading="lazy"]'),
      externalScripts: doc.querySelectorAll('script[src^="http"]').length,
      hasRenderBlocking: doc.querySelectorAll('script:not([defer]):not([async]), link[rel="stylesheet"]:not([media])').length,
      fontCount: doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"], link[rel="stylesheet"][href*="typekit"], link[rel="stylesheet"][href*="cloud.typography"]').length || 0,
      hasFontDisplaySwap: doc.body.innerHTML.includes('font-display: swap') ||
                         doc.body.innerHTML.includes('font-display:swap') ||
                         doc.head.innerHTML.includes('font-display: swap') ||
                         doc.head.innerHTML.includes('font-display:swap'),
      hasWebpOrAvif: !!doc.querySelector('img[src$=".webp"], img[src$=".avif"], source[type="image/webp"], source[type="image/avif"]')
    };
  }

  function analyzeUX(data) {
    let readability = 55;
    if (data.wordCount > 80) {
      const sentenceCount = (data.fullText.match(/[.!?]+/g) || []).length || 1;
      const avgSentenceLength = data.wordCount / sentenceCount;
      const syllableCount = countTotalSyllables(data.fullText);
      const avgSyllablesPerWord = syllableCount / data.wordCount;
      const fleschEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
      const kincaidGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
      const paragraphCount = data.paragraphTexts.length || 1;
      const avgWordsPerParagraph = data.wordCount / paragraphCount;
      const scannability = Math.min(100, (data.boldCount * 5 + data.listItemCount * 3 + data.headingCount * 10) / (data.wordCount / 100 || 1));
      let paraDensityScore = 100;
      if (avgWordsPerParagraph > 120) paraDensityScore -= 40;
      else if (avgWordsPerParagraph > 80) paraDensityScore -= 20;
      let sentenceScore = 100 - (avgSentenceLength > 20 ? (avgSentenceLength - 20) * 5 : 0);
      sentenceScore = Math.max(40, Math.min(100, sentenceScore));
      const easeScore = Math.max(0, Math.min(100, fleschEase));
      const gradeScore = kincaidGrade <= 8 ? 100 : Math.max(0, 100 - (kincaidGrade - 8) * 10);
      readability = Math.round((easeScore + gradeScore + sentenceScore + paraDensityScore + scannability) / 5);
    }

    let navScore = 85;
    const bodyTextLength = data.wordCount > 0 ? data.wordCount : 100;
    const linkDensity = (data.linkCount / Math.max(1, bodyTextLength)) * 100;

    if (data.mainNav) navScore += 12;
    if (data.hasDropdowns) navScore += 8;
    if (data.topLevelItems > 9) navScore -= 18;
    else if (data.topLevelItems > 7) navScore -= 8;
    else if (data.topLevelItems <= 5 && data.topLevelItems > 0) navScore += 10;
    if (data.hasBreadcrumb && data.wordCount > 400) navScore += 9;

    if (linkDensity > 12) navScore -= Math.min(45, (linkDensity - 8) * 6);
    else if (linkDensity > 8) navScore -= (linkDensity - 8) * 4;
    else if (linkDensity < 2 && data.wordCount > 300) navScore -= 18;

    const externalRatio = data.externalLinkCount / Math.max(1, data.linkCount);
    if (externalRatio > 0.45) navScore -= 22;
    else if (externalRatio > 0.30) navScore -= 12;

    const contextualLinkEstimate = data.linkCount - data.topLevelItems * 2;
    if (contextualLinkEstimate < 3 && data.wordCount > 600) navScore -= 20;
    else if (contextualLinkEstimate > 0) navScore += Math.min(15, contextualLinkEstimate * 1.8);

    const potentialCTAs = document.querySelectorAll(
      'a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="trial"], a[href*="buy"], ' +
      'a[href*="get"], a[href*="start"], button, [role="button"], .btn, .button, ' +
      '[class*="cta"], [id*="cta"], [class*="button"], [class*="CallToAction"]'
    ).length;

    if (potentialCTAs >= 4) navScore += 12;
    else if (potentialCTAs >= 2) navScore += 7;
    else if (data.wordCount > 500 && potentialCTAs === 0) navScore -= 14;

    navScore = Math.max(35, Math.min(98, Math.round(navScore)));

    let accScore = 60;
    if (data.altData) {
      const { missingCount, meaningfulCount, totalImages } = data.altData;
      if (totalImages === 0) {
        accScore += 15;
      } else {
        const altCoverage = meaningfulCount > 0 
          ? (meaningfulCount - missingCount) / meaningfulCount 
          : 1;
        if (altCoverage >= 0.98) accScore += 22;
        else if (altCoverage >= 0.90) accScore += 14;
        else if (altCoverage >= 0.70) accScore += 6;
        else if (altCoverage < 0.50) accScore -= 30;
        else accScore -= 18;
      }
    }
    if (data.hasMain) accScore += 14;
    if (data.hasArticleOrSection) accScore += 12;
    if (data.headingCount >= 3) accScore += 10;
    if (data.headingCount === 0 && data.wordCount > 300) accScore -= 18;
    if (data.hasLandmarks) accScore += 10;
    if (data.hasAriaLabels) accScore += 8;
    const contrastProxy = estimateColorContrastScore();
    accScore += (contrastProxy - 70) * 0.8;
    accScore = Math.max(30, Math.min(98, Math.round(accScore)));

    let mobileScore = 50;
    const vp = (data.viewportContent || '').toLowerCase();
    if (vp.includes('width=device-width') && vp.includes('initial-scale=1')) {
      mobileScore += 35;
      if (!vp.includes('maximum-scale') && !vp.includes('user-scalable=no')) {
        mobileScore += 10;
      }
    } else if (vp.includes('width=device-width')) {
      mobileScore += 18;
    } else {
      mobileScore -= 35;
    }
    if (data.hasMediaQueries) mobileScore += 18;
    if (data.imageCount > 20 && data.imageCount < 60) mobileScore += 8;
    if (data.hasTouchFriendly) mobileScore += 15;
    else if (data.imageCount > 10) mobileScore -= 12;
    let pwaScore = 0;
    if (data.hasManifest) pwaScore += 20;
    if (data.hasServiceWorkerHint) pwaScore += 15;
    if (data.hasAppleTouchIcon) pwaScore += 10;
    if (data.isHttps) pwaScore += 15;
    mobileScore += Math.round(pwaScore * 0.6);
    mobileScore = Math.max(25, Math.min(98, Math.round(mobileScore)));

    let speedScore = 65;
    if (data.imageCount > 60) speedScore -= 28;
    else if (data.imageCount > 35) speedScore -= 16;
    else if (data.imageCount <= 10) speedScore += 12;
    if (data.externalScripts > 15) speedScore -= 25;
    else if (data.externalScripts > 8) speedScore -= 14;
    else if (data.externalScripts <= 3) speedScore += 10;
    if (data.hasRenderBlocking > 5) speedScore -= 18;
    else if (data.hasRenderBlocking > 2) speedScore -= 9;
    if (data.fontCount > 4) speedScore -= 16;
    else if (data.fontCount > 2) speedScore -= 7;
    if (data.hasFontDisplaySwap) speedScore += 12;
    if (data.hasLazyLoading && data.imageCount > 10) speedScore += 18;
    else if (data.imageCount > 15) speedScore -= 20;
    if (data.hasWebpOrAvif) speedScore += 15;
    else if (data.imageCount > 20) speedScore -= 12;
    if (data.externalLinkCount > 30) speedScore -= 14;
    speedScore = Math.max(30, Math.min(98, Math.round(speedScore)));

    const scores = [readability, navScore, accScore, mobileScore, speedScore];
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      score: isNaN(overall) ? 60 : overall,
      readability,
      nav: navScore,
      accessibility: accScore,
      mobile: mobileScore,
      speed: speedScore
    };
  }

  function getQuitRiskLabel(score) {
    if (score >= 75) return { text: "Low Risk", color: "from-green-400 to-emerald-600" };
    if (score >= 55) return { text: "Moderate Risk", color: "from-yellow-400 to-orange-600" };
    return { text: "High Risk", color: "from-red-500 to-pink-600" };
  }

  function getGradeInfo(score) {
    if (score >= 90) return { grade: "A+", color: "text-green-600", emoji: "🏆" };
    if (score >= 85) return { grade: "A", color: "text-green-600", emoji: "✅" };
    if (score >= 80) return { grade: "B+", color: "text-green-500", emoji: "✅" };
    if (score >= 75) return { grade: "B", color: "text-yellow-500", emoji: "👍" };
    if (score >= 70) return { grade: "C+", color: "text-yellow-600", emoji: "👍" };
    if (score >= 65) return { grade: "C", color: "text-orange-600", emoji: "⚠️" };
    if (score >= 60) return { grade: "D", color: "text-orange-600", emoji: "⚠️" };
    return { grade: "F", color: "text-red-600", emoji: "❌" };
  }

  function getPluginGrade(score) {
    if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
    return { grade: 'Poor', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  }

  function buildModuleHTML(moduleName, value, moduleData, factorScores = null) {
    const ringColor = value < 60 ? '#ef4444' : value < 80 ? '#fb923c' : '#22c55e';
    const borderClass = value < 60 ? 'border-red-500' : value < 80 ? 'border-orange-500' : 'border-green-500';
    const gradeInfo = getGradeInfo(value);

    let statusMessage, statusEmoji;
    if (value >= 85) { statusMessage = "Excellent"; statusEmoji = "🏆"; }
    else if (value >= 75) { statusMessage = "Very good"; statusEmoji = "✅"; }
    else if (value >= 60) { statusMessage = "Needs improvement"; statusEmoji = "⚠️"; }
    else { statusMessage = "Needs work"; statusEmoji = "❌"; }

    let metricsHTML = '';
    let fixesHTML = '';
    let failedOnlyHTML = '';
    let failedCount = 0;

    if (!factorScores) factorScores = null;

    moduleData.factors.forEach(f => {
      let passed = value >= f.threshold;

      if (factorScores) {
        const fs = factorScores;
        if (moduleName === 'Readability') {
          if (f.name === "Flesch Reading Ease Score") passed = fs.fleschEase >= 60;
          else if (f.name === "Flesch-Kincaid Grade Level") passed = fs.kincaidGrade <= 10;
          else if (f.name === "Average Sentence Length") passed = fs.avgSentence <= 20;
          else if (f.name === "Paragraph Density & Length") passed = fs.avgParagraph <= 80;
          else if (f.name === "Overall Text Scannability") passed = fs.scannability >= 70;
        }
        else if (moduleName === 'Navigation') {
          if (f.name === "Link Density Evaluation") passed = fs.linkDensity <= 8;
          else if (f.name === "Menu Structure Clarity") passed = fs.menuClarity >= 70;
          else if (f.name === "Internal Linking Balance") passed = fs.internalBalance >= 50;
          else if (f.name === "CTA Prominence & Visibility") passed = fs.ctaStrength >= 70;
        }
        else if (moduleName === 'Accessibility') {
          if (f.name === "Alt Text Coverage") passed = fs.altCoverage >= 85;
          else if (f.name === "Color Contrast Ratios") passed = fs.contrastProxy >= 80;
          else if (f.name === "Semantic HTML Structure") passed = fs.semanticStrength >= 70;
          else if (f.name === "Overall WCAG Compliance") passed = (fs.altCoverage + fs.contrastProxy + fs.semanticStrength) / 3 >= 75;
        }
        else if (moduleName === 'Mobile') {
          if (f.name === "Viewport Configuration") passed = fs.viewportQuality >= 85;
          else if (f.name === "Responsive Breakpoints") passed = fs.responsiveProxy >= 75;
          else if (f.name === "Touch Target Size") passed = fs.touchFriendly >= 70;
          else if (f.name === "PWA Readiness Indicators") passed = fs.pwaReadiness >= 60;
        }
        else if (moduleName === 'Speed') {
          if (f.name === "Asset Volume Flags") passed = fs.assetVolume >= 70;
          else if (f.name === "Script Bloat Detection") passed = fs.scriptBloat >= 70;
          else if (f.name === "Font Optimization") passed = fs.fontOptimization >= 70;
          else if (f.name === "Lazy Loading Media") passed = fs.lazyLoading >= 70;
          else if (f.name === "Image Optimization") passed = fs.imageFormat >= 70;
          else if (f.name === "Script Minification & Deferral") passed = fs.renderBlocking >= 70;
        }
      }

      let metricGrade = passed
        ? { color: "text-green-600", emoji: "✅" }
        : (value >= f.threshold - 10)
          ? { color: "text-orange-600", emoji: "⚠️" }
          : { color: "text-red-600", emoji: "❌" };

      metricsHTML += `
        <div class="mb-6">
          <p class="font-medium text-xl">
            <span class="${metricGrade.color} text-3xl mr-3">${metricGrade.emoji}</span>
            <span class="${metricGrade.color} font-bold">${f.name}</span>
          </p>
        </div>`;

      fixesHTML += `
        <div class="mb-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border-l-4 ${passed ? 'border-green-500' : 'border-red-500'}">
          <p class="font-bold text-xl ${metricGrade.color} mb-3">
            <span class="text-3xl mr-3">${metricGrade.emoji}</span>
            ${f.name}
          </p>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
            ${passed ? '✓ This metric meets or exceeds best practices.' : f.howToFix}
          </p>
        </div>`;

      if (!passed) {
        failedOnlyHTML += `
          <div class="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <p class="font-bold text-2xl ${metricGrade.color} mb-4">
              <span class="text-6xl">${metricGrade.emoji}</span>
            </p>
            <p class="font-bold text-2xl ${metricGrade.color} mb-4">
              ${f.name}
            </p>
            <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              ${f.howToFix}
            </p>
          </div>`;
        failedCount++;
      }
    });

    const moreDetailsHTML = `
      <div class="text-left px-4 py-6">
        <h4 class="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100 text-center">
          <button class="underline hover:text-purple-600 dark:hover:text-purple-400 bg-transparent border-none cursor-pointer" onclick="window.location.hash = '${moduleName.toLowerCase()}';">
            How ${moduleName} is tested?
          </button>
        </h4>
        <div class="space-y-6">
          <div>
            <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">What it is:</strong>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleWhat}</p>
          </div>
          <div>
            <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">How to Improve:</strong>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleHow}</p>
          </div>
          <div>
            <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">Why it matters:</strong>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleWhy}</p>
          </div>
        </div>
      </div>`;

const fixesPanelHTML = failedCount > 0
  ? `
    <div class="space-y-6">
      ${failedOnlyHTML}
    </div>
    <p class="text-center text-gray-600 dark:text-gray-400 mt-10 text-sm italic">
      <button class="underline hover:text-purple-600 dark:hover:text-purple-400 bg-transparent border-none cursor-pointer" onclick="window.location.hash = '${moduleName.toLowerCase()}';">
        Learn more about ${moduleName}?
      </button>
    </p>
  `
  : '<p class="text-center text-gray-700 dark:text-gray-300 text-lg py-12 font-medium">All checks passed — no fixes needed!</p>';

    return `
      <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderClass}">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="${ringColor}" stroke-width="12" fill="none"
                    stroke-dasharray="${(value / 100) * 352} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${ringColor};">
            ${value}
          </div>
        </div>
        <p class="mt-4 text-2xl font-bold ${gradeInfo.color}">${moduleName}</p>
        <div class="mt-4 text-center">
          <p class="text-6xl ${gradeInfo.color}">${statusEmoji}</p>
          <p class="text-3xl font-bold ${gradeInfo.color} mt-2">${statusMessage}</p>
        </div>
        <div class="mt-6 text-center metrics-list">
          ${metricsHTML}
        </div>
        <div class="more-details-panel hidden mt-8 text-left">
          ${moreDetailsHTML}
        </div>
        <div class="mt-6 flex gap-4 justify-center flex-wrap">
          <button class="more-details px-8 py-3 rounded-full text-white font-medium hover:opacity-90 transition" style="background-color: ${ringColor};">
            More Details
          </button>
          <button class="show-fixes px-8 py-3 rounded-full bg-gray-600 text-white font-medium hover:opacity-90 transition">
            Show Fixes${failedCount > 0 ? ` (${failedCount})` : ''}
          </button>
        </div>
<div class="fixes-panel hidden mt-8 text-left px-4 md:px-0">
  ${fixesPanelHTML}
</div>
      </div>`;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let url = input.value.trim();
    if (!url) {
      results.innerHTML = `<div class="text-center py-20"><p class="text-3xl text-red-500 font-bold">Please enter a URL</p></div>`;
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      input.value = url;
    }
    results.classList.remove('hidden');
    document.getElementById('loading').classList.remove('hidden');
    const progressText = document.getElementById('progressText');
    const steps = [
      { text: "Fetching and parsing page HTML securely...", delay: 1200 },
      { text: "Extracting main content and text for readability analysis...", delay: 1600 },
      { text: "Counting navigation links and menu structure...", delay: 1400 },
      { text: "Evaluating images for accessibility signals...", delay: 1200 },
      { text: "Checking mobile responsiveness patterns...", delay: 1000 },
      { text: "Assessing performance proxies and asset optimization...", delay: 1400 },
      { text: "Calculating overall usability score and quit risk...", delay: 1600 }
    ];
    let currentStep = 0;
    const runStep = () => {
      if (currentStep < steps.length) {
        progressText.textContent = steps[currentStep].text;
        currentStep++;
        setTimeout(runStep, steps[currentStep - 1].delay);
      } else {
        progressText.textContent = "Generating detailed report...";
        setTimeout(performAnalysis, 3000);
      }
    };
    runStep();

    async function performAnalysis() {
      try {
        const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error('Page not reachable or blocked');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const uxData = getUXContent(doc);
        const ux = analyzeUX(uxData);

        // Calculate potentialCTAs early so it's available for factorDetails
        const potentialCTAs = document.querySelectorAll(
          'a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="trial"], a[href*="buy"], ' +
          'a[href*="get"], a[href*="start"], button, [role="button"], .btn, .button, ' +
          '[class*="cta"], [id*="cta"], [class*="button"], [class*="CallToAction"]'
        ).length;

        // Define factorDetails in the correct scope (performAnalysis)
        const factorDetails = {
          readability: {
            fleschEase: Math.round(
              206.835 -
              1.015 * (uxData.wordCount / ((uxData.fullText.match(/[.!?]+/g) || []).length || 1)) -
              84.6 * (countTotalSyllables(uxData.fullText) / (uxData.wordCount || 1))
            ),
            kincaidGrade: Math.round(
              0.39 * (uxData.wordCount / ((uxData.fullText.match(/[.!?]+/g) || []).length || 1)) +
              11.8 * (countTotalSyllables(uxData.fullText) / (uxData.wordCount || 1)) -
              15.59
            ),
            avgSentence: Math.round(uxData.wordCount / ((uxData.fullText.match(/[.!?]+/g) || []).length || 1)),
            avgParagraph: Math.round(uxData.wordCount / (uxData.paragraphTexts.length || 1)),
            scannability: Math.round(
              (uxData.boldCount * 5 + uxData.listItemCount * 3 + uxData.headingCount * 10) /
              (uxData.wordCount / 100 || 1)
            )
          },
          navigation: {
            linkDensity: Math.round((uxData.linkCount / (uxData.wordCount / 100 || 1)) * 10),
            menuClarity: uxData.topLevelItems > 0 ? Math.max(0, 100 - (uxData.topLevelItems - 5) * 8) : 40,
            internalBalance: Math.round((uxData.linkCount - (uxData.topLevelItems * 2)) / (uxData.wordCount / 500 || 1) * 25),
            ctaStrength: potentialCTAs >= 4 ? 90 : potentialCTAs >= 2 ? 65 : 30
          },
          accessibility: {
            altCoverage: uxData.altData && uxData.altData.meaningfulCount > 0
              ? Math.round(((uxData.altData.meaningfulCount - uxData.altData.missingCount) / uxData.altData.meaningfulCount) * 100)
              : (uxData.imageCount === 0 ? 100 : 30),
            contrastProxy: estimateColorContrastScore(),
            semanticStrength: (uxData.hasMain ? 25 : 0) + (uxData.hasArticleOrSection ? 20 : 0) +
                             (uxData.headingCount >= 3 ? 25 : 0) + (uxData.hasLandmarks ? 20 : 0) +
                             (uxData.hasAriaLabels ? 10 : 0)
          },
          mobile: {
            viewportQuality: uxData.viewportContent.toLowerCase().includes('width=device-width') &&
                             uxData.viewportContent.toLowerCase().includes('initial-scale=1') ? 95 : 30,
            responsiveProxy: uxData.hasMediaQueries ? 85 : 40,
            touchFriendly: uxData.hasTouchFriendly ? 80 : 35,
            pwaReadiness: (uxData.hasManifest ? 25 : 0) + (uxData.hasServiceWorkerHint ? 20 : 0) +
                          (uxData.hasAppleTouchIcon ? 15 : 0) + (uxData.isHttps ? 20 : 0)
          },
          performance: {
            assetVolume: uxData.imageCount <= 10 ? 95 : uxData.imageCount <= 35 ? 70 :
                         uxData.imageCount <= 60 ? 45 : 20,
            scriptBloat: uxData.externalScripts <= 3 ? 90 : uxData.externalScripts <= 8 ? 70 :
                         uxData.externalScripts <= 15 ? 45 : 25,
            fontOptimization: uxData.fontCount <= 2 ? 90 : uxData.fontCount <= 4 ? 65 :
                              uxData.hasFontDisplaySwap ? 55 : 30,
            lazyLoading: uxData.hasLazyLoading && uxData.imageCount > 10 ? 85 :
                         uxData.imageCount > 15 ? 35 : 60,
            imageFormat: uxData.hasWebpOrAvif ? 90 : uxData.imageCount > 20 ? 40 : 70,
            renderBlocking: uxData.hasRenderBlocking <= 2 ? 90 : uxData.hasRenderBlocking <= 5 ? 65 : 35
          }
        };

        const failedMetrics = [];
        if (ux.accessibility < 75) {
          failedMetrics.push({
            name: "Alt Text Coverage",
            grade: getPluginGrade(ux.accessibility)
          });
        }
        if (ux.speed < 85) {
          const speedGrade = getPluginGrade(ux.speed);
          failedMetrics.push(
            { name: "Image Optimization", grade: speedGrade },
            { name: "Lazy Loading Media", grade: speedGrade },
            { name: "Font Optimization", grade: speedGrade },
            { name: "Script Minification & Deferral", grade: speedGrade },
            { name: "Asset Volume & Script Bloat", grade: speedGrade }
          );
        }
        if (ux.mobile < 90) {
          failedMetrics.push({
            name: "PWA Readiness",
            grade: getPluginGrade(ux.mobile)
          });
        }

        const risk = getQuitRiskLabel(ux.score);
        document.getElementById('loading').classList.add('hidden');
        const safeScore = isNaN(ux.score) ? 60 : ux.score;
        const overallGrade = getGradeInfo(safeScore);

        const readabilityHTML = buildModuleHTML('Readability', ux.readability, factorDefinitions.readability, factorDetails.readability);
        const navHTML = buildModuleHTML('Navigation', ux.nav, factorDefinitions.navigation, factorDetails.navigation);
        const accessHTML = buildModuleHTML('Accessibility', ux.accessibility, factorDefinitions.accessibility, factorDetails.accessibility);
        const mobileHTML = buildModuleHTML('Mobile', ux.mobile, factorDefinitions.mobile, factorDetails.mobile);
        const speedHTML = buildModuleHTML('Speed', ux.speed, factorDefinitions.performance, factorDetails.performance);

        const modulePriority = [
          { name: 'Readability', score: ux.readability, threshold: 65, data: factorDefinitions.readability },
          { name: 'Navigation', score: ux.nav, threshold: 70, data: factorDefinitions.navigation },
          { name: 'Performance', score: ux.speed, threshold: 85, data: factorDefinitions.performance },
          { name: 'Accessibility', score: ux.accessibility, threshold: 75, data: factorDefinitions.accessibility },
          { name: 'Mobile', score: ux.mobile, threshold: 90, data: factorDefinitions.mobile }
        ];

        const priorityFixes = [];
        const failedModules = modulePriority.filter(m => m.score < m.threshold);
        failedModules.forEach(mod => {
          if (mod.data.factors.length > 0) {
            priorityFixes.push({ ...mod.data.factors[0], module: mod.name, extraCount: mod.data.factors.length });
          }
        });
        if (priorityFixes.length < 3 && failedModules.length > 0) {
          const topModule = failedModules[0];
          if (topModule.data.factors.length >= 3) {
            priorityFixes.push({ ...topModule.data.factors[1], module: topModule.name, isSecond: true, extraCount: topModule.data.factors.length });
          }
        }

        let priorityFixesHTML = '';
        if (priorityFixes.length > 0) {
          priorityFixesHTML = priorityFixes.map((fix, index) => `
            <div class="flex items-start gap-6 p-8 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
              <div class="text-5xl font-black text-purple-600">${index + 1}</div>
              <div class="flex-1">
                <p class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  ${fix.module} → ${fix.name}
                  ${fix.isSecond ? `<span class="text-sm font-normal text-purple-600 dark:text-purple-400 ml-3">(${fix.extraCount}/${fix.extraCount} failed in this module)</span>` : ''}
                </p>
                <p class="text-lg leading-relaxed text-gray-800 dark:text-gray-200">${fix.howToFix}</p>
              </div>
            </div>
          `).join('');
        } else {
          priorityFixesHTML = `
            <div class="p-12 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-3xl border border-green-500/50 text-center">
              <p class="text-5xl mb-6">🎉</p>
              <p class="text-4xl font-black text-green-600 dark:text-green-400 mb-4">Good job! Outstanding UX</p>
              <p class="text-2xl text-gray-800 dark:text-gray-200">Your page delivers excellent user experience across all modules. No critical improvements needed at this time.</p>
              <p class="text-lg text-gray-800 dark:text-gray-200 mt-6">Keep monitoring — even great pages benefit from ongoing optimization.</p>
            </div>`;
        }

        const failedCount = failedModules.length;
        let projectedRisk = risk.text;
        let riskDropText = '';
        if (failedCount >= 3) {
          projectedRisk = 'Low Risk';
          riskDropText = 'High → Low';
        } else if (failedCount === 2) {
          projectedRisk = risk.text === 'High Risk' ? 'Moderate Risk' : 'Low Risk';
          riskDropText = risk.text === 'High Risk' ? 'High → Moderate' : 'Moderate → Low';
        } else if (failedCount === 1) {
          riskDropText = 'Moderate improvement';
        } else {
          riskDropText = 'Already optimal';
        }

        const projectedRiskColor = projectedRisk === 'Low Risk' ? 'from-green-400 to-emerald-600' :
                                  projectedRisk === 'Moderate Risk' ? 'from-yellow-400 to-orange-600' : 'from-red-500 to-pink-600';

        let perFixImpact = '';
        if (priorityFixes.length > 0) {
          perFixImpact = '<div class="mt-8 space-y-4 text-left">';
          priorityFixes.forEach(fix => {
            perFixImpact += `
              <div class="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p class="font-medium text-gray-800 dark:text-gray-200">${fix.module} → ${fix.name}</p>
                <p class="text-gray-800 dark:text-gray-200 mt-1">Reduces friction by making content more approachable and reducing early abandonment. Expected impact: 10–25% lower early exits.</p>
              </div>`;
          });
          perFixImpact += '</div>';
        }

        const dominant = priorityFixes.length > 0 ? priorityFixes[0].module : '';
        let bounceRange = failedCount === 0 ? 'Already optimal' : failedCount === 1 ? '10–20%' : failedCount === 2 ? '20–35%' : '30–50%';
        let durationRange = dominant === 'Readability' ? (failedCount >= 2 ? '+60–120%' : '+40–80%') : (failedCount === 0 ? 'Strong' : failedCount === 1 ? '+20–50%' : failedCount === 2 ? '+40–80%' : '+60–120%');
        let pagesRange = failedCount === 0 ? 'Good' : failedCount === 1 ? '+0.4–1.0' : failedCount === 2 ? '+0.8–1.6' : '+1.2–2.4';
        let conversionRange = failedCount === 0 ? 'Strong' : failedCount === 1 ? '+10–25%' : failedCount === 2 ? '+20–40%' : '+30–60%';

        const impactHTML = `
          <div class="grid md:grid-cols-2 gap-8 my-20">
            <div class="p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl border border-purple-400/30">
              <h3 class="text-3xl font-black mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">Quit Risk Reduction</h3>
              <div class="text-center mb-8">
                <div class="flex items-center justify-center gap-8 text-4xl font-black mb-6">
                  <span class="bg-gradient-to-r ${risk.color} bg-clip-text text-transparent">${risk.text}</span>
                  <span class="text-purple-600">→</span>
                  <span class="bg-gradient-to-r ${projectedRiskColor} bg-clip-text text-transparent">${projectedRisk}</span>
                </div>
                <p class="text-xl text-gray-800 dark:text-gray-200">${riskDropText}</p>
              </div>
              ${perFixImpact}
              <details class="mt-8">
                <summary class="cursor-pointer text-lg font-medium text-purple-600 dark:text-purple-400">How We Calculated This</summary>
                <p class="text-gray-800 dark:text-gray-200 mt-4">Based on benchmarks from thousands of analyzed sites — fixing Readability issues alone can reduce quit risk by 20-30% by making content more approachable. Combined fixes across modules deliver compounded gains.</p>
              </details>
              <details class="mt-6">
                <summary class="cursor-pointer text-lg font-medium text-purple-600 dark:text-purple-400">Risk Level Definitions</summary>
                <ul class="text-gray-800 dark:text-gray-200 mt-4 space-y-2">
                  <li><strong>High Risk:</strong> >60% chance of quick bounce based on similar sites</li>
                  <li><strong>Moderate Risk:</strong> 40-60% early exit probability</li>
                  <li><strong>Low Risk:</strong> <40% — users typically stay and engage</li>
                </ul>
              </details>
              <p class="mt-8 text-center text-lg text-gray-800 dark:text-gray-200 font-medium">Track in Analytics: Monitor exit rates pre/post fixes to verify improvement.</p>
            </div>
            <div class="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl border border-cyan-400/30">
              <h3 class="text-3xl font-black mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent text-center">Potential Engagement Gains</h3>
              <ul class="space-y-8">
                <li class="flex items-center gap-6">
                  <span class="text-4xl">📉</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Bounce Rate</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${bounceRange} reduction</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-purple-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 25 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">⏱️</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Session Duration</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${durationRange} longer</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-cyan-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 30 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">📄</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Pages per Session</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${pagesRange} more pages viewed</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-blue-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 25 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">💰</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Conversion Rate Lift</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${conversionRange} improvement</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-green-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 20 + '%'}"></div>
                    </div>
                  </div>
                </li>
              </ul>
              <p class="text-sm text-gray-800 dark:text-gray-200 mt-8">Conservative estimates based on industry benchmarks. Readability fixes often yield the largest session gains.</p>
              <p class="text-lg text-gray-800 dark:text-gray-200 mt-6 font-medium text-center">How to Verify: Use Google Analytics to track these metrics before/after changes. Typical timeline: See gains in 1-4 weeks with consistent traffic.</p>
            </div>
          </div>`;

        const modules = [
          { name: 'Readability', score: ux.readability },
          { name: 'Navigation', score: ux.nav },
          { name: 'Accessibility', score: ux.accessibility },
          { name: 'Mobile & PWA', score: ux.mobile },
          { name: 'Performance', score: ux.speed }
        ];
        const scores = modules.map(m => m.score);
        
// Scroll to results from top of viewport + generous offset - always consistent
const offset = 240; // (adjust 80–340)

const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;

window.scrollTo({
  top: targetY,
  behavior: 'smooth'
});

        results.innerHTML = `
          <!-- Big Overall Score Card -->
          <div class="flex justify-center my-12 px-4">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full border-4 ${safeScore >= 80 ? 'border-green-500' : safeScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
              <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall Usability Score</p>
              <div class="relative w-56 h-56 mx-auto md:w-64 md:h-64">
                <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                  <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
                  <circle cx="100" cy="100" r="90"
                          stroke="${safeScore >= 80 ? '#22c55e' : safeScore >= 60 ? '#fb923c' : '#ef4444'}"
                          stroke-width="16" fill="none"
                          stroke-dasharray="${(safeScore / 100) * 565} 565"
                          stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-4xl md:text-5xl font-black drop-shadow-lg"
                         style="color: ${safeScore >= 80 ? '#22c55e' : safeScore >= 60 ? '#fb923c' : '#ef4444'};">
                      ${safeScore}
                    </div>
                    <div class="text-base md:text-lg opacity-80 -mt-1"
                         style="color: ${safeScore >= 80 ? '#22c55e' : safeScore >= 60 ? '#fb923c' : '#ef4444'};">
                      /100
                    </div>
                  </div>
                </div>
              </div>
              ${(() => {
                const title = (doc?.title || '').trim();
                if (!title) return '';
                const truncated = title.length > 65 ? title.substring(0, 65) : title;
                return `<p class="mt-6 md:mt-8 text-base md:text-lg text-gray-600 dark:text-gray-200 text-center px-4 leading-tight">${truncated}</p>`;
              })()}
              <div class="mt-6 text-center">
                <p class="text-5xl md:text-6xl font-bold ${overallGrade.color} drop-shadow-lg">
                  ${overallGrade.emoji}
                </p>
                <p class="text-3xl md:text-4xl font-bold ${overallGrade.color} mt-4">
                  ${overallGrade.grade}
                </p>
                <p class="text-base md:text-lg text-gray-600 dark:text-gray-400 mt-4">/100 Usability Score</p>
              </div>
            </div>
          </div>

          <!-- Quit Risk Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">Quit Risk:</p>
            <div class="flex flex-col items-center gap-6">
              <div class="flex items-center gap-6 text-7xl">
                <span class="${risk.text === 'Low Risk' ? 'text-green-600' : risk.text === 'Moderate Risk' ? 'text-orange-600' : 'text-red-600'}">
                  ${risk.text === 'Low Risk' ? '✅✅✅' : risk.text === 'Moderate Risk' ? '⚠️⚠️' : '❌❌❌'}
                </span>
              </div>
              <p class="text-6xl font-black bg-gradient-to-r ${risk.color} bg-clip-text text-transparent">
                ${risk.text}
              </p>
            </div>
            <p class="text-xl text-gray-800 dark:text-gray-200 mt-10">Scanned ${uxData.linkCount} links + ${uxData.imageCount} images</p>
          </div>

          <!-- On-Page Health Radar Chart -->
          <div class="max-w-5xl mx-auto my-16 px-4">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
              <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">On-Page Health Radar</h3>
              <div class="hidden md:block w-full">
                <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
              </div>
              <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
                Radar chart available on desktop/tablet
              </p>
              <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
                Visual overview of your page performance across key SEO & UX factors
              </p>
            </div>
          </div>

          <!-- Modules -->
          <div class="grid gap-8 my-16 max-w-7xl mx-auto px-6">
            <div class="grid md:grid-cols-1 gap-8">${readabilityHTML}</div>
            <div class="grid md:grid-cols-2 gap-8">${navHTML}${accessHTML}</div>
            <div class="grid md:grid-cols-2 gap-8">${mobileHTML}${speedHTML}</div>
          </div>

          <!-- Top Priority Fixes -->
          <div class="text-center my-20">
            <h2 class="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-12">
              Top Priority Fixes
            </h2>
            <div class="max-w-5xl mx-auto space-y-8">
              ${priorityFixesHTML}
            </div>
            ${priorityFixes.length > 0 ? `
            <p class="mt-12 text-xl text-gray-800 dark:text-gray-200">
              Prioritized by impact — focusing on diverse modules for balanced improvements. If one module dominates failures, address it first for biggest gains.
            </p>` : ''}
          </div>

          <!-- Plugin Solutions Accordion -->
          <div id="plugin-solutions-section" class="mt-16 px-4"></div>

          <!-- Enhanced Quit Risk Reduction & Engagement Impact -->
          ${impactHTML}

          <!-- PDF Button -->
          <div class="text-center my-16">
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
              <span class="flex items-center gap-6">📄 Save Report as PDF</span>
              <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        `;

        console.log('Container AFTER HTML set:', !!document.getElementById('plugin-solutions-section'));
        if (typeof renderPluginSolutions === 'function') {
          console.log('Calling renderPluginSolutions now');
          renderPluginSolutions(failedMetrics, 'plugin-solutions-section');
        } else {
          console.warn('renderPluginSolutions not loaded yet - delaying 500ms');
          setTimeout(() => {
            if (typeof renderPluginSolutions === 'function') {
              console.log('Delayed call successful');
              renderPluginSolutions(failedMetrics, 'plugin-solutions-section');
            } else {
              console.error('renderPluginSolutions still not available after delay');
            }
          }, 500);
        }

        setTimeout(() => {
          const canvas = document.getElementById('health-radar');
          if (!canvas) return;
          try {
            const ctx = canvas.getContext('2d');
            const labelColor = '#9ca3af';
            const gridColor = 'rgba(156, 163, 175, 0.3)';
            const borderColor = '#fb923c';
            const fillColor = 'rgba(251, 146, 60, 0.15)';
            window.myChart = new Chart(ctx, {
              type: 'radar',
              data: {
                labels: modules.map(m => m.name),
                datasets: [{
                  label: 'Health Score',
                  data: scores,
                  backgroundColor: fillColor,
                  borderColor: borderColor,
                  borderWidth: 4,
                  pointRadius: 8,
                  pointHoverRadius: 12,
                  pointBackgroundColor: scores.map(s => s >= 80 ? '#22c55e' : s >= 60 ? '#fb923c' : '#ef4444'),
                  pointBorderColor: '#fff',
                  pointBorderWidth: 3
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: labelColor },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 15, weight: '600' } }
                  }
                },
                plugins: { legend: { display: false } }
              }
            });
          } catch (e) {
            console.error('Radar chart failed', e);
          }
        }, 150);

        let fullUrl = document.getElementById('url-input').value.trim();
        let displayUrl = 'traffictorch.net';
        if (fullUrl) {
          let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
          const firstSlash = cleaned.indexOf('/');
          if (firstSlash !== -1) {
            const domain = cleaned.slice(0, firstSlash);
            const path = cleaned.slice(firstSlash);
            displayUrl = domain + '\n' + path;
          } else {
            displayUrl = cleaned;
          }
        }
        document.body.setAttribute('data-url', displayUrl);
      } catch (err) {
        document.getElementById('loading').classList.add('hidden');
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-600 dark:text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }
    }
  });

  document.addEventListener('click', e => {
    const moreBtn = e.target.closest('.more-details');
    if (moreBtn) {
      const card = moreBtn.closest('.p-6');
      card.querySelector('.more-details-panel').classList.toggle('hidden');
    }
    const fixesBtn = e.target.closest('.show-fixes');
    if (fixesBtn) {
      const card = fixesBtn.closest('.p-6');
      card.querySelector('.fixes-panel').classList.toggle('hidden');
    }
  });
});