import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

function analyzeCoverage(extracted, cleanedText = '') {
  const entityCount = extracted.length;
  // Approximate word count if cleanedText not provided (fallback)
  const wordCount = cleanedText
    ? cleanedText.split(/\s+/).filter(w => w.length > 0).length
    : entityCount * 20; // rough estimate: ~20 words per entity on average
  const density = wordCount > 0 ? (entityCount / wordCount) * 100 : 0;
  // Count types with SEO-relevant weighting
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
  // Scoring logic (0-100) – balanced for all page types
  let score = 0;
  // Hard minimum: very low entity count caps score severely
  if (entityCount < 6) {
    score = Math.min(30, entityCount * 5);
  } else {
    // Entity count tiered scoring
    if (entityCount >= 30) score += 45;
    else if (entityCount >= 20) score += 40;
    else if (entityCount >= 12) score += 30;
    else if (entityCount >= 6) score += 20;
    // Density bonus – only if count is reasonable
    const densityBonus = entityCount >= 6 ? Math.min(20, Math.log1p(density * 10) * 8) : 0;
    score += densityBonus;
    // Diversity bonus – only meaningful if count >=6
    score += entityCount >= 6 ? Math.min(25, weightedDiversity * 3.5) : 0;
    // Small penalty if extremely low diversity with some entities
    if (diversity <= 2 && entityCount >= 6) {
      score -= 15;
    }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  // Metrics for display (educational & concise)
  const metrics = [
    `Total entities: ${entityCount}`,
    `Approx. word count: ${wordCount.toLocaleString()}`,
    `Entity density: ${density.toFixed(2)}% (ideal: 0.8–2.5% for topical pages)`,
    `Type diversity: ${diversity} types (${Object.entries(typeCounts).map(([t, c]) => `${c} ${t}`).join(', ')})`,
    `Weighted diversity score: ${weightedDiversity.toFixed(1)} (higher = better topical signals)`
  ];
  // Actionable failed items (targeted fixes)
  const failed = [];
  if (entityCount < 12) {
    failed.push({ name: { text: "Entity count is low. Add more named entities (people, brands, concepts, products) naturally throughout the content to build stronger topical authority." } });
  }
  if (density < 0.6 && entityCount > 0) {
    failed.push("Entity density is below optimal. Entities are too sparse – try weaving more related terms and names into paragraphs, headings, and lists.");
  }
  if (diversity < 4) {
    failed.push("Limited type diversity. Most pages benefit from at least 4–5 types (e.g. CONCEPT + ORGANIZATION + PERSON + LOCATION). Include a broader range to signal expertise.");
  }
  // Intent-specific checks
  const hasPerson = typeCounts.PERSON > 0;
  const hasProduct = typeCounts.PRODUCT > 0;
  const hasConcept = typeCounts.CONCEPT > 0;
  const hasOrg = typeCounts.ORGANIZATION > 0;
  if (hasPerson && hasProduct && entityCount > 10 && !hasOrg) {
    failed.push("Author/product-heavy page detected but no organizations/brands. Consider mentioning publishers, platforms, or companies (e.g. Google Play, YouTube) to strengthen E-E-A-T.");
  }
  if (hasConcept && entityCount > 15 && diversity < 5) {
    failed.push("Strong concept coverage but narrow types. Add supporting entities (e.g. PEOPLE who pioneered ideas, TECHNOLOGIES used, LOCATIONS relevant) for richer semantic signals.");
  }
  return { score, metrics, failed };
}

function analyzeSalience(extracted) {
  if (!extracted || extracted.length === 0) {
    return {
      score: 20,
      metrics: ["No entities detected – salience cannot be evaluated"],
      failed: [
        "No named entities found. Add prominent people, brands, concepts, or products early in content to establish clear topical focus."
      ]
    };
  }
  // Sort descending by salience (ensure valid numbers 0–1)
  const sorted = [...extracted]
    .map(e => ({ ...e, salience: Math.max(0, Math.min(1, e.salience || 0.4)) }))
    .sort((a, b) => b.salience - a.salience);
  const entityCount = extracted.length; // Defined once here from input array
  const avgSalience = extracted.reduce((sum, e) => sum + (e.salience || 0.4), 0) / entityCount;
  const topSalience = sorted[0]?.salience || 0;
  const strongCount = sorted.filter(e => e.salience > 0.6).length;
  const veryStrongCount = sorted.filter(e => e.salience > 0.8).length;
  // Detect flat vs hierarchical distribution
  const salienceDrop = topSalience - (sorted[Math.min(4, sorted.length - 1)]?.salience || 0);
  const isFlat = salienceDrop < 0.25 && strongCount > 5;
  // Scoring (0–100) – balanced across page types
  let score = Math.round(avgSalience * 80); // base from average
  // Top entity strength tiers – stricter for low count
  if (entityCount < 6) {
    score = Math.min(40, Math.round(avgSalience * 120)); // cap low-entity pages
  } else {
    if (topSalience >= 0.90) score += 20;
    else if (topSalience >= 0.70) score += 15;
    else if (topSalience >= 0.50) score += 8;
    if (strongCount >= 5 && entityCount >= 10) score += 15;
    else if (strongCount >= 3 && entityCount >= 8) score += 10;
    else if (strongCount >= 1) score += 5;
    if (veryStrongCount >= 1 && entityCount >= 6) score += 8;
    if (isFlat && entityCount >= 8) score -= 12;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  // Educational metrics
  const topEntitiesDisplay = sorted
    .slice(0, 3)
    .map(e => `${e.text} (${(e.salience * 100).toFixed(0)}%)`)
    .join(' • ');
  const metrics = [
    `Average salience: ${avgSalience.toFixed(2)} (higher = more prominent entities)`,
    `Top entity: ${sorted[0]?.text || 'N/A'} – ${(topSalience * 100).toFixed(0)}%`,
    `Strong entities (>60%): ${strongCount} of ${extracted.length} (${((strongCount / extracted.length) * 100).toFixed(0)}%)`,
    `Top 3 entities: ${topEntitiesDisplay}`,
    `Distribution: ${isFlat ? 'Flat (needs clearer focus)' : 'Hierarchical (good topical emphasis)'}`
  ];
  // Actionable failed items
  const failed = [];
  if (topSalience < 0.70) {
    failed.push(
      "Primary entity salience is weak (<70%). Place your main topic/brand/person in the page title, H1, first paragraph, first paragraph, and repeat naturally to boost prominence."
    );
  }
  if (strongCount < 3 && extracted.length > 10) {
    failed.push(
      "Few strongly salient entities. Most entities have low prominence – move key terms to headings (H2/H3), bold/italic, or first sections to create stronger authority signals."
    );
  }
  if (isFlat && strongCount > 4) {
    failed.push(
      "Flat salience distribution detected (entities have similar importance). Create clearer hierarchy: make one primary entity dominant in title/headings, then support with secondary ones."
    );
  }
  if (avgSalience < 0.40 && extracted.length > 5) {
    failed.push(
      "Overall low salience. Entities lack emphasis – increase frequency of top terms, use them in context-rich sentences, and consider schema markup to reinforce importance."
    );
  }
  return { score, metrics, failed };
}

function analyzeRelationships(extracted) {
  if (!extracted || extracted.length < 2) {
    return {
      score: 15,
      metrics: ["Insufficient entities to evaluate relationships"],
      failed: [
        "Too few entities detected. Add more related named entities (people, brands, concepts, products) to enable meaningful topical connections and clusters."
      ]
    };
  }
  // Sort by salience descending, take top 15 for relationship analysis (performance + focus)
  const topEntities = [...extracted]
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 15)
    .map(e => ({
      text: e.text.toLowerCase(),
      type: e.type || 'OTHER',
      salience: e.salience || 0.4
    }));
  // Count co-occurrences: every pair in the top list is considered "related" (AI already grouped them semantically)
  // This is a strong proxy since Llama extracts related entities together
  let coMentionPairs = 0;
  const pairExamples = []; // for metrics display
  for (let i = 0; i < topEntities.length - 1; i++) {
    for (let j = i + 1; j < topEntities.length; j++) {
      coMentionPairs++;
      // Collect a few illustrative pairs (highest salience first)
      if (pairExamples.length < 3 && topEntities[i].salience > 0.6 && topEntities[j].salience > 0.5) {
        pairExamples.push(`${topEntities[i].text} ↔ ${topEntities[j].text}`);
      }
    }
  }
  // Type synergy bonus: reward complementary types (SEO signals)
  let synergyScore = 0;
  const typePresence = new Set(topEntities.map(e => e.type));
  if (typePresence.has('CONCEPT') && (typePresence.has('ORGANIZATION') || typePresence.has('PERSON'))) synergyScore += 15;
  if (typePresence.has('PRODUCT') && typePresence.has('PERSON')) synergyScore += 12;
  if (typePresence.has('TECHNOLOGY') && typePresence.has('CONCEPT')) synergyScore += 10;
  if (typePresence.has('LOCATION') && typePresence.size > 3) synergyScore += 8;
  // Scoring (0–100)
  // Co-mentions (max 60): logarithmic to reward depth without over-scaling
  const coMentionScore = Math.min(60, Math.round(Math.log1p(coMentionPairs) * 12));
  // Synergy & diversity (max 40)
  const diversityBonus = Math.min(25, typePresence.size * 6);
  let score = 0;
  if (topEntities.length < 5) {
    score = Math.min(30, coMentionPairs * 6);
  } else {
    score = coMentionScore + synergyScore + diversityBonus;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  // Educational metrics
  const metrics = [
    `Top entities analyzed: ${topEntities.length}`,
    `Potential relationship pairs: ${coMentionPairs} (all top entities considered related via extraction)`,
    `Type synergy bonus: +${synergyScore} (complementary types detected)`,
    `Example clusters: ${pairExamples.length > 0 ? pairExamples.join(' • ') : 'None prominent'}`,
    `Relationship strength: ${coMentionScore > 40 ? 'Strong' : coMentionScore > 20 ? 'Moderate' : 'Needs building'}`
  ];
  // Actionable failed items
  const failed = [];
  if (coMentionPairs < 20 && topEntities.length > 5) {
    failed.push(
      "Limited entity relationships detected. Entities appear isolated – group related terms (e.g. main topic + supporting brands/people/concepts) in the same sections/paragraphs to build stronger semantic clusters."
    );
  }
  if (typePresence.size < 4) {
    failed.push(
      "Narrow type relationships. Broaden connections by including complementary entity types (e.g. add PEOPLE or ORGANIZATIONS to CONCEPT-heavy pages, or LOCATIONS to global topics) for richer topical signals."
    );
  }
  if (coMentionScore < 30) {
    failed.push(
      "Weak topical clustering. Create internal links between pages mentioning related entities (anchor text = entity names) and use schema markup (e.g. mainEntity, mentions, about) to explicitly define relationships."
    );
  }
  return { score, metrics, failed };
}

function analyzePractices(extracted) {
  if (!extracted || extracted.length === 0) {
    return {
      score: 10,
      metrics: ["No entities to evaluate practices"],
      failed: [
        "No named entities detected. Add people, brands, concepts, products, or organizations to enable schema markup and on-page optimization opportunities."
      ]
    };
  }
  // ── All declarations first ──
  const sorted = [...extracted].sort((a, b) => b.salience - a.salience);
  const typeCounts = extracted.reduce((acc, e) => {
    const t = e.type || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const hasPerson = typeCounts.PERSON > 0;
  const hasOrg = typeCounts.ORGANIZATION > 0;
  const hasProduct = typeCounts.PRODUCT > 0;
  const hasConcept = typeCounts.CONCEPT > 0;
  const hasLocation = typeCounts.LOCATION > 0;
  // Estimate heading usage: top 30% most salient entities assumed likely in headings
  const topThirdCount = Math.ceil(extracted.length * 0.3);
  const likelyHeadingEntities = sorted.slice(0, topThirdCount).length;
  // Naming consistency check
  const normalizedNames = new Set(
    extracted.map(e => e.text.trim().toLowerCase().replace(/\s+/g, ' '))
  );
  const consistencyPercent = (normalizedNames.size / extracted.length) * 100;
  const consistencyLabel = consistencyPercent >= 95 ? 'High' :
                           consistencyPercent >= 80 ? 'Good' : 'Needs improvement';
  // ── Now calculate schema potential (after all deps are ready) ──
  let schemaPotential = 0;
  if (hasPerson) schemaPotential += 20;
  if (hasOrg) schemaPotential += 20;
  if (hasProduct && hasPerson) schemaPotential += 15;
  if (hasConcept && extracted.length > 10) schemaPotential += 15;
  if (hasLocation) schemaPotential += 8;
  // ── Heading prominence estimate (max 25) ──
  const headingScore = Math.min(25, likelyHeadingEntities * 3);
  // ── Final scoring (now safe) ──
  let score = 0;
  // Low-entity cap first
  if (extracted.length < 8) {
    score = Math.min(25, schemaPotential * 0.5 + headingScore * 0.5);
  } else {
    score += Math.min(50, schemaPotential);
    score += headingScore;
    score += Math.round(consistencyPercent * 0.15);
    if (likelyHeadingEntities >= 4) score += 10;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  // ── Metrics ──
  const metrics = [
    `Schema readiness: ${schemaPotential}/50 (${hasPerson ? 'Person' : ''}${hasOrg ? ', Organization' : ''}${hasProduct ? ', Product/Book' : ''}${hasConcept ? ', Article potential' : ''})`,
    `Likely heading entities: ~${likelyHeadingEntities} (top ${Math.round((topThirdCount / extracted.length) * 100)}% by salience)`,
    `Name consistency: ${consistencyLabel} (${normalizedNames.size} unique normalized names)`,
    `Recommended schema types: ${getSchemaSuggestions(typeCounts)}`
  ];
  // ── Failed items ──
  const failed = [];
  if (schemaPotential < 30) {
    const suggestions = [];
    if (hasPerson && !hasOrg) suggestions.push("Person");
    if (hasOrg) suggestions.push("Organization");
    if (hasProduct) suggestions.push("Product or Book");
    if (hasConcept && extracted.length > 8) suggestions.push("Article or WebPage");
    failed.push(
      `Low schema potential (${schemaPotential}/50). Add JSON-LD markup for: ${suggestions.join(', ') || 'relevant types based on content'}. This boosts rich results and E-E-A-T.`
    );
  }
  if (likelyHeadingEntities < 3 && extracted.length > 8) {
    failed.push(
      `Few entities likely in headings. Place top entities (e.g. ${sorted[0]?.text || 'main topic'}) in H1/H2 tags and supporting ones in H3 to improve crawlability and prominence.`
    );
  }
  if (consistencyPercent < 85) {
    failed.push(
      "Inconsistent entity naming detected. Standardize names (e.g. always 'Ylia Callan' not mixed casing/variations) across the page for better recognition by search engines."
    );
  }
  if (!hasConcept && extracted.length > 5) {
    failed.push(
      "Missing abstract CONCEPT entities. Include key topics/ideas (e.g. 'search engine optimization', 'consciousness') to strengthen semantic depth and topical authority."
    );
  }
  return { score, metrics, failed };
}

// Helper (unchanged)
function getSchemaSuggestions(typeCounts) {
  const suggestions = [];
  if (typeCounts.PERSON) suggestions.push("Person");
  if (typeCounts.ORGANIZATION) suggestions.push("Organization");
  if (typeCounts.PRODUCT) suggestions.push("Product");
  if (typeCounts.CONCEPT && Object.keys(typeCounts).length > 3) suggestions.push("Article");
  return suggestions.length > 0 ? suggestions.join(', ') : "Start with Article or Organization";
}

function analyzeReadiness(coverageScore, salienceScore, relationshipsScore, practicesScore) {
  // Safeguard invalid/missing scores
  const safe = (val) => (typeof val === 'number' && !isNaN(val)) ? Math.max(0, Math.min(100, val)) : 0;
  const c = safe(coverageScore);
  const s = safe(salienceScore);
  const r = safe(relationshipsScore);
  const p = safe(practicesScore);
  // Weighted average – latest SEO priority (2025–2026): coverage & salience dominate
  const weights = { coverage: 0.35, salience: 0.35, relationships: 0.15, practices: 0.15 };
  let total =
    c * weights.coverage +
    s * weights.salience +
    r * weights.relationships +
    p * weights.practices;
  const score = Math.round(total);
  // Dynamic readiness level with brief explanation
  let level = '';
  let levelDesc = '';
  if (score >= 85) {
    level = 'Excellent';
    levelDesc = 'Strong semantic foundation – well-positioned for entity-driven search and AI overviews.';
  } else if (score >= 70) {
    level = 'Good';
    levelDesc = 'Solid base – minor refinements will push toward top-tier performance.';
  } else if (score >= 50) {
    level = 'Fair';
    levelDesc = 'Average readiness – focus on weakest areas to avoid being outranked.';
  } else {
    level = 'Needs Work';
    levelDesc = 'Significant gaps – prioritize core entity signals before advanced optimizations.';
  }
  // Contribution percentages for transparency
  const totalWeight = c + s + r + p || 1; // avoid div by zero
  const metrics = [
    `Overall Readiness: ${level} – ${levelDesc}`,
    `Final score: ${score}/100`,
    `Coverage contribution: ${Math.round((c / totalWeight) * 100)}% (${c})`,
    `Salience contribution: ${Math.round((s / totalWeight) * 100)}% (${s})`,
    `Relationships contribution: ${Math.round((r / totalWeight) * 100)}% (${r})`,
    `Practices contribution: ${Math.round((p / totalWeight) * 100)}% (${p})`
  ];
  // Prioritized failed items (max 4, ordered by impact)
  const failed = [];
  // Core signals first (highest priority)
  if (c < 50 || s < 50) {
    failed.push(
      "Core signals (coverage + salience) are weak – these are the foundation for entity SEO. Strengthen entity count, diversity, and prominence first."
    );
  }
  // Then supporting signals
  if (r < 40) {
    failed.push(
      "Weak entity relationships – build topical clusters by grouping related entities in content and adding internal links with descriptive anchors."
    );
  }
  if (p < 40) {
    failed.push(
      "On-page practices need improvement – implement JSON-LD schema for detected entity types and use top entities in headings for better crawlability."
    );
  }
  // Overall low score catch-all
  if (score < 60) {
    failed.push(
      "Overall semantic readiness is low. Follow the priority order: 1) Boost coverage & salience, 2) Improve relationships, 3) Add schema & practices."
    );
  }
  return { score, metrics, failed };
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
    const urlInput = document.getElementById('url-input');
    const inputValue = urlInput?.value.trim();
    if (!inputValue) {
      alert('Please enter a URL');
      return;
    }
    const url = cleanUrl(inputValue);
    if (!url) return;
    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-8">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500">Analyzing entities...</p>
      </div>
    `;
    results.classList.remove('hidden');
    const progressText = document.getElementById('progress-text');
    try {
      progressText.textContent = "Fetching & analyzing page...";
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
      // Run the 5 aggregate modules
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
      const overallScore = readiness.score; // Primary overall from readiness
      const grade = getGrade(overallScore);
      // Entity diversity summary
      const typeCounts = extracted.reduce((acc, e) => {
        const t = e.type || 'OTHER';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const diversitySummary = `${extracted.length} entities detected (${Object.entries(typeCounts).map(([t,c]) => `${c} ${t}`).join(', ')})`;
      // Entities HTML (unchanged)
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
      // Module cards with improved education
      const moduleCardsHTML = modules.map(mod => {
        const { score, metrics = [], failed = [] } = mod.result;
        const cardGrade = getGrade(score);
        return `
          <div class="score-card bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div class="flex flex-col items-center mb-4">
              <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">${mod.name}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${mod.desc}</p>
            </div>
            <div class="flex items-center justify-center mb-4">
              <div class="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                   style="background: conic-gradient(${mod.color} ${score}%, #e5e7eb ${score}%)">
                ${score}
              </div>
            </div>
            <div class="text-center mb-3">
              <span class="${cardGrade.color} font-medium">${cardGrade.text}</span>
            </div>
            <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              ${metrics.map(m => `<li>${m}</li>`).join('')}
            </ul>
            <button class="fixes-toggle w-full text-left text-orange-500 hover:text-orange-600 font-medium flex justify-between items-center">
              <span>Show Fixes ${failed.length > 0 ? `(${failed.length})` : ''}</span>
              <span class="text-xs">▼</span>
            </button>
            <div class="fixes-panel hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              ${failed.length > 0
                ? `<ul class="list-disc pl-5 space-y-2 text-sm text-red-700 dark:text-red-300">
                     ${failed.map(f => `<li>${f}</li>`).join('')}
                   </ul>`
                : '<p class="text-green-600 dark:text-green-400 text-center">No major issues detected – excellent!</p>'}
            </div>
          </div>
        `;
      }).join('');
      // Top Priority Fixes (top 4 across all modules)
      const allFailed = [
        ...coverage.failed || [], ...salience.failed || [], ...relationships.failed || [],
        ...practices.failed || [], ...readiness.failed || []
      ].slice(0, 4);
      results.innerHTML = `
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="text-center mb-10">
      <h2 class="text-4xl font-bold text-gray-800 dark:text-gray-200">Entity Analysis Report</h2>
      <p class="mt-3 text-xl text-gray-600 dark:text-gray-400">
        Overall Semantic Health: <span class="${grade.color} font-bold">${overallScore}/100 ${grade.emoji} ${grade.text}</span>
      </p>
      <p class="mt-2 text-lg text-gray-500 dark:text-gray-400">${diversitySummary}</p>
    </div>
    <!-- Extracted Entities -->
    <div class="mb-16">
      <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Extracted Entities</h3>
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
    <!-- Module Score Cards (now styled like SEO Intent) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      ${modules.map(mod => {
        const { score, metrics = [], failed = [] } = mod.result;
        const cardGrade = getGrade(score);
        const borderColor = score >= 85 ? 'border-green-500' : score >= 70 ? 'border-emerald-500' : score >= 50 ? 'border-orange-500' : 'border-red-500';
        return `
          <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-4 ${borderColor} hover:shadow-xl transition-shadow">
            <div class="flex flex-col items-center mb-4">
              <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">${mod.name}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${mod.desc}</p>
            </div>
            <div class="flex items-center justify-center mb-4">
              <div class="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl relative"
                   style="background: conic-gradient(${mod.color} ${score}%, #e5e7eb ${score}%)">
                ${score}
                <span class="absolute -top-2 -right-2 text-2xl">${cardGrade.emoji}</span>
              </div>
            </div>
            <div class="text-center mb-4">
              <span class="${cardGrade.color} font-medium text-lg">${cardGrade.text}</span>
            </div>
            <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
${metrics.map(m => {
  const isPositive = m.includes('High') || m.includes('Strong') || m.includes('Excellent') || m.includes('hierarchical') || !m.toLowerCase().includes('low') && !m.toLowerCase().includes('few') && !m.toLowerCase().includes('limited') && !m.toLowerCase().includes('weak');
  return `<li class="${isPositive ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} flex items-start gap-2">
    ${isPositive ? '✅' : '⚠️'} <span>${m}</span>
  </li>`;
}).join('')}
            </ul>
            <button class="fixes-toggle w-full text-left text-orange-500 hover:text-orange-600 font-medium flex justify-between items-center py-2 px-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <span>Show Fixes ${failed.length > 0 ? `(${failed.length})` : ''}</span>
              <span class="arrow text-xs">▼</span>
            </button>
            <div class="fixes-panel hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              ${failed.length > 0
                ? `<ul class="list-disc pl-5 space-y-2 text-sm text-red-700 dark:text-red-300">
                     ${failed.map(f => `<li>${f}</li>`).join('')}
                   </ul>`
                : '<p class="text-center text-green-600 dark:text-green-400 font-medium">All signals strong – excellent!</p>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <!-- Top Priority Fixes -->
    <div class="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 border border-orange-200 dark:border-orange-700/50">
      <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Top Priority Fixes</h3>
      ${allFailed.length > 0
        ? `<ul class="list-decimal pl-6 space-y-4 text-gray-700 dark:text-gray-300">
             ${allFailed.map((fix, i) => `<li class="text-lg">${fix}</li>`).join('')}
           </ul>`
        : '<p class="text-center text-green-600 dark:text-green-400 text-lg">Strong semantic foundation – minimal fixes needed!</p>'}
    </div>
    <!-- Share / Save / Feedback Buttons -->
    <div class="text-center my-16 px-4">
      <div class="flex flex-col sm:flex-row justify-center gap-6 mb-8">
        <button id="share-report-btn" class="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
          Share Report ↗️
        </button>
        <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
                class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
          Save Report 📥
        </button>
        <button id="feedback-btn" class="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
          Submit Feedback 💬
        </button>
      </div>
      <div id="share-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto"></div>
    </div>
  </div>
`;
      // Initialize Chart.js radar (unchanged)
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (window.myRadarChart) {
          window.myRadarChart.destroy();
        }
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
            aspectRatio: 1,
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
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: 'rgba(30,41,59,0.9)', titleFont: { size: 14 } }
            }
          }
        });
      }, 500);
      // Initialize share & feedback
      initShareReport(results);
      initSubmitFeedback(results);
      // Toggle handlers for fixes panels
      results.addEventListener('click', (e) => {
        if (e.target.closest('.fixes-toggle')) {
          const button = e.target.closest('.fixes-toggle');
          const panel = button.nextElementSibling;
          const arrow = button.querySelector('.arrow');
          if (panel && arrow) {
            panel.classList.toggle('hidden');
            arrow.textContent = panel.classList.contains('hidden') ? '▼' : '▲';
          }
        }
      });
    } catch (err) {
      console.error('Analysis error:', err);
      results.innerHTML = `
        <div class="text-center py-12 text-red-600 dark:text-red-400">
          <p class="text-xl font-bold">Error during analysis</p>
          <p class="mt-4">${err.message || 'Unknown error – check console'}</p>
        </div>
      `;
    }
  });
  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }
  function getGrade(score) {
    if (score >= 85) return { text: 'Excellent', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { text: 'Good', emoji: '👍', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 50) return { text: 'Fair', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
    return { text: 'Needs Work', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
  }
});