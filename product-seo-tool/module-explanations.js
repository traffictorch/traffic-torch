// product-seo-tool/module-explanations.js?v=1.0
// v1.1 — Fix hints modernised: retired tools removed, Merchant-listing schema fields added.

const HELP_BASE = 'https://traffictorch.net/blog/posts/product-seo-help-guide/';

export const moduleExplanations = [
  {
    id: "on-page-seo",
    emoji: "📄",
    name: "On-Page SEO",
    what: "On-Page SEO evaluates title, meta, headings, URL, and keyword prominence — the foundational elements that tell search engines and users what the product page is about.",
    how: "Tested via title length & keyword inclusion, meta description relevance & CTA strength, heading hierarchy (single H1 + logical H2/H3), clean URL structure, and natural keyword prominence/semantic coverage.",
    why: "Strong on-page signals improve relevance, click-through rates, and initial rankings, and match user intent."
  },
  {
    id: "technical-seo",
    emoji: "🔧",
    name: "Technical SEO",
    what: "Technical SEO checks crawlability, mobile readiness, security, and duplicate prevention — essential for product pages to be indexed and ranked properly.",
    how: "Tested via mobile-first readiness (viewport + zoom + tap targets), HTTPS with mixed-content scan, self-referencing canonicals, absence of noindex/nofollow, and URL-pattern signals.",
    why: "Technical issues can prevent indexing, hurt mobile rankings, or cause duplicate-content penalties — all block traffic."
  },
  {
    id: "content-&-media",
    emoji: "🖼️",
    name: "Content & Media",
    what: "Content & Media evaluates richness, accessibility, and engagement signals that keep users on-page and build trust.",
    how: "Tested by measuring description length & structure, image alt text coverage & optimisation, video caption accessibility, UGC (reviews), contextual internal linking, and breadcrumbs.",
    why: "High-quality content reduces bounce rate, improves dwell time, and strengthens topical authority — key ranking factors."
  },
  {
    id: "e-commerce-signals",
    emoji: "🛒",
    name: "E-Commerce Signals",
    what: "E-Commerce Signals checks structured data, pricing, reviews, variants, and social signals — essential for rich results and Merchant listings.",
    how: "Tested for complete Product schema (name, image, offers, brand, gtin, itemCondition, shippingDetails, hasMerchantReturnPolicy), price & availability, aggregateRating & Review schema, variant handling, and Open Graph tags.",
    why: "Schema enables rich snippets (price, stars, images in SERPs). Reviews add trust. Complete Merchant-listing fields unlock Shopping eligibility."
  }
];

/* ------------------------------------------------------------------ *
 * fixHints — first match wins. Grouped by module.                    *
 * ------------------------------------------------------------------ */
