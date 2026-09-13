// seo-intent-tool/module-explanations-v1.0.js
//
// Two exports:
//   • moduleExplanations — static "Deep Dive" cards lower on the page (UNCHANGED)
//   • fixHints + fixFor() — regex-matched fix explanations for the score-card panels

// ─────────────────────────────────────────────────────────────────────────────
// STATIC MODULE EXPLANATIONS (existing content — unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const moduleExplanations = [
  {
    id: "experience",
    emoji: "🧑‍💻",
    name: "Experience",
    what: "Proof that the content creator has genuine first-hand involvement with the topic through personal anecdotes, real-world testing, timelines, and original media. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-experience' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Detects first-person pronouns (I/we/my/our), personal anecdote phrases, timeline/date mentions tied to personal context, and original images/videos with personal captions or alt text. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-experience' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Google prioritizes content demonstrating real experience over theoretical advice. Strong experience signals improve trust, dwell time, engagement, and rankings — especially in YMYL and competitive niches. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-experience' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "expertise",
    emoji: "🎓",
    name: "Expertise",
    what: "Evidence of deep knowledge and qualifications through author identification, credentials, professional background, and supporting citations. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-expertise' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Checks for visible author byline, dedicated bio section, credential keywords (PhD, certified, years of experience, etc.), and links to studies, sources, or references. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-expertise' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Expertise establishes credibility and reduces misinformation risk. Search engines reward content from demonstrably qualified authors with higher visibility and authority. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-expertise' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "authoritativeness",
    emoji: "🏆",
    name: "Authority",
    what: "Recognition of the author or site as a leading voice through structured data, awards, endorsements, and transparent entity information. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-authoritativeness' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Analyzes JSON-LD schema types (Article, Person, Organization), mentions of awards or media features, and presence of About/Team page links. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-authoritativeness' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Authoritative sources earn topical leadership and richer search features. It boosts entity trust, backlink potential, and long-term ranking stability. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-authoritativeness' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "trustworthiness",
    emoji: "🔒",
    name: "Trust",
    what: "Clear indicators of reliability, security, transparency, and accountability that build user confidence. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-trustworthiness' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Verifies HTTPS, visible contact methods (email, form, phone), privacy/terms links, and displayed update or publish dates. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-trustworthiness' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Trust signals prevent bounces and complaints. Google favors secure, transparent sites to protect users, directly impacting rankings and traffic. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-trustworthiness' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "depth",
    emoji: "📚",
    name: "Content Depth",
    what: "The comprehensiveness and thoroughness of coverage that fully satisfies user intent with detailed, valuable information. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-content-depth' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Counts visible main content words in the rendered page body. Compares against benchmarks: Strong (1,500+ words), Average (800–1,499), Needs work (<800). <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-content-depth' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "In-depth content ranks highest because it provides the most helpful answer. It increases time on page, reduces pogo-sticking, and dominates competitive SERPs. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-content-depth' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "readability",
    emoji: "📖",
    name: "Readability",
    what: "How easy and enjoyable the text is to read through clear structure, simple language, and natural flow. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-readability' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Calculates Flesch Reading Ease score. Ideal = 60–70 (plain English), Acceptable = 50–80, Difficult = outside range. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-readability' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Readable content improves comprehension, engagement, and user satisfaction signals. Search engines track these metrics to prioritize helpful, accessible pages. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-readability' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "schema",
    emoji: "⚡",
    name: "Schema Markup",
    what: "Structured data that helps search engines understand content type, entities, and context for enhanced display. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#what-schema' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Detects valid JSON-LD script blocks and counts relevant schema types (Article, Person, Organization, FAQPage, etc.). <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#how-schema' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Proper schema unlocks rich snippets, increases click-through rates dramatically, strengthens E-E-A-T, and improves visibility in featured results. <a href='https://traffictorch.net/blog/posts/seo-intent-help-guide/#why-schema' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "keyword-tool",
    emoji: "🔑",
    name: "Keyword Research Tool",
    what: "Discover high-opportunity keywords with accurate search volume, difficulty scores, intent classification, trending data, and competitor gaps — all in one free tool.",
    linkText: "Open Keyword Tool →",
    linkUrl: "https://traffictorch.net/keyword-tool/"
  },
  {
    id: "ai-tools",
    emoji: "🤖",
    name: "AI SEO & UX Tools",
    what: "Full suite of AI-powered analyzers: technical SEO audits, Core Web Vitals, UX health checks, content optimization, and predictive performance insights.",
    linkText: "Explore AI Tools →",
    linkUrl: "https://traffictorch.net/ai-seo-ux-tools/"
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// FIX HINTS — ordered regex → fix string. First match wins.
// Grouped by module. 45 patterns covering every failed-item string currently
// emitted by the modules in /seo-intent-tool/modules/*.js plus the priority-fix
// strings generated in script-v1.4.js.
// ─────────────────────────────────────────────────────────────────────────────
export const fixHints = [
  // ─── EXPERIENCE ────────────────────────────────────────────────────────────
  { pattern: /first[- ]person|first person language|\bI\/we\/my\/our\b/i,
    fix: 'Sprinkle natural first-person voice ("I tested", "we found", "my experience") through intros, examples, and conclusions. Aim for 15+ mentions so readers hear a real person, not a brand.' },
  { pattern: /personal anecdote|real[- ]world example/i,
    fix: 'Add at least 3 concrete anecdotes — e.g. "I tested this on 5 client sites and saw…". Specific stories outperform generic claims for both readers and Google.' },
  { pattern: /timeline|specific dates?|mention.*dates?/i,
    fix: 'Anchor experience in time: "Last year we…", "Since 2022 our team has…". Dated personal context signals recency and hands-on testing.' },
  { pattern: /personal (media|caption|photos?|videos?)|original (photo|video|image)/i,
    fix: 'Add original photos, screenshots, or video with personal captions like "My testing setup" or "Our results after 3 months". Original media is a strong E-E-A-T signal.' },
  { pattern: /strengthen.*experience|experience signals?|low experience/i,
    fix: 'Combine three moves: (1) first-person voice, (2) dated anecdotes, (3) original media with personal alt text. Google rewards pages that clearly show real-world involvement.' },

  // ─── EXPERTISE ─────────────────────────────────────────────────────────────
  { pattern: /author byline present|add (a )?visible author|author byline\/name|author name/i,
    fix: 'Add a clear byline directly under the H1: "By [Name] · Updated [date]". Link the name to an author page, and mark it up with rel="author" for entity clarity.' },
  { pattern: /author bio section|create (an )?author bio|author bio\b/i,
    fix: 'Create a 60–100 word author box below the article with photo, role, and one concrete credibility marker (years of experience, book, certification, or notable client).' },
  { pattern: /credentials?|qualifications?|certifications?|years? of experience|expert in/i,
    fix: 'State credentials explicitly — "Jane is a licensed CPA with 12 years at Deloitte" — and mention certifications, degrees, or publications directly in the bio or opening paragraphs.' },
  { pattern: /citation|reference|supporting sources?/i,
    fix: 'Link to primary sources (studies, government data, official docs) inline, and add a "References" section at the bottom. Use descriptive anchor text, never "click here".' },
  { pattern: /credentials & citations|add credentials.*citations?/i,
    fix: 'Do both: add named credentials in the author bio AND link out to 3–5 authoritative sources. Together these raise expertise from "claimed" to "proven".' },

  // ─── AUTHORITATIVENESS ─────────────────────────────────────────────────────
  { pattern: /awards?|endorsements?|media (features?|mentions?)|press coverage/i,
    fix: 'Add a trust bar or "As featured in" row with recognizable logos, or weave mentions into copy ("Winner of the 2024 X Award"). External recognition is a strong authority signal.' },
  { pattern: /about\/team links?|about or team (page|links?)|about page|team page/i,
    fix: 'Link "About" and "Team" from the main navigation and footer. About pages help Google verify the entity behind the site and build topical authority.' },
  { pattern: /low authorit|weak authorit/i,
    fix: 'Earn authority signals: get featured in industry media, collect client testimonials, add Organization schema, and clearly link About/Team pages from the main nav.' },

  // ─── TRUSTWORTHINESS ───────────────────────────────────────────────────────
  { pattern: /https|ssl certificate/i,
    fix: 'Migrate to HTTPS with a valid SSL certificate (free via Let\'s Encrypt). Update internal links and add a 301 redirect from http:// to https:// so nothing breaks.' },
  { pattern: /contact info present|contact (page|info|details)|get in touch/i,
    fix: 'Add a dedicated /contact page with a working form, plus at least one direct channel (email or phone). Surface it in the footer on every page.' },
  { pattern: /privacy & terms links|privacy\/terms links?|privacy.*terms|policy links?|terms of service/i,
    fix: 'Publish and link both a Privacy Policy and a Terms of Service page from the footer. Required in most jurisdictions and expected by Google for trust.' },
  { pattern: /update date shown|display.*last updated|last updated|published date/i,
    fix: 'Show a visible "Last updated: [date]" near the top of the article using <time datetime="YYYY-MM-DD">. Freshness is both a ranking and a trust signal.' },
  { pattern: /low trust|weak trust/i,
    fix: 'Address the basics: HTTPS, visible contact, Privacy + Terms, and a visible update date. These four together are the strongest trust foundation Google checks.' },

  // ─── CONTENT DEPTH ─────────────────────────────────────────────────────────
  { pattern: /content is under|under 1,?500|expand content|content depth|word count|increase (length|depth)|thin content|too short/i,
    fix: 'Expand to 1,500+ words of substantive content — real examples, data, step-by-step breakdowns, comparison tables, and a focused FAQ. Prioritise usefulness over filler.' },
  { pattern: /shallow coverage|missing sections?|cover.*topic/i,
    fix: 'Add the sections competitors cover: definitions, use cases, common mistakes, troubleshooting, and a targeted FAQ. Aim to be the most comprehensive answer on the topic.' },

  // ─── READABILITY ───────────────────────────────────────────────────────────
  { pattern: /flesch|reading ease|readability/i,
    fix: 'Target Flesch Reading Ease 60–70: keep sentences under 20 words, prefer active voice, break paragraphs to 3–4 lines, add subheadings every 200–300 words, and use bullet lists.' },
  { pattern: /long sentences?|complex sentences?|passive voice/i,
    fix: 'Split any sentence over 25 words into two. Read aloud — if you run out of breath, cut it. Aim for 15–18 words per sentence on average.' },

  // ─── SCHEMA ────────────────────────────────────────────────────────────────
  { pattern: /schema markup|schema detected|structured data|no schema/i,
    fix: 'Add JSON-LD for the types matching your content. Article + Person (author) as a base, plus FAQPage, HowTo, Product, or BreadcrumbList as relevant. Validate with Google\'s Rich Results Test.' },
  { pattern: /add.*schema|json-?ld|add relevant schema/i,
    fix: 'Insert JSON-LD inside <script type="application/ld+json">…</script> in the <head> or before </body>. Start with Article + Person, then add a secondary type. Test at search.google.com/test/rich-results.' },
  { pattern: /missing schema|fewer than.*types?/i,
    fix: 'Add at minimum: (1) Article with author, datePublished, dateModified; (2) Person for the author; (3) BreadcrumbList. This alone unlocks most rich-result eligibility.' },

  // ─── INTENT / OVERALL ──────────────────────────────────────────────────────
  { pattern: /intent (match|mismatch|alignment)|search intent/i,
    fix: 'Match the dominant SERP format for your target query — if top results are lists, use a list; if they\'re guides, go deeper. Lead with the direct answer in the first 150 words.' },
  { pattern: /title tag|meta description|h1/i,
    fix: 'Align title, H1, and meta description with the query\'s intent. Keep the primary phrase near the front of the title and under 60 characters.' },

  // ─── COMBINED PRIORITY-FIX STRINGS (from topFixes in script-v1.4.js) ──────
  { pattern: /add author byline & bio/i,
    fix: 'Add a visible byline near the H1 and a 60–100 word author box below the article with photo and credentials. This typically lifts Expertise by 15–25 points.' },
  { pattern: /expand content depth/i,
    fix: 'Grow the article to 1,500+ words with original examples, screenshots, and a targeted FAQ. Aim to be the most complete answer on the topic.' },
  { pattern: /add relevant schema markup/i,
    fix: 'Insert Article + Person JSON-LD at minimum, then add FAQPage or HowTo if the content supports it. Validate with Google\'s Rich Results Test before publishing.' },

  // ─── GENERIC / CATCH-ALL (must stay last) ─────────────────────────────────
  { pattern: /weak (trust|authority|experience|expertise)/i,
    fix: 'Address the weakest E-E-A-T pillar first — usually author identity and firsthand experience. Add a named author, credentials, and one concrete anecdote.' },
  { pattern: /missing (author|contact|policy|date|schema)/i,
    fix: 'Fill the specific gap directly: add the missing author block, contact link, policy page, publish/update date, or JSON-LD. Each is a quick, isolated win.' },
  { pattern: /no (author|contact|policy|schema)/i,
    fix: 'Add the missing element — Google treats these as basic quality signals. Start with the highest-impact one: author byline and bio.' },
  { pattern: /low (experience|expertise|authority|trust|readability|depth|schema) score/i,
    fix: 'Strengthen this module by adding both a "who" (named, credentialed author) and a "how" (dated firsthand example or cited source) — the two strongest E-E-A-T reinforcements.' },
  { pattern: /improve.*score/i,
    fix: 'Work through the failed checks above in order. Each maps to a specific on-page element — fixing the top two usually produces the largest score gain.' }
];

const FALLBACK_FIX =
  'Review this metric and add the missing on-page element — a visible author, credential, dated example, or supporting source. See the module guide for the exact implementation.';

export function fixFor(text) {
  if (!text) return FALLBACK_FIX;
  for (const { pattern, fix } of fixHints) {
    if (pattern.test(text)) return fix;
  }
  return FALLBACK_FIX;
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC POINTS — estimated overall-score lift per failed metric.
// Same ordering rule as fixHints: first match wins. Fallback = +5.
// ─────────────────────────────────────────────────────────────────────────────
const pointsHints = [
  { pattern: /author byline|visible author|author name|byline present/i,                       points: 18 },
  { pattern: /author bio|bio section/i,                                                        points: 14 },
  { pattern: /under 1,?500|expand content|content depth|word count|too short|thin content/i,   points: 14 },
  { pattern: /schema markup|schema detected|structured data|no schema|add.*schema|json-?ld/i,  points: 12 },
  { pattern: /credentials?|qualifications?|certifications?|years? of experience/i,              points: 10 },
  { pattern: /citations?|references?|supporting sources?/i,                                    points: 9  },
  { pattern: /first[- ]person|first person language/i,                                         points: 8  },
  { pattern: /personal anecdote|real[- ]world example/i,                                       points: 8  },
  { pattern: /timeline|specific dates?/i,                                                      points: 6  },
  { pattern: /personal (media|caption|photos?|videos?)|original (photo|video|image)/i,         points: 6  },
  { pattern: /update date|last updated|published date/i,                                       points: 6  },
  { pattern: /contact (page|info|details)|get in touch/i,                                      points: 5  },
  { pattern: /privacy.*terms|privacy\/terms links?|policy links?|terms of service/i,           points: 5  },
  { pattern: /flesch|reading ease|readability/i,                                               points: 5  },
  { pattern: /about\/team links?|about or team (page|links?)|about page|team page/i,           points: 4  },
  { pattern: /awards?|endorsements?|media (features?|mentions?)|press coverage/i,              points: 4  },
  { pattern: /https|ssl certificate/i,                                                         points: 3  }
];

const FALLBACK_POINTS = 5;

export function metricPoints(text) {
  if (!text) return FALLBACK_POINTS;
  for (const { pattern, points } of pointsHints) {
    if (pattern.test(text)) return points;
  }
  return FALLBACK_POINTS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing DOM wiring for the "Deep Dive" section — unchanged.
// ─────────────────────────────────────────────────────────────────────────────
function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const target = document.getElementById(hash);
    if (target) {
      const details = target.querySelector('details');
      if (details) {
        details.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('module-cards-container');
  if (!container) return;

  container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center max-w-7xl mx-auto px-6';

  container.innerHTML = moduleExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center w-full max-w-md">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center justify-center gap-2 whitespace-nowrap">
          Learn More <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-600 dark:text-gray-400 leading-relaxed">
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          ${m.linkUrl ? '' : `
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ${m.name} tested?</p>
            <p>${m.how}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">Why does ${m.name} matter?</p>
            <p>${m.why}</p>
          </div>
          `}
          ${m.linkUrl ? `
          <div class="mt-8 text-center">
            <a href="${m.linkUrl}" class="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-full hover:opacity-90 transition">
              ${m.linkText}
            </a>
          </div>
          ` : ''}
        </div>
      </details>
    </div>
  `).join('');

  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);