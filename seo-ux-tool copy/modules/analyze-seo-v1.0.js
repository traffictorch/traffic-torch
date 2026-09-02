export function analyzeSEO(html, doc) {
    let score = 100;
    const issues = [];
    const title = doc.querySelector('title')?.textContent.trim() || '';
    const desc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
    const mainHeadingElement = doc.querySelector('h1') || doc.querySelector('h2') || doc.querySelector('h3');
    const mainHeadingText = mainHeadingElement?.textContent.trim() || '';
    let primaryKeywordRaw = '';
    if (title) {
      const sections = title.split(/[\|\–\-\—]/);
      primaryKeywordRaw = sections[0].trim();
    }
    const cleanedKeyword = primaryKeywordRaw
      .toLowerCase()
      .replace(/\b(the|a|an|and|or|best|top|official|tool|analyzer|analysis|vs|comparison|torch|traffic)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
    const keywordParts = cleanedKeyword.split(/\s+/).filter(part => part.length >= 3);
    function fuzzyMatch(headingLower) {
      if (keywordParts.length === 0) return true;
      let matches = 0;
      keywordParts.forEach(part => {
        if (headingLower.includes(part)) matches++;
        else if (headingLower.includes(part.substring(0, part.length - 1)) || headingLower.includes(part.substring(1))) matches += 0.7;
        else if (headingLower.split(' ').some(word => word.length >= 4 && (word.includes(part) || part.includes(word)))) matches += 0.5;
      });
      const ratio = matches / keywordParts.length;
      return ratio >= 0.4 || matches >= 2;
    }
    if (primaryKeywordRaw && mainHeadingText) {
      const headingLower = mainHeadingText.toLowerCase();
      if (!fuzzyMatch(headingLower)) {
        score -= 10;
        issues.push({
          issue: `Main heading could better align with page focus (“${primaryKeywordRaw}”)`,
          fix: 'Include key terms from your title naturally in the H1/H2. This helps search engines and users immediately understand the page topic. Exact match isn’t needed — close variants work well.'
        });
      }
    }
    const imgs = doc.querySelectorAll('img');
    const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
    const robots = doc.querySelector('meta[name="robots"]');
    if (!title) {
      score -= 25;
      issues.push({
        issue: 'Missing <title> tag',
        fix: 'Page titles are crucial for telling search engines and users what the page is about. Include your primary keyword naturally near the beginning and keep the title between 50-60 characters to avoid truncation in search results. This improves click-through rates and helps with ranking for relevant queries.'
      });
    } else {
      if (title.length < 30) {
        score -= 18;
        issues.push({
          issue: `Title too short (${title.length} characters)`,
          fix: 'Short titles may not provide enough context for search engines or users. Aim for 50-60 characters by including the primary keyword and a compelling description. Well-crafted titles can significantly boost click-through rates from search results.'
        });
      }
      if (title.length > 65) {
        score -= 18;
        issues.push({
          issue: `Title too long (${title.length} characters)`,
          fix: 'Long titles get truncated in search results, reducing their effectiveness. Keep titles under 60 characters while including the main keyword early on. This ensures the full title displays properly and encourages more clicks.'
        });
      }
    }
    if (!desc) {
      score -= 20;
      issues.push({
        issue: 'Missing meta description',
        fix: 'Meta descriptions summarize page content and appear in search results to entice clicks. Write a unique 150-160 character description including the target keyword naturally. Compelling meta descriptions can improve click-through rates even if they don\'t directly affect rankings.'
      });
    } else {
      if (desc.length < 100) {
        score -= 12;
        issues.push({
          issue: `Meta description too short (${desc.length} characters)`,
          fix: 'Short meta descriptions may not fully convey the page\'s value to searchers. Expand to 150-160 characters with a natural inclusion of the primary keyword and a call to action. This helps increase clicks from search engine results pages.'
        });
      }
      if (desc.length > 160) {
        score -= 12;
        issues.push({
          issue: `Meta description too long (${desc.length} characters)`,
          fix: 'Overly long meta descriptions get cut off in search results. Trim to 150-160 characters while keeping the most important information and keywords at the start. This ensures the full description is visible and effective at driving traffic.'
        });
      }
    }
    if (!mainHeadingElement) {
      score -= 8;
      issues.push({
        issue: 'No main heading',
        fix: 'The H1 heading is the main title of your page and helps search engines understand the primary topic. Use one clear H1 that includes the target keyword naturally. This improves on-page SEO and user experience by setting clear expectations.'
      });
    }
    if (doc.querySelector('meta[name="keywords"]')) {
      score -= 8;
      issues.push({
        issue: 'Meta keywords tag found',
        fix: 'The meta keywords tag has been ignored by major search engines for years and serves no purpose. Remove it entirely to keep your code clean and modern. Focusing on quality content and other on-page elements is far more effective today.'
      });
    }
    if (!doc.querySelector('meta[property="og:title"], meta[name="twitter:card"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing Open Graph / Twitter cards',
        fix: 'Social sharing relies on metadata to create attractive previews with titles, descriptions, and images. Add Open Graph tags for Facebook and Twitter Card tags for X/Twitter to control how links appear. This encourages more shares and drives additional traffic.'
      });
    }
    if (robots && /noindex/i.test(robots.content)) {
      score -= 30;
      issues.push({
        issue: 'Page blocked from Google (noindex)',
        fix: 'The noindex directive prevents the page from appearing in search results, which is only useful for staging or private pages. Remove it or set to index,follow for public pages you want visible. Always double-check before deploying changes.'
      });
    }
    if (!doc.querySelector('script[type="application/ld+json"], [itemscope]')) {
      score -= 10;
      issues.push({
        issue: 'No structured data (schema)',
        fix: 'Without schema markup, search engines miss opportunities to show rich results like stars or FAQs. Add JSON-LD schema for relevant types (e.g., Article, Product) in the page head. This enhances visibility in search results and can increase click-through rates.'
      });
    }
    if (noAlt.length) {
      score -= Math.min(20, noAlt.length * 5);
      issues.push({
        issue: `${noAlt.length} images missing alt text`,
        fix: 'Alt text describes images for users who can’t see them and helps with image search rankings. Provide concise, relevant descriptions for every image, or use empty alt for purely decorative ones. This also improves accessibility and ensures screen readers convey meaningful information.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }