// ai-voice-search-tool/modules/content-quality.js
// Requires compromise.js CDN in index.html for NLP

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

export function computeContentQuality(text) {
  if (!text || text.length < 300) {
    return {
      score: 20,
      details: {
        readability: 20,
        conciseness: 20,
        pronounRatio: 20,
        entityCoverage: 20,
        note: 'Insufficient text for reliable assessment. Add more descriptive content (300+ words) to improve AI voice optimization score.',
        subMetrics: [
          { name: 'Readability Score', score: 20 },
          { name: 'Answer Conciseness', score: 20 },
          { name: 'Pronoun Ratio', score: 20 },
          { name: 'Entity Coverage', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp;
    const parsedText = nlp(text);
    const sentences = parsedText.sentences().out('array');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentenceCount = sentences.length || 1;

    const avgLength = sentences.length
      ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentenceCount
      : 0;

    // Non-prose detection (nav dumps, product grids, unsplit text)
    const isNonProse = avgLength > 60 || words.length < 200;

    let readability;

    if (isNonProse) {
      readability = 40; // neutral
    } else {
      const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
      const flesch = 206.835 - 1.015 * (words.length / sentenceCount) - 84.6 * (syllables / words.length);
      readability = clamp(Math.round(flesch));
    }

    // Answer Conciseness — based on paragraph length (ideal 40-60 words)
    let conciseness;
    const textParas = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 20);

    if (textParas.length >= 3) {
      let totalScore = 0;
      textParas.forEach(p => {
        const wc = p.split(/\s+/).length;
        let s;
        if (wc >= 40 && wc <= 60) s = 1;
        else if (wc >= 25 && wc < 40) s = 0.6;
        else if (wc > 60 && wc <= 80) s = 0.6;
        else if (wc >= 15 && wc < 25) s = 0.3;
        else if (wc > 80) s = 0.2;
        else s = 0.1;
        totalScore += s;
      });
      conciseness = clamp(Math.round((totalScore / textParas.length) * 100));
    } else {
      // Fallback to sentence-length based
      conciseness = clamp(Math.round(100 - Math.abs(avgLength - 20) * 4));
    }

    // Pronoun Ratio (target 15%)
    const pronouns = parsedText.pronouns().out('array').length;
    const pronounRatioRaw = (pronouns / words.length) * 100;
    const pronounRatio = clamp(Math.round((pronounRatioRaw / 15) * 100));

    // Entity Coverage (target 8%)
    const entities = parsedText.people().concat(parsedText.places()).concat(parsedText.organizations()).unique().out('array');
    const entityCoverageRaw = (entities.length / words.length) * 100;
    const entityCoverage = clamp(Math.round((entityCoverageRaw / 8) * 100));

    const score = clamp(Math.round((readability + conciseness + pronounRatio + entityCoverage) / 4));

    return {
      score,
      details: {
        readability,
        conciseness,
        pronounRatio,
        entityCoverage,
        subMetrics: [
          {
            name: 'Readability Score',
            score: readability,
            fix: 'Aim for Flesch-Kincaid grade 6-8 by shortening sentences, using simpler words, and breaking up complex ideas to make content easier for AI voice synthesis and natural readout.'
          },
          {
            name: 'Answer Conciseness',
            score: conciseness,
            fix: 'Keep direct-answer paragraphs between 40-60 words; split long sentences and remove unnecessary details to match the ideal length for featured snippets and voice responses.'
          },
          {
            name: 'Pronoun Ratio',
            score: pronounRatio,
            fix: 'Increase first/second-person pronouns ("I", "you", "we") to create a more conversational tone that aligns with how people speak in voice queries.'
          },
          {
            name: 'Entity Coverage',
            score: entityCoverage,
            fix: 'Add more named entities (people, places, brands, organizations) related to your topic to boost E-E-A-T signals and improve AI recognition/citation in voice results.'
          }
        ]
      }
    };
  } catch (error) {
    return {
      score: 0,
      details: {
        readability: 0,
        conciseness: 0,
        pronounRatio: 0,
        entityCoverage: 0,
        note: 'Error in assessment. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Readability Score', score: 0 },
          { name: 'Answer Conciseness', score: 0 },
          { name: 'Pronoun Ratio', score: 0 },
          { name: 'Entity Coverage', score: 0 }
        ]
      }
    };
  }
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  return (word.match(/[aeiouy]{1,2}/g) || []).length || 1;
}