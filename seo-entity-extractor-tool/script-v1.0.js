import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

// Helper to detect short/thin content pages (homepages, landing pages)
function isShortContent(wordCount) {
  return wordCount < 400;
}

function analyzeCoverage(extracted, cleanedText = '') {
  const entityCount = extracted.length;
  const wordCount = cleanedText
    ? cleanedText.split(/\s+/).filter(w => w.length > 0).length
    : entityCount * 20;
  const density = wordCount > 0 ? (entityCount / wordCount) * 100 : 0;
  const isShort = isShortContent(wordCount);
  const densityGrade = 
    (density >= 0.4 && density <= 5) || (isShort && density > 0.3) 
      ? 'good' 
      : density > 0 ? 'warning' : 'bad';

  const typeCounts = extracted.reduce((acc, e) => {
    const t = e.type || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const diversity = Object.keys(typeCounts).length;
  const weightedDiversity =
    (typeCounts.CONCEPT || 0) * 1.5 +
    (typeCounts.ORGANIZATION || 0) * 1.2 +
    (typeCounts.PERSON || 0) * 1.2 +
    (typeCounts.PRODUCT || 0) * 1.1 +
    (typeCounts.LOCATION || 0) * 0.8 +
    (typeCounts.TECHNOLOGY || 0) * 0.8 +
    (typeCounts.OTHER || 0) * 0.5;

  let score = 0;
  if (entityCount < (isShort ? 4 : 8)) {
    score = Math.min(40, entityCount * (isShort ? 9 : 5));
  } else {
    if (entityCount >= (isShort ? 12 : 30)) score += 45;
    else if (entityCount >= (isShort ? 8 : 20)) score += 35;
    else if (entityCount >= (isShort ? 5 : 12)) score += 25;
    else score += 15;

    const densityBonus = entityCount >= (isShort ? 3 : 6) 
      ? Math.min(25, Math.log1p(density * 12) * 9) 
      : 0;
    score += densityBonus;

    let diversityBonus = Math.min(30, weightedDiversity * 4);
    // Bonus for local-business style: strong LOCATION + ORGANIZATION
    if (typeCounts.LOCATION >= 3 && typeCounts.ORGANIZATION >= 1) {
      diversityBonus += 10;
    }
    score += diversityBonus;

    if (diversity <= (isShort ? 2 : 3) && entityCount >= (isShort ? 5 : 8)) {
      score -= 10;
    }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const metrics = [
    { text: `Total entities: ${entityCount}`, grade: entityCount >= (isShort ? 8 : 12) ? 'good' : entityCount >= (isShort ? 5 : 6) ? 'warning' : 'bad' },
    { text: `Approx. word count: ${wordCount.toLocaleString()}`, grade: wordCount >= 800 ? 'good' : wordCount >= 400 ? 'warning' : 'bad' },
    { text: `Entity density: ${density.toFixed(2)}% (natural ~0.4–5%; higher ok on short pages)`, grade: densityGrade },
    { text: `Type diversity: ${diversity} types (${Object.entries(typeCounts).map(([t,c]) => `${c} ${t}`).join(', ')})`, grade: diversity >= (isShort ? 3 : 5) ? 'good' : diversity >= (isShort ? 2 : 3) ? 'warning' : 'bad' },
    { text: `Weighted diversity score: ${weightedDiversity.toFixed(1)} (higher = better topical signals)`, grade: weightedDiversity >= 12 ? 'good' : weightedDiversity >= 6 ? 'warning' : 'bad' }
  ];

  const failed = [];
  if (entityCount < (isShort ? 5 : 10)) {
    failed.push({ 
      text: "Entity count is low. Add more relevant named entities (brands, locations, concepts, people) naturally to build topical authority.", 
      grade: 'bad' 
    });
  }
  if (density < 0.4 && !isShort) {
    failed.push({ 
      text: "Entity density is quite low. Weave more related entities into paragraphs and headings.", 
      grade: 'bad' 
    });
  }
  if (diversity < (isShort ? 2 : 4)) {
    failed.push({ 
      text: `Limited type diversity (${diversity} types detected). Aim for ${isShort ? 'at least 2–3' : '4–5+'} types to signal broader expertise.`, 
      grade: 'bad' 
    });
  }

  return { score, metrics, failed };
}

function analyzeSalience(extracted) {
  if (!extracted || extracted.length === 0) {
    return {
      score: 20,
      metrics: [{ text: "No entities detected – salience cannot be evaluated", grade: 'bad' }],
      failed: [{ text: "No named entities found. Add prominent people, brands, concepts, or products early in content to establish clear topical focus.", grade: 'bad' }]
    };
  }
  const sorted = [...extracted]
    .map(e => ({ ...e, salience: Math.max(0, Math.min(1, e.salience || 0.4)) }))
    .sort((a, b) => b.salience - a.salience);
  const entityCount = extracted.length;
  const avgSalience = extracted.reduce((sum, e) => sum + (e.salience || 0.4), 0) / entityCount;
  const topSalience = sorted[0]?.salience || 0;
  const strongCount = sorted.filter(e => e.salience > 0.6).length;
  const veryStrongCount = sorted.filter(e => e.salience > 0.8).length;
  const salienceDrop = topSalience - (sorted[Math.min(4, sorted.length - 1)]?.salience || 0);
  const isFlat = salienceDrop < 0.25 && strongCount > 5;
let score = Math.round(avgSalience * 70); // Lower base to ~70 max for perfect avg salience (prevents instant 100)

const isMinimalPage = entityCount <= 3;    // Very few entities → limited evidence of prominence
const isLowEntityPage = entityCount <= 8;  // Broader short/focused category for tiered caps

if (isMinimalPage) {
  // Tiny entity sets (1–3) → very conservative scoring
  score = Math.min(75, Math.round(avgSalience * 90 + entityCount * 5));
  if (topSalience >= 0.92) score += 10;
  if (entityCount <= 2) score -= 15;           // Strong penalty for almost no supporting entities
} else if (isLowEntityPage) {
  // 4–8 entities → focused pages, allow higher but still cap
  score = Math.round(avgSalience * 105);       // Slightly lower multiplier than before
  if (topSalience >= 0.90) score += 18;
  if (strongCount === entityCount && entityCount >= 4) score += 15;
  if (veryStrongCount >= 1) score += 10;
  if (isFlat && entityCount >= 6) score -= 10;
} else {
  // Normal pages (9+ entities) → full scoring potential
  if (topSalience >= 0.92) score += 22;
  else if (topSalience >= 0.80) score += 15;
  else if (topSalience >= 0.65) score += 8;

  if (strongCount >= 6 && entityCount >= 12) score += 18;
  else if (strongCount >= 4 && entityCount >= 8) score += 12;
  else if (strongCount >= entityCount * 0.6) score += 8;

  if (veryStrongCount >= 2) score += 10;
  else if (veryStrongCount >= 1) score += 6;

  if (isFlat && entityCount >= 12) score -= 18;
  else if (isFlat && entityCount >= 8) score -= 10;
}

// Final realism cap
if (entityCount <= 4) {
  score = Math.min(80, score);
} else if (entityCount <= 8) {
  score = Math.min(92, score);
}

score = Math.max(0, Math.min(100, Math.round(score)));

// Final realism cap: even perfect salience can't reach 100 without enough entities
if (entityCount <= 4) {
  score = Math.min(80, score);
} else if (entityCount <= 8) {
  score = Math.min(92, score);
}

  const topEntitiesDisplay = sorted.slice(0, 3).map(e => `${e.text} (${(e.salience * 100).toFixed(0)}%)`).join(' • ');
  const metrics = [
    { text: `Average salience: ${avgSalience.toFixed(2)} (higher = more prominent entities)`, grade: avgSalience >= 0.70 ? 'good' : avgSalience >= 0.50 ? 'warning' : 'bad' },
    { text: `Top entity: ${sorted[0]?.text || 'N/A'} – ${(topSalience * 100).toFixed(0)}%`, grade: topSalience >= 0.80 ? 'good' : topSalience >= 0.60 ? 'warning' : 'bad' },
    { text: `Strong entities (>60%): ${strongCount} of ${entityCount} (${((strongCount / entityCount) * 100).toFixed(0)}%)`, grade: strongCount >= entityCount * 0.5 ? 'good' : strongCount >= entityCount * 0.3 ? 'warning' : 'bad' },
    { text: `Top 3 entities: ${topEntitiesDisplay || 'None'}`, grade: topSalience >= 0.75 ? 'good' : 'warning' },
    { text: `Distribution: ${isFlat ? 'Flat (needs clearer focus)' : 'Hierarchical (good topical emphasis)'}`, grade: !isFlat ? 'good' : 'warning' }
  ];
const failed = [];
if (topSalience < 0.65 && entityCount >= 4) {
  failed.push({ 
    text: "Primary entity salience is weak. Place your main topic/brand in title, H1, first paragraph and repeat naturally.", 
    grade: 'bad' 
  });
}
if (strongCount < Math.max(1, Math.floor(entityCount * 0.5)) && entityCount > 6) {
  failed.push({ 
    text: "Too few strongly salient entities. Move key terms to headings, bold/italic, or early sections for stronger signals.", 
    grade: 'bad' 
  });
}
if (isFlat && strongCount > 4 && entityCount >= 10) {
  failed.push({ 
    text: "Flat salience distribution. Create clearer hierarchy: make one primary entity dominant in title/headings.", 
    grade: 'bad' 
  });
}
  return { score, metrics, failed };
}

function analyzeRelationships(extracted) {
  if (!extracted || extracted.length < 2) {
    return {
      score: 15,
      metrics: [{ text: "Insufficient entities to evaluate relationships", grade: 'bad' }],
      failed: [{ text: "Too few entities detected. Add more related named entities to enable meaningful topical connections and clusters.", grade: 'bad' }]
    };
  }
  const topEntities = [...extracted]
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 15)
    .map(e => ({ text: e.text.toLowerCase(), type: e.type || 'OTHER', salience: e.salience || 0.4 }));
  let coMentionPairs = 0;
  const pairExamples = [];
  for (let i = 0; i < topEntities.length - 1; i++) {
    for (let j = i + 1; j < topEntities.length; j++) {
      coMentionPairs++;
      if (pairExamples.length < 3 && topEntities[i].salience > 0.6 && topEntities[j].salience > 0.5) {
        pairExamples.push(`${topEntities[i].text} ↔ ${topEntities[j].text}`);
      }
    }
  }
  let synergyScore = 0;
  const typePresence = new Set(topEntities.map(e => e.type));
  if (typePresence.has('CONCEPT') && (typePresence.has('ORGANIZATION') || typePresence.has('PERSON'))) synergyScore += 15;
  if (typePresence.has('PRODUCT') && typePresence.has('PERSON')) synergyScore += 12;
  if (typePresence.has('TECHNOLOGY') && typePresence.has('CONCEPT')) synergyScore += 10;
  if (typePresence.has('LOCATION') && typePresence.size > 3) synergyScore += 8;
  // Local business / place synergy (very common on homepages)
  if (typePresence.has('ORGANIZATION') && typePresence.has('LOCATION') && topEntities.filter(e => e.type === 'LOCATION').length >= 3) {
    synergyScore += 15;
  }
  const coMentionScore = Math.min(60, Math.round(Math.log1p(coMentionPairs) * 12));
  const diversityBonus = Math.min(25, typePresence.size * 6);
  let score = topEntities.length < 5
    ? Math.min(30, coMentionPairs * 6)
    : coMentionScore + synergyScore + diversityBonus;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const metrics = [
    { text: `Top entities analyzed: ${topEntities.length}`, grade: topEntities.length >= 10 ? 'good' : topEntities.length >= 6 ? 'warning' : 'bad' },
    { text: `Potential relationship pairs: ${coMentionPairs}`, grade: coMentionPairs >= 35 ? 'good' : coMentionPairs >= 15 ? 'warning' : 'bad' },
    { text: `Type synergy bonus: +${synergyScore} (complementary types detected)`, grade: synergyScore >= 20 ? 'good' : synergyScore >= 10 ? 'warning' : 'bad' },
    { text: `Example clusters: ${pairExamples.length > 0 ? pairExamples.join(' • ') : 'None prominent'}`, grade: pairExamples.length >= 2 ? 'good' : pairExamples.length === 1 ? 'warning' : 'bad' },
    { text: `Relationship strength: ${coMentionScore > 40 ? 'Strong' : coMentionScore > 20 ? 'Moderate' : 'Needs building'}`, grade: coMentionScore > 40 ? 'good' : coMentionScore > 20 ? 'warning' : 'bad' }
  ];
  const failed = [];
  if (coMentionPairs < 20 && topEntities.length > 5) failed.push({ text: "Limited entity relationships detected. Group related terms in the same sections/paragraphs to build stronger semantic clusters.", grade: 'bad' });
  if (typePresence.size < (isShortContent( /* approximate word count not available here */ 200) ? 3 : 4)) {
    failed.push({ text: `Narrow type relationships. Broaden with complementary types (e.g. add CONCEPT or PERSON if relevant).`, grade: 'bad' });
  }
  if (coMentionScore < 30) failed.push({ text: "Weak topical clustering. Create internal links between related entities and use schema markup (mainEntity, mentions, about).", grade: 'bad' });
  return { score, metrics, failed };
}

function analyzePractices(extracted) {
  if (!extracted || extracted.length === 0) {
    return {
      score: 10,
      metrics: [{ text: "No entities to evaluate practices", grade: 'bad' }],
      failed: [{ text: "No named entities detected. Add people, brands, concepts, products, or organizations to enable schema markup and on-page optimization opportunities.", grade: 'bad' }]
    };
  }
  const sorted = [...extracted].sort((a, b) => b.salience - a.salience);
  const typeCounts = extracted.reduce((acc, e) => {
    const t = e.type || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const hasPerson = !!typeCounts.PERSON;
  const hasOrg = !!typeCounts.ORGANIZATION;
  const hasProduct = !!typeCounts.PRODUCT;
  const hasConcept = !!typeCounts.CONCEPT;
  const hasLocation = !!typeCounts.LOCATION;
  const topThirdCount = Math.ceil(extracted.length * 0.3);
  const likelyHeadingEntities = sorted.slice(0, topThirdCount).length;
  const normalizedNames = new Set(
    extracted.map(e => e.text.trim().toLowerCase().replace(/\s+/g, ' '))
  );
  const consistencyPercent = (normalizedNames.size / extracted.length) * 100;
  let schemaPotential = 0;
  if (hasPerson) schemaPotential += 20;
  if (hasOrg) schemaPotential += 20;
  if (hasOrg && typeCounts.LOCATION >= 2) {
    schemaPotential += 8; // LocalBusiness / Place potential
  }
  if (hasProduct && hasPerson) schemaPotential += 15;
  if (hasConcept && extracted.length > 10) schemaPotential += 15;
  if (hasLocation) schemaPotential += 8;
  const headingScore = Math.min(25, likelyHeadingEntities * 3);
  let score = 0;
  if (extracted.length < 8) {
    score = Math.min(25, schemaPotential * 0.5 + headingScore * 0.5);
  } else {
    score += Math.min(50, schemaPotential);
    score += headingScore;
    score += Math.round(consistencyPercent * 0.15);
    if (likelyHeadingEntities >= 4) score += 10;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const metrics = [
    { text: `Schema readiness: ${schemaPotential}/50`, grade: schemaPotential >= 40 ? 'good' : schemaPotential >= 25 ? 'warning' : 'bad' },
    { text: `Likely heading entities: ~${likelyHeadingEntities} (top ${Math.round((topThirdCount / extracted.length) * 100)}% by salience)`, grade: likelyHeadingEntities >= 5 ? 'good' : likelyHeadingEntities >= 3 ? 'warning' : 'bad' },
    { text: `Name consistency: ${consistencyPercent >= 95 ? 'High' : consistencyPercent >= 80 ? 'Good' : 'Needs improvement'} (${normalizedNames.size} unique normalized names)`, grade: consistencyPercent >= 90 ? 'good' : consistencyPercent >= 75 ? 'warning' : 'bad' }
  ];
  const failed = [];
  if (schemaPotential < 30) {
    const suggestions = [];
    if (hasPerson) suggestions.push("Person");
    if (hasOrg) suggestions.push("Organization");
    if (hasProduct) suggestions.push("Product");
    if (hasConcept && extracted.length > 8) suggestions.push("Article");
    failed.push({ text: `Low schema potential (${schemaPotential}/50). Add JSON-LD markup for: ${suggestions.join(', ') || 'relevant types based on content'}.`, grade: 'bad' });
  }
  if (likelyHeadingEntities < 3 && extracted.length > 8) failed.push({ text: `Few entities likely in headings. Place top entities (e.g. ${sorted[0]?.text || 'main topic'}) in H1/H2 tags and supporting ones in H3.`, grade: 'bad' });
  if (consistencyPercent < 85) failed.push({ text: "Inconsistent entity naming detected. Standardize names across the page for better recognition by search engines.", grade: 'bad' });
  return { score, metrics, failed };
}

function analyzeReadiness(coverageScore, salienceScore, relationshipsScore, practicesScore) {
  const safe = val => (typeof val === 'number' && !isNaN(val)) ? Math.max(0, Math.min(100, val)) : 0;
  const c = safe(coverageScore);
  const s = safe(salienceScore);
  const r = safe(relationshipsScore);
  const p = safe(practicesScore);
  const weights = { coverage: 0.35, salience: 0.35, relationships: 0.15, practices: 0.15 };
  const score = Math.round(c * weights.coverage + s * weights.salience + r * weights.relationships + p * weights.practices);
  let level = score >= 85 ? 'Excellent' :
              score >= 70 ? 'Good' :
              score >= 50 ? 'Fair' : 'Needs Work';
  const levelDesc = score >= 85 ? 'Strong semantic foundation – well-positioned for entity-driven search and AI overviews.' :
                    score >= 70 ? 'Solid base – minor refinements will push toward top-tier performance.' :
                    score >= 50 ? 'Average readiness – focus on weakest areas to avoid being outranked.' :
                    'Significant gaps – prioritize core entity signals before advanced optimizations.';
  const totalWeight = c + s + r + p || 1;
  const metrics = [
    { text: `Overall Readiness: ${level} – ${levelDesc}`, grade: score >= 85 ? 'good' : score >= 70 ? 'warning' : 'bad' },
    { text: `Coverage contribution: ${Math.round((c / totalWeight) * 100)}% (${c})`, grade: c >= 75 ? 'good' : c >= 45 ? 'warning' : 'bad' },
    { text: `Salience contribution: ${Math.round((s / totalWeight) * 100)}% (${s})`, grade: s >= 75 ? 'good' : s >= 45 ? 'warning' : 'bad' },
    { text: `Relationships contribution: ${Math.round((r / totalWeight) * 100)}% (${r})`, grade: r >= 60 ? 'good' : r >= 30 ? 'warning' : 'bad' },
    { text: `Practices contribution: ${Math.round((p / totalWeight) * 100)}% (${p})`, grade: p >= 60 ? 'good' : p >= 30 ? 'warning' : 'bad' }
  ];
  const failed = [];
  if (c < 50 || s < 50) failed.push({ text: "Core signals (coverage + salience) are weak – these are the foundation for entity SEO. Strengthen entity count, diversity, and prominence first.", grade: 'bad' });
  if (r < 40) failed.push({ text: "Weak entity relationships – build topical clusters by grouping related entities in content and adding internal links with descriptive anchors.", grade: 'bad' });
  if (p < 40) failed.push({ text: "On-page practices need improvement – implement JSON-LD schema for detected entity types and use top entities in headings for better crawlability.", grade: 'bad' });
  if (score < 60) failed.push({ text: "Overall semantic readiness is low. Follow the priority order: 1) Boost coverage & salience, 2) Improve relationships, 3) Add schema & practices.", grade: 'bad' });
  return { score, metrics, failed };
}

function getGrade(score) {
  if (score >= 85) return { text: 'Excellent', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { text: 'Good', emoji: '👍', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 50) return { text: 'Fair', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Needs Work', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
}

function getModuleExplanation(moduleName) {
  const explanations = {
    'Coverage': {
      what: 'Counts total recognized entities and evaluates their type diversity and density relative to content length.',
      why: 'Strong coverage builds topical breadth and authority, helping search engines understand the page’s full subject scope and improving relevance in entity-driven rankings.'
    },
    'Salience': {
      what: 'Measures how prominently and importantly each entity appears (based on position, repetition, and context weighting).',
      why: 'High salience signals the main topics clearly, boosting the page’s ability to rank for core queries and appear in featured snippets or AI overviews.'
    },
    'Relationships': {
      what: 'Analyzes co-occurrence, type synergy, and clustering among entities to detect meaningful topical connections.',
      why: 'Strong relationships create semantic clusters, improving topical depth and helping search engines associate the page with related concepts, entities, and user intent.'
    },
    'Practices': {
      what: 'Evaluates on-page semantic optimizations: schema readiness, heading usage of entities, and name consistency.',
      why: 'Good practices make entities machine-readable, enhance crawlability, and increase chances of rich results, Knowledge Graph inclusion, and better UX signals.'
    },
    'Readiness': {
      what: 'Combines weighted scores from all modules into an overall semantic health and ranking preparedness index.',
      why: 'High readiness indicates the page is well-optimized for modern entity-based and semantic search, predicting stronger performance in competitive SERPs and AI features.'
    }
  };
  return explanations[moduleName] || { what: 'No explanation available.', why: '' };
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('entity-form');
  const results = document.getElementById('results');
  if (!form || !results) {
    console.error('Form or results container missing');
    return;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
   
    //const canProceed = await canRunTool('limit-audit-id');
    //if (!canProceed) return;
   
    const urlInput = document.getElementById('url-input');
    const inputValue = urlInput?.value.trim();
    if (!inputValue) {
      alert('Please enter a URL');
      return;
    }
    const url = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-16 min-h-[60vh]">
        <div class="relative w-28 h-28 mb-10">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="10" stroke-opacity="0.25"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="10"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 text-center max-w-2xl px-6 leading-tight">
          Fetching page content...
        </p>
        <p class="mt-5 text-lg text-gray-700 dark:text-gray-300 text-center max-w-2xl px-6">
          For very large or heavy pages.<br>
          Please wait up to 60 seconds.
        </p>
      </div>
    `;
    results.classList.remove('hidden');
    const progressText = document.getElementById('progress-text');

    const updateProgress = () => {
      let current = 0;
      const messages = [
        "Fetching page content...",
        "Extracting named entities...",
        "Analyzing coverage & density...",
        "Evaluating salience & prominence...",
        "Checking relationships & clusters...",
        "Reviewing on-page practices...",
        "Calculating overall readiness...",
        "Finalizing semantic health report..."
      ];
      const interval = setInterval(() => {
        if (current < messages.length) {
          progressText.textContent = messages[current];
          current++;
        } else {
          clearInterval(interval);
          progressText.textContent = "Finalizing your report...";
          progressText.classList.add('text-green-600', 'dark:text-green-400');
        }
      }, 4500);
      setTimeout(() => {
        if (current < messages.length) {
          progressText.textContent = "Still working — heavy page detected. Just a moment longer...";
          progressText.classList.add('text-yellow-600', 'dark:text-yellow-400');
        }
      }, 75000);
    };
    updateProgress();

    try {
      const res = await fetch("https://traffic-torch-entity-proxy.traffictorch.workers.dev/entity-analyze", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      const extracted = data.extracted || [];
      const coverage = analyzeCoverage(extracted);
      const salience = analyzeSalience(extracted);
      const relationships = analyzeRelationships(extracted);
      const practices = analyzePractices(extracted);
      const readiness = analyzeReadiness(coverage.score, salience.score, relationships.score, practices.score);
      const modules = [
        { name: 'Coverage', result: coverage, color: '#10b981', desc: 'How many & diverse entities are recognized (topical breadth)' },
        { name: 'Salience', result: salience, color: '#f59e0b', desc: 'How prominent/important the entities are (authority strength)' },
        { name: 'Relationships', result: relationships, color: '#8b5cf6', desc: 'How well entities connect & form clusters' },
        { name: 'Practices', result: practices, color: '#ec4899', desc: 'On-page SEO & semantic best practices compliance' },
        { name: 'Readiness', result: readiness, color: '#3b82f6', desc: 'Overall preparedness for semantic search & ranking' }
      ];
      const overallScore = readiness.score;
      const grade = getGrade(overallScore);
      const typeCounts = extracted.reduce((acc, e) => {
        const t = e.type || 'OTHER';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const diversitySummary = `${extracted.length} entities detected (${Object.entries(typeCounts).map(([t,c]) => `${c} ${t}`).join(', ')})`;
      const entitiesHTML = extracted.length > 0
        ? extracted.map(entity => `
            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <p class="font-bold text-gray-800 dark:text-gray-200">${entity.text || 'Unknown'}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">${entity.type || 'Unknown'}</p>
              <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.round((entity.salience || 0) * 100)}%"></div>
              </div>
              <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Salience: ${(entity.salience || 0).toFixed(2)}
              </p>
            </div>
          `).join('')
        : '<p class="text-gray-600 dark:text-gray-400 text-center py-6">No entities detected.</p>';

      results.innerHTML = `
<div class="max-w-5xl mx-auto px-4 py-8">
  <p class="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
    Scores are adaptive.
  </p>
  <!-- Big Overall Readiness Score Card -->
  <div class="flex justify-center my-10 px-4">
    <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-lg border-4 ${readiness.score >= 85 ? 'border-green-500' : readiness.score >= 70 ? 'border-emerald-400' : readiness.score >= 50 ? 'border-orange-500' : 'border-red-500'}">
      <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall Semantic Readiness</p>
      <div class="relative aspect-square w-full max-w-[280px] mx-auto">
        <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
          <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none" class="dark:stroke-gray-700"/>
          <circle cx="100" cy="100" r="90"
                  stroke="${readiness.score >= 85 ? '#22c55e' : readiness.score >= 70 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'}"
                  stroke-width="16" fill="none"
                  stroke-dasharray="${(readiness.score / 100) * 565} 565"
                  stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl md:text-7xl font-black drop-shadow-lg"
                 style="color: ${readiness.score >= 85 ? '#22c55e' : readiness.score >= 70 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'};">
              ${readiness.score}
            </div>
            <div class="text-xl md:text-2xl opacity-90 -mt-2"
                 style="color: ${readiness.score >= 85 ? '#22c55e' : readiness.score >= 70 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'};">
              /100
            </div>
          </div>
        </div>
      </div>
      ${(() => {
        const g = getGrade(readiness.score);
        return `<p class="mt-8 text-4xl md:text-5xl font-bold text-center ${g.color} drop-shadow-lg">${g.emoji} ${g.text}</p>`;
      })()}
      ${(() => {
        const pageTitle = data?.title || urlInput?.value.trim() || 'Analyzed Page';
        const truncated = pageTitle.length > 80 ? pageTitle.substring(0, 77) + '...' : pageTitle;
        return `
          <p class="mt-6 text-center text-base md:text-lg text-gray-700 dark:text-gray-300 px-4 leading-relaxed break-words">
            ${truncated}
          </p>
        `;
      })()}
      <p class="mt-6 text-center text-lg text-gray-600 dark:text-gray-300 px-4 leading-relaxed">
        ${readiness.metrics[0].text.split(' – ')[1] || 'Semantic foundation analysis complete'}
      </p>
    </div>
  </div>
  <!-- Extracted Entities -->
  <div class="mb-16">
    <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Extracted Entities</h3>
    <div class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 text-center md:text-left">
      <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
        ${diversitySummary}
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
      ${entitiesHTML}
    </div>
  </div>
  <!-- Radar Chart -->
  <div class="mb-16">
    <h3 class="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">Semantic Health Radar</h3>
    <div class="w-full max-w-2xl mx-auto aspect-square">
      <canvas id="health-radar"></canvas>
    </div>
  </div>
  <!-- Coverage + Salience side by side -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12 items-start">
    ${modules.slice(0, 2).map(mod => {
      const { score, metrics = [], failed = [] } = mod.result;
      const cardGrade = getGrade(score);
      let borderColorClass = '';
      if (cardGrade.text === 'Excellent') borderColorClass = 'border-green-500 dark:border-green-400';
      else if (cardGrade.text === 'Good') borderColorClass = 'border-emerald-500 dark:border-emerald-400';
      else if (cardGrade.text === 'Fair') borderColorClass = 'border-orange-500 dark:border-orange-400';
      else borderColorClass = 'border-red-600 dark:border-red-500';
      const arcColor = score >= 85 ? '#22c55e' :
                       score >= 70 ? '#10b981' :
                       score >= 50 ? '#f59e0b' : '#ef4444';
      return `
      <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-4 ${borderColorClass} flex flex-col min-h-[520px] md:min-h-[580px]">
        <div class="flex justify-center mb-6">
          <div class="relative w-32 h-32 mx-auto">
            <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none" class="dark:stroke-gray-700"/>
              <circle cx="64" cy="64" r="56"
                      stroke="${arcColor}"
                      stroke-width="12" fill="none"
                      stroke-dasharray="${(score / 100) * 352} 352"
                      stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-4xl font-black" style="color: ${arcColor};">${score}</div>
            </div>
          </div>
        </div>
        <p class="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">${mod.name}</p>
        ${(() => {
          const g = getGrade(score);
          return `<p class="text-center text-xl font-bold ${g.color} mb-4">${g.emoji} ${g.text}</p>`;
        })()}
        <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">${mod.desc}</p>
        <button class="details-toggle w-full py-2 px-4 mt-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition flex justify-between items-center">
  <span>More Details</span>
  <span class="details-arrow transition-transform duration-200">▼</span>
</button>
<div class="details-panel hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
  <p class="mb-3"><strong>What it measures:</strong> ${getModuleExplanation(mod.name).what}</p>
  <p><strong>Why it matters:</strong> ${getModuleExplanation(mod.name).why}</p>
</div>
        <ul class="text-sm space-y-3 mt-4 mb-4 flex-grow">
          ${metrics.map(m => {
            let emoji = '❌', color = 'text-red-600 dark:text-red-400';
            if (m.grade === 'good') { emoji = '✅'; color = 'text-green-600 dark:text-green-400'; }
            else if (m.grade === 'warning') { emoji = '⚠️'; color = 'text-orange-500 dark:text-orange-400'; }
            return `<li class="${color} flex items-start gap-3">${emoji} <span>${m.text}</span></li>`;
          }).join('')}
        </ul>
        <button class="fixes-toggle w-full py-3 px-5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition flex justify-between items-center mt-auto">
          <span>Show Fixes ${failed.length > 0 ? `(${failed.length} items)` : ''}</span>
          <span class="arrow transition-transform duration-200">▼</span>
        </button>
        <div class="fixes-panel hidden mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
${failed.length > 0 ? `
  <ul class="space-y-4 text-sm">
    ${failed.map(f => {
      let emoji = f.grade === 'bad' ? '❌' : '⚠️';
      let color = f.grade === 'bad' 
        ? 'text-red-700 dark:text-red-300' 
        : 'text-orange-600 dark:text-orange-400';
      return `<li class="${color} flex items-start gap-3">${emoji} <span>${f.text}</span></li>`;
    }).join('')}
  </ul>
` : `
  <p class="text-center text-green-600 dark:text-green-400 font-medium py-3">✅ All major signals strong – only minor tweaks may help.</p>
`}
        </div>
      </div>
      `;
    }).join('')}
  </div>
  <!-- Relationships + Practices + Readiness -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    ${modules.slice(2).map(mod => {
      const { score, metrics = [], failed = [] } = mod.result;
      const cardGrade = getGrade(score);
      let borderColorClass = '';
      if (cardGrade.text === 'Excellent') borderColorClass = 'border-green-500 dark:border-green-400';
      else if (cardGrade.text === 'Good') borderColorClass = 'border-emerald-500 dark:border-emerald-400';
      else if (cardGrade.text === 'Fair') borderColorClass = 'border-orange-500 dark:border-orange-400';
      else borderColorClass = 'border-red-600 dark:border-red-500';
      const arcColor = score >= 85 ? '#22c55e' :
                       score >= 70 ? '#10b981' :
                       score >= 50 ? '#f59e0b' : '#ef4444';
      return `
      <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-4 ${borderColorClass} flex flex-col min-h-[540px]">
        <div class="flex justify-center mb-6">
          <div class="relative w-32 h-32 mx-auto">
            <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none" class="dark:stroke-gray-700"/>
              <circle cx="64" cy="64" r="56"
                      stroke="${arcColor}"
                      stroke-width="12" fill="none"
                      stroke-dasharray="${(score / 100) * 352} 352"
                      stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-4xl font-black" style="color: ${arcColor};">${score}</div>
            </div>
          </div>
        </div>
        <p class="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">${mod.name}</p>
        ${(() => {
          const g = getGrade(score);
          return `<p class="text-center text-xl font-bold ${g.color} mb-4">${g.emoji} ${g.text}</p>`;
        })()}
        <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">${mod.desc}</p>
        <button class="details-toggle w-full py-2 px-4 mt-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition flex justify-between items-center">
  <span>More Details</span>
  <span class="details-arrow transition-transform duration-200">▼</span>
</button>
<div class="details-panel hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
  <p class="mb-3"><strong>What it measures:</strong> ${getModuleExplanation(mod.name).what}</p>
  <p><strong>Why it matters:</strong> ${getModuleExplanation(mod.name).why}</p>
</div>
        <ul class="text-sm space-y-3 mt-4 mb-4 flex-grow">
          ${metrics.map(m => {
            let emoji = '❌', color = 'text-red-600 dark:text-red-400';
            if (m.grade === 'good') { emoji = '✅'; color = 'text-green-600 dark:text-green-400'; }
            else if (m.grade === 'warning') { emoji = '⚠️'; color = 'text-orange-500 dark:text-orange-400'; }
            return `<li class="${color} flex items-start gap-3">${emoji} <span>${m.text}</span></li>`;
          }).join('')}
        </ul>
        <button class="fixes-toggle w-full py-3 px-5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition flex justify-between items-center mt-auto">
          <span>Show Fixes ${failed.length > 0 ? `(${failed.length} items)` : ''}</span>
          <span class="arrow transition-transform duration-200">▼</span>
        </button>
        <div class="fixes-panel hidden mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
${failed.length > 0 ? `
  <ul class="space-y-4 text-sm">
    ${failed.map(f => {
      let emoji = f.grade === 'bad' ? '❌' : '⚠️';
      let color = f.grade === 'bad' 
        ? 'text-red-700 dark:text-red-300' 
        : 'text-orange-600 dark:text-orange-400';
      return `<li class="${color} flex items-start gap-3">${emoji} <span>${f.text}</span></li>`;
    }).join('')}
  </ul>
` : `
  <p class="text-center text-green-600 dark:text-green-400 font-medium py-3">✅ All major signals strong – only minor tweaks may help.</p>
`}
        </div>
      </div>
      `;
    }).join('')}
  </div>
  <!-- Share / Save / Feedback Buttons -->
  <div class="text-center my-16 px-4">
    <div class="flex flex-col sm:flex-row justify-center gap-6 mb-8">
      <button id="share-report-btn"
              class="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
        Share Report ↗️
      </button>
      <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
              class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
        Save Report 📥
      </button>
      <button id="feedback-btn"
              class="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
        Submit Feedback 💬
      </button>
    </div>
    <div id="share-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto"></div>
  </div>
</div>
      `;
      
      // Force-reset all panels to closed state after render (fixes stale open states)
setTimeout(() => {
  const allPanels = results.querySelectorAll('.fixes-panel, .details-panel');
  const allArrows = results.querySelectorAll('.arrow, .details-arrow');
  
  allPanels.forEach(p => p.classList.add('hidden'));
  allArrows.forEach(a => {
    a.classList.remove('rotate-180');
    a.textContent = '▼';
  });
}, 50); // Small delay to ensure DOM is painted

      // Radar chart
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (window.myRadarChart) window.myRadarChart.destroy();
        window.myRadarChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: modules.map(m => m.name),
            datasets: [{
              label: 'Semantic Health',
              data: modules.map(m => m.result.score),
              backgroundColor: 'rgba(251, 146, 60, 0.18)',
              borderColor: '#fb923c',
              borderWidth: 3,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#fb923c',
              pointRadius: 5,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20, color: '#9ca3af', backdropColor: 'transparent' },
                grid: { color: 'rgba(156,163,175,0.4)' },
                angleLines: { color: 'rgba(156,163,175,0.4)' },
                pointLabels: { color: '#9ca3af', font: { size: 14, weight: '600' } }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }, 400);

      initShareReport(results);
      initSubmitFeedback(results);

results.addEventListener('click', function(e) {
  // Use function(e) instead of arrow to preserve 'this' if needed later
  let button = e.target.closest('.fixes-toggle, .details-toggle');
  if (!button) return;

  e.preventDefault();
  e.stopPropagation(); // Crucial to prevent parent listeners from interfering

  const panel = button.nextElementSibling;
  const arrow = button.querySelector('.arrow, .details-arrow');

  if (!panel || !arrow) {
    console.warn('Toggle button clicked but panel or arrow missing:', button);
    return;
  }

  console.log(`Toggle activated: ${button.classList.contains('fixes-toggle') ? 'Fixes' : 'Details'}`);

  const wasHidden = panel.classList.contains('hidden');
  
  // Toggle visibility
  panel.classList.toggle('hidden');
  
  // Update arrow
  arrow.classList.toggle('rotate-180', !wasHidden);
  arrow.textContent = wasHidden ? '▲' : '▼';
});

    } catch (err) {
      console.error('Analysis error:', err);
      results.innerHTML = `
        <div class="text-center py-12 px-6">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Analysis could not complete</p>
          <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
            ${err.message.includes('timeout') || err.message.includes('fetch')
              ? 'The page is very large or took too long to load. Try a smaller page or check your internet connection.'
              : err.message || 'An unexpected error occurred. Please try again or check the console for details.'}
          </p>
          <button onclick="location.reload()" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl">
            Try Again
          </button>
        </div>
      `;
    }
  });
});