export const fixHints = [
  // ─── On-Page SEO ────────────────────────────────────────────────
  { pattern: /title.*\b(too short|too brief|\bshort\b|\bunder\b|\blength\b)/i,       fix: 'Expand your title tag to 50–60 characters. Lead with the primary product keyword, add a benefit, and end with the brand (e.g. "Wireless Headphones Pro – 40h Battery | Brand").' },
  { pattern: /title.*\b(too long|\bover\b|truncat)/i,              fix: 'Trim your title to ≤60 characters so Google doesn’t truncate it in SERPs. Move the primary keyword to the front and cut filler words.' },
  { pattern: /title.*(missing|absent|no title)/i,             fix: 'Add a unique <title> tag per product. Format: Primary Keyword – Benefit | Brand, 50–60 characters.' },
  { pattern: /title.*(keyword|missing keyword)/i,             fix: 'Add the primary product keyword near the start of your title tag. Verify the exact phrase shoppers use via Google Search Console → Performance → Queries.' },
  { pattern: /meta description.*(missing|absent|no meta)/i,   fix: 'Add a unique meta description (150–160 chars) with the primary keyword, a benefit, and a CTA like "Shop now" or "Free shipping".' },
  { pattern: /meta description.*\b(too short|too long|\bshort\b|\blong\b|truncat)/i, fix: 'Keep meta descriptions between 150–160 characters. Lead with the benefit, include the keyword naturally, and end with a CTA.' },
  { pattern: /meta description.*(duplicate|same|thin)/i,      fix: 'Write unique meta descriptions per product page. Duplicate metas dilute relevance — use dynamic fields in your CMS template (e.g. Yoast, Rank Math, Shopify SEO).' },
  { pattern: /heading.*(h1|single|multiple|duplicate)/i,      fix: 'Use exactly one H1 per product page (the product name). Remove duplicate H1s and demote secondary headings to H2/H3.' },
  { pattern: /heading.*(hierarchy|structure|order|skip)/i,    fix: 'Fix heading hierarchy: H1 → H2 → H3 in logical order. Don’t skip levels — screen readers and Google use this to understand content structure.' },
  { pattern: /heading.*\b(keyword|missing)\b/i,                   fix: 'Include the primary keyword in your H1 and long-tail variations in H2/H3 subheadings (features, specs, benefits).' },
  { pattern: /url.*(long|clean|parameter|slug)/i,             fix: 'Rewrite the URL as /category/product-name with hyphens. Remove parameters (?sort=, ?utm_=) and session IDs. Keep it under 60 characters.' },
  { pattern: /url.*(uppercase|underscore|space)/i,            fix: 'Use lowercase letters and hyphens in URLs (not underscores or spaces). Example: /blue-running-shoes not /Blue_Running_Shoes.' },
  { pattern: /keyword.*\b(density|stuff|stuffing|\bover\b|too many)/i,       fix: 'Avoid repeating the exact keyword unnaturally. Focus on prominence (title, H1, first 100 words, one H2) plus semantic coverage of related product terms (features, materials, use-cases).' },
  { pattern: /keyword.*\b(missing|absent|no primary)\b/i,         fix: 'Identify the primary keyword shoppers use, then place it in the title, H1, first 100 words, and one H2. Use Google Keyword Planner or Ahrefs for volume data.' },
  { pattern: /keyword.*(front.?load|early|intro|placement)/i, fix: 'Move the primary keyword into the first 100–150 words of the product description. Front-loading improves relevance for search engines.' },

  // ─── Technical SEO ──────────────────────────────────────────────
  { pattern: /viewport.*(missing|no viewport)/i,              fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>. Verify the mobile rendering with PageSpeed Insights or Chrome DevTools → Device Toolbar.' },
  { pattern: /viewport.*(user.?scalable|maximum.?scale)/i,    fix: 'Remove user-scalable=no and maximum-scale=1 from your viewport meta — they block zoom and hurt accessibility & rankings.' },
  { pattern: /mobile.*\b(friendly|responsive|not responsive)\b/i, fix: 'Make the layout responsive with CSS media queries. Test tap targets (≥48px), font sizes (≥16px), and horizontal scroll using Chrome DevTools → Device Toolbar or PageSpeed Insights mobile view.' },
  { pattern: /https.*(missing|http|not secure)/i,             fix: 'Force HTTPS site-wide with a 301 redirect and install a valid SSL certificate (free via Let’s Encrypt). Update all internal links to https://.' },
  { pattern: /mixed content/i,                                fix: 'Fix mixed content by updating all image/script/CSS URLs to https://. Check the browser console for warnings and add an Upgrade-Insecure-Requests CSP header.' },
  { pattern: /canonical.*(missing|absent|no canonical)/i,     fix: 'Add <link rel="canonical" href="https://full-current-url/"> in <head>. It must match the live URL exactly (protocol, case, trailing slash).' },
  { pattern: /canonical.*(mismatch|incorrect|wrong)/i,        fix: 'Make the canonical URL match the live URL 100%. Case-sensitive, include protocol, and match trailing-slash behaviour of your server.' },
  { pattern: /canonical.*(self|not self)/i,                   fix: 'Use a self-referencing canonical on every product page. For variants, point all variant URLs to the main product canonical.' },
  { pattern: /robots.*(noindex|nofollow)/i,                   fix: 'Remove <meta name="robots" content="noindex"> or nofollow from live product pages. Block unwanted URLs via robots.txt instead.' },
  { pattern: /robots.*(missing|directive)/i,                  fix: 'Add <meta name="robots" content="index, follow"> if you want the page indexed. Never noindex a live product page.' },

  // ─── Content & Media ───────────────────────────────────────────
  { pattern: /description.*(short|thin|length|word count|under)/i, fix: 'Expand to 400–800 words for competitive niches. Start with benefits, use bullet points for features, and add H2 subheadings (Materials, Dimensions, Care).' },
  { pattern: /description.*(duplicate|manufacturer|copy|same)/i,   fix: 'Replace manufacturer boilerplate with unique benefit-driven copy. Rewrite every product description — Google treats duplicate descriptions as thin content.' },
  { pattern: /description.*(structure|format|bullet|heading)/i,    fix: 'Structure the description with short paragraphs, bullet lists for specs, and bold subheadings. Aim for scannability on mobile.' },
  { pattern: /image.*(alt|missing alt|no alt)/i,                   fix: 'Add descriptive alt text to every meaningful image (e.g. "Santa Cruz Dreadnought acoustic guitar front view"). Keep under 125 characters. Use alt="" only for truly decorative images.' },
  { pattern: /image.*(filename|name|generic)/i,                    fix: 'Rename image files descriptively before upload (nike-air-zoom-blue.jpg). Avoid IMG_1234.jpg and generic names.' },
  { pattern: /image.*(size|compress|kb|weight|heavy)/i,            fix: 'Compress images to under 100 KB using Squoosh, TinyPNG, or ImageOptim. Convert to WebP/AVIF for 30–50% smaller files.' },
  { pattern: /image.*(lazy|loading)/i,                             fix: 'Add loading="lazy" to below-the-fold images. Keep the hero image eager-loaded for fast LCP.' },
  { pattern: /image.*(responsive|srcset|sizes)/i,                  fix: 'Add srcset and sizes attributes so the browser serves the right resolution per device. Example: <img srcset="img-480.jpg 480w, img-800.jpg 800w" sizes="(max-width: 640px) 100vw, 800px">.' },
  { pattern: /video.*(caption|track|embed|missing)/i,              fix: 'Add captions for accessibility & SEO. For YouTube/Vimeo embeds, enable captions at the source (or append cc_load_policy=1). For native <video>, add <track kind="subtitles">. Include a nearby transcript section.' },
  { pattern: /(review|ugc|user.?generated|social proof)/i,         fix: 'Install a review app (Judge.me, Yotpo, Loox) and display aggregate rating + review count on the product page. Encourage photo/video reviews.' },
  { pattern: /internal.?link/i,                                    fix: 'Add 3–6 contextual internal links to related products, categories, or buying guides within the body content (not nav/footer). Use descriptive anchors like "see matching guitar straps".' },
  { pattern: /breadcrumb/i,                                        fix: 'Add breadcrumb navigation (Home > Category > Product) and mark it up with BreadcrumbList JSON-LD for rich results in SERPs.' },

  // ─── E-Commerce Signals ────────────────────────────────────────
  { pattern: /product.?schema.*(missing|no schema|absent)/i,       fix: 'Add JSON-LD Product schema in <head> or <body>. Required for Merchant listings: @context, @type: Product, name, image[], description, brand, sku/mpn, gtin (if applicable), offers {price, priceCurrency, availability, itemCondition, priceValidUntil, shippingDetails, hasMerchantReturnPolicy}. Validate with Google’s Rich Results Test.' },
  { pattern: /product.?schema.*(invalid|error|incomplete|required)/i, fix: 'Fix missing Product schema fields: image must be an array of URLs, offers.price a string number, availability a full schema.org URL (e.g. https://schema.org/InStock). Add gtin, itemCondition, and priceValidUntil for Merchant listings.' },
  { pattern: /schema.*(validate|testing|rich results)/i,           fix: 'Validate your JSON-LD with Google’s Rich Results Test and Schema.org Validator. Fix all warnings before publishing.' },
  { pattern: /price.*(markup|missing|offer|currency)/i,            fix: 'Add offers.price (string number), offers.priceCurrency ("USD"), offers.availability ("https://schema.org/InStock"), offers.itemCondition ("https://schema.org/NewCondition"), and offers.priceValidUntil to your Product schema.' },
  { pattern: /availability.*(missing|markup|stock)/i,              fix: 'Set offers.availability using schema.org enums: https://schema.org/InStock, OutOfStock, PreOrder, LimitedAvailability, or BackOrder.' },
  { pattern: /aggregate.?rating|rating.?value/i,                   fix: 'Add AggregateRating to Product schema: ratingValue (decimal 1.0–5.0) and reviewCount (integer). Use real review data from your review app.' },
  { pattern: /review.?schema|review.?count|individual review/i,    fix: 'Add individual Review objects inside Product schema (author, datePublished, reviewRating). Pair with AggregateRating to unlock stars in SERPs.' },
  { pattern: /variant|variant.?handling/i,                         fix: 'Use a single product URL with variant dropdowns/swatches. If using separate URLs per variant, add a self-canonical pointing to the main product page.' },
  { pattern: /open.?graph|og:|social.?sharing|twitter.?card/i,     fix: 'Add Open Graph tags in <head>: og:title, og:description, og:image (1200×630+), og:url, og:type=product. Add twitter:card=summary_large_image.' },
  { pattern: /og:image|social.?image/i,                            fix: 'Use a high-resolution product image (1200×630 px minimum) for og:image. Host it on the same domain and use an absolute URL.' },
  { pattern: /schema.*(@type|type|itemtype)/i,                     fix: 'Ensure your Product schema uses @type: "Product" (not "ItemPage" or "Thing"). For variants, use "ProductGroup" with hasVariant.' },

  // ─── Generic fallbacks (last) ──────────────────────────────────
  { pattern: /https/i,        fix: 'Force HTTPS site-wide with a 301 redirect and update all internal links to https://.' },
  { pattern: /mobile/i,       fix: 'Test in Chrome DevTools → Device Toolbar or PageSpeed Insights mobile view. Fix any horizontal scroll, small tap targets, or fixed-width elements.' },
  { pattern: /keyword/i,      fix: 'Review keyword prominence in title, H1, first paragraph, and one H2. Add semantic variations rather than repeating the exact phrase.' },
  { pattern: /image/i,        fix: 'Audit images: descriptive alt text (or alt="" for decorative), WebP format, ≤100 KB, and loading="lazy" below the fold.' },
  { pattern: /schema/i,       fix: 'Validate your JSON-LD with Google’s Rich Results Test and fix any required-field warnings.' },
  { pattern: /description/i,  fix: 'Expand the description to 400–800 words with benefit-led copy, bullet specs, and subheadings.' },
  { pattern: /link/i,         fix: 'Add 3–6 contextual internal links in the body content with descriptive anchor text pointing to related products or guides.' }
];

const FALLBACK_FIX = 'Review this metric against Google’s official SEO guidelines and the Product SEO help guide for step-by-step fixes.';

export function fixFor(text) {
  if (!text) return FALLBACK_FIX;
  const str = String(text);
  for (const hint of fixHints) {
    if (hint.pattern.test(str)) return hint.fix;
  }
  return FALLBACK_FIX;
}

/* ------------------------------------------------------------------ *
 * Deep-dive module cards                                             *
 * ------------------------------------------------------------------ */
function openDetailsFromHash() {
  if (!window.location.hash) return;
  const target = document.getElementById(window.location.hash.substring(1));
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('module-cards-container');
  if (!container) return;

  const moduleCards = moduleExplanations.map(m => `
    <div id="${m.id}"
         class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-purple-500 text-center flex flex-col">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-purple-600 dark:text-purple-400 mb-8">${m.name}</div>
      <a href="${HELP_BASE}#${m.id}"
         class="mt-auto inline-block px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-orange-600 text-white font-semibold hover:from-purple-700 hover:to-orange-600 transition">
        How ${m.name} is tested →
      </a>
    </div>
  `).join('');

  const allToolsCard = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-indigo-500 text-center flex flex-col lg:col-span-1">
      <div class="text-6xl mb-6">🛠️</div>
      <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-8">SEO UX AI Tools</div>
      <a href="https://traffictorch.net/ai-seo-ux-tools/"
         class="mt-auto inline-block px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition">
        Explore All Tools
      </a>
    </div>`;

  container.innerHTML = moduleCards + allToolsCard;
  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);