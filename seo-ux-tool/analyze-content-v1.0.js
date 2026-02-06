export function analyzeContentQuality(html, doc) {
    let score = 100;
    const issues = [];
    const bodyText = doc.body ? doc.body.textContent.replace(/\s+/g, ' ').trim() : '';
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const lists = doc.querySelectorAll('ul, ol').length;

    if (wordCount < 300) {
      const severity = wordCount < 100 ? 40 : 30;
      score -= severity;
      issues.push({
        issue: `Thin content detected (${wordCount} words)`,
        fix: 'Users and search engines expect comprehensive, valuable content that fully addresses the topic. Expand with detailed explanations, examples, benefits, FAQs, or supporting sections while keeping it relevant and engaging. Aim for depth that satisfies user intent without unnecessary filler.'
      });
    } else if (wordCount > 3000) {
      score -= 10;
      issues.push({
        issue: `Very long content (${wordCount} words)`,
        fix: 'Long content can overwhelm readers if not well-organized. Break it into clear sections with descriptive headings, use bullet points and short paragraphs, and consider adding a table of contents. This improves scannability and keeps users engaged throughout.'
      });
    }

    if (wordCount >= 50) {
      const sentences = Math.max(1, bodyText.split(/[.!?]+/).filter(s => s.trim()).length);
      let syllableCount = 0;
      words.forEach(word => {
        let clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length === 0) return;
        if (clean.length <= 3) {
          syllableCount += 1;
          return;
        }
        let matches = clean.match(/[aeiouy]+/g);
        syllableCount += matches ? matches.length : 1;
        if (clean.endsWith('es') || clean.endsWith('ed')) {
          syllableCount = Math.max(1, syllableCount - 1);
        }
      });
      const avgSentenceLength = wordCount / sentences;
      const avgSyllables = syllableCount / wordCount;
      const fleschScore = Math.round(206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables);
      if (fleschScore < 60) {
        score -= 20;
        issues.push({
          issue: `Readability needs improvement (Flesch score: ${fleschScore})`,
          fix: 'Complex sentences and long words can make content hard to read, especially on mobile. Use shorter sentences, common words, active voice, and break text into small paragraphs. Clear, easy-to-read content keeps visitors longer and improves overall engagement.'
        });
      }
    }

    if (headings.length < 3 && wordCount > 400) {
      score -= 15;
      issues.push({
        issue: 'Insufficient heading structure',
        fix: 'Headings break up content and help users scan for relevant sections quickly. Add descriptive H2 and H3 headings every 300-400 words to create logical sections. This makes content more digestible and can improve featured snippet opportunities.'
      });
    }

    if (lists === 0 && wordCount > 500) {
      score -= 10;
      issues.push({
        issue: 'No bullet or numbered lists used',
        fix: 'Lists make information easier to scan and remember, especially on small screens. Convert features, benefits, steps, or options into bulleted or numbered lists where appropriate. This dramatically improves readability and user comprehension.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }