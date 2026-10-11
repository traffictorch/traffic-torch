// ai-voice-search-tool/modules/sentiment-quality.js
// Requires compromise.js CDN in index.html for NLP

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const positiveWords = [
  'excellent','great','positive','best','reliable','trustworthy','helpful','accurate','recommended',
  'good','amazing','awesome','fantastic','outstanding','superb','wonderful','brilliant','exceptional',
  'impressive','quality','love','like','enjoy','happy','satisfied','pleased','perfect','ideal',
  'effective','efficient','powerful','robust','secure','safe','fast','quick','easy','simple',
  'clear','concise','informative','useful','valuable','beneficial','advantage','improve','enhance',
  'boost','increase','gain','win','success','achieve','accomplish','deliver','provide','support',
  'beautiful','delight','delightful','charming','elegant','timeless','effortless','flattering',
  'romantic','feminine','soft','lightweight','breathable','comfortable','versatile','wearable',
  'crafted','considered','artisanal','signature','elevated','premium','luxurious','treasured'
];

const negativeWords = [
  'bad','poor','negative','worst','unreliable','inaccurate','confusing','misleading',
  'terrible','awful','horrible','dreadful','disappointing','frustrating','annoying','difficult',
  'hard','slow','expensive','costly','problem','issue','error','bug','fail','failure',
  'broken','useless','worthless','inferior','weak','vulnerable','unsafe','dangerous','risky',
  'complicated','complex','unclear','vague','ambiguous','limited','lack','missing','absent',
  'avoid','prevent','stop','block','hinder','obstacle','barrier','challenge','struggle','pain'
];

export function computeSentimentQuality(text) {
  if (!text || text.length < 300) {
    return {
      score: 20,
      details: {
        sentimentScore: 20,
        factualConsistency: 20,
        note: 'Insufficient text for reliable sentiment analysis. Add more factual, neutral content to improve AI voice quality score.',
        subMetrics: [
          { name: 'Sentiment Score', score: 20 },
          { name: 'Factual Consistency Signals', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp;
    const parsedText = nlp(text);
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // Sentiment Score — normalized against sentiment-bearing words
    const posCount = words.filter(w => positiveWords.includes(w)).length;
    const negCount = words.filter(w => negativeWords.includes(w)).length;
    const sentimentTotal = posCount + negCount;

    let sentimentScore;
    if (sentimentTotal === 0) {
      sentimentScore = 50; // neutral
    } else {
      const ratio = posCount / sentimentTotal;        // 0..1
      const rawScore = ratio * 100;                    // 0..100
      // Dampen toward neutral — a page with only positive words shouldn't hit 100
      sentimentScore = clamp(Math.round(50 + (rawScore - 50) * 0.65));
    }

    // Factual Consistency Signals
    const sentences = parsedText.sentences().out('array');
    const sentenceCount = sentences.length || 1;
    let inconsistencies = 0;
    sentences.forEach(s => {
      const sEntities = nlp(s).people().concat(nlp(s).places()).concat(nlp(s).organizations()).unique().out('array');
      const speculative = (s.match(/may|might|possible|could|would|should/gi) || []).length;
      if (sEntities.length > 0 && speculative > 0) inconsistencies++;
    });
    const inconsistencyRate = inconsistencies / sentenceCount * 100;
    const factualConsistency = clamp(Math.round(100 - inconsistencyRate));

    const score = clamp(Math.round((sentimentScore + factualConsistency) / 2));

    return {
      score,
      details: {
        sentimentScore,
        factualConsistency,
        subMetrics: [
          {
            name: 'Sentiment Score',
            score: sentimentScore,
            fix: 'Replace negative words with neutral or positive alternatives to maintain a trustworthy tone suitable for AI voice assistants.'
          },
          {
            name: 'Factual Consistency Signals',
            score: factualConsistency,
            fix: 'Add verifiable facts, sources, and reduce speculative language ("may", "might") to lower hallucination risk in AI-generated voice responses.'
          }
        ]
      }
    };
  } catch (error) {
    return {
      score: 0,
      details: {
        sentimentScore: 0,
        factualConsistency: 0,
        note: 'Error in analysis. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Sentiment Score', score: 0 },
          { name: 'Factual Consistency Signals', score: 0 }
        ]
      }
    };
  }
}