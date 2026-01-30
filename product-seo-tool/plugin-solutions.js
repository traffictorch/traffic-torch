// product-seo-tool/plugin-solutions.js - Updated to match current Traffic Torch metrics

function getPluginGrade(score) {
  if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { grade: 'Very Good', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 50) return { grade: 'Needs Improvement', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
  return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
}

const pluginData = {
  "Title Tag Optimization": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO is the leading WordPress plugin for on-page optimization with title templates and length checker. Use the title field on product pages to set keyword-rich titles with brand early, keeping length 50–60 characters.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math provides advanced title optimization with AI suggestions and preview. Edit product titles in the Rank Math box, apply AI recommendations, and ensure keywords are front-loaded within 50–60 characters.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "SEOPress is a lightweight plugin with full title tag control and dynamic variables. Use the title field on product pages with variables like %%title%% %%sep%% %%sitename%%, keeping titles concise and keyword-focused.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Plug in SEO scans titles and allows bulk editing with length previews. Use the bulk editor to update product titles, placing keywords early and keeping length under 60 characters.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "SEO Manager", desc: "SEO Manager lets you create title templates with dynamic variables for products. Set a template like '{{ product.title }} | {{ shop.name }}' in the app and apply it to all products.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Wix SEO Wiz provides title editing with real-time previews and length guidance. In product SEO settings, edit the title to include keywords early and keep it 50–60 characters.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in SEO Tools", desc: "Squarespace offers title editing with length indicators in product settings. Edit the SEO title field to place keywords first and maintain length under 60 characters.", linkLibrary: "", linkWebsite: "" }]
  },
  "Meta Description Relevance": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO includes a meta description editor with character counter and preview. Write a 150–160 character description with keywords early, benefits, and CTA like 'Shop now' on product pages.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math offers AI-generated meta descriptions with snippet preview. Use the meta field to create compelling copy with keywords and urgency, adjusting to 150–160 characters.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "SEOPress provides meta description control with dynamic variables. Edit the meta field per product to include keywords, benefits, and CTA, keeping length optimal for SERPs.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Plug in SEO detects short or missing meta descriptions and supports bulk editing. Use the bulk editor to write keyword-rich descriptions with CTA for all products.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "Smart SEO", desc: "Smart SEO allows meta description templates with dynamic variables. Set a template like '{{ product.description | truncate: 155 }} – Shop now' and apply store-wide.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Wix SEO Wiz provides a meta description field with length guidance. In product SEO settings, write a 150–160 character description with keywords early and CTA.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Squarespace allows meta description editing per product with length indicators. In product SEO settings, create benefit-driven copy with keywords and CTA in 150–160 characters.", linkLibrary: "", linkWebsite: "" }]
  },
  "Heading Structure (H1–H6)": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO analyzes heading structure in readability and SEO checks. Ensure one H1 with product name, add H2/H3 for features/benefits, and use keywords naturally in headings.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math uses Content AI to suggest proper heading hierarchy. Use H1 for product title, H2/H3 for sections, and include long-tail keywords in headings.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "SEOPress validates heading outline and hierarchy. Set H1 as product name, use logical H2/H3 for specs and benefits, and incorporate keywords.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SEO Booster", desc: "SEO Booster audits heading structure and provides suggestions. Use H1 for product name, H2/H3 for features, and add keywords naturally in headings.", linkLibrary: "https://apps.shopify.com/seo-booster", linkWebsite: "https://seobooster.app/" },
      { name: "Plug in SEO", desc: "Plug in SEO detects heading issues in content. Ensure one H1, logical H2/H3 structure, and keyword inclusion in headings.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" }
    ],
    Wix: [{ name: "Built-in Editor", desc: "Wix editor supports proper heading tags in content blocks. Use H1 for product name, H2/H3 for sections, and add keywords naturally.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Blocks", desc: "Squarespace blocks allow correct heading hierarchy. Set H1 for product title, H2/H3 for features, and include keywords.", linkLibrary: "", linkWebsite: "" }]
  },
  "URL Structure": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO helps with slug editing and permalink optimization. Go to product edit screen and set a clean, keyword-rich slug without parameters or session IDs.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math offers canonical and slug control. Edit the slug field on product pages to make it descriptive and keyword-rich with hyphens.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "Permalink Manager Lite", desc: "Permalink Manager Lite provides advanced URL editing and redirects. Customize product URLs to follow /category/product-name format without extra parameters.", linkLibrary: "https://wordpress.org/plugins/permalink-manager/", linkWebsite: "https://permalinkmanager.pro/" }
    ],
    Shopify: [
      { name: "Smart SEO", desc: "Smart SEO cleans up URLs and removes unnecessary parameters. Use the app to edit product URLs to clean, keyword-rich slugs with hyphens.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" },
      { name: "SEO Manager", desc: "SEO Manager supports URL templates and editing. Set descriptive URL patterns for products and apply them store-wide.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Wix SEO Wiz allows URL slug editing in product settings. Change the slug to a clean, keyword-rich version with hyphens.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Squarespace provides clean URL management in product settings. Edit the URL slug to be descriptive and keyword-focused.", linkLibrary: "", linkWebsite: "" }]
  },
  "Keyword Optimization": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO analyzes keyword density and placement in content. Place main keywords in title, H1, first paragraph, and use long-tail variations naturally.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math offers keyword optimizer tool and suggestions. Use the keyword field to track placement and density, aiming for natural 0.5–2.5% usage.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "AIOSEO tracks focus keywords and optimization. Set focus keyword per product and ensure placement in prominent areas with natural density.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SEO Booster", desc: "SEO Booster provides keyword suggestions and density checks. Use the app to identify and place keywords naturally in product descriptions.", linkLibrary: "https://apps.shopify.com/seo-booster", linkWebsite: "https://seobooster.app/" },
      { name: "Plug in SEO", desc: "Plug in SEO detects keyword issues in content. Review suggestions and place primary keywords in title, description, and headings.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Wix SEO Wiz offers keyword guidance in product settings. Place main keywords in title, description, and headings naturally.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Squarespace provides keyword integration tips in SEO settings. Use keywords in title, description, and content naturally.", linkLibrary: "", linkWebsite: "" }]
  },
  "Mobile-Friendliness": {
    WordPress: [
      { name: "AMP for WP", desc: "AMP for WP creates fast mobile AMP versions of pages. Install, enable AMP for product pages, and test mobile speed and layout.", linkLibrary: "https://wordpress.org/plugins/accelerated-mobile-pages/", linkWebsite: "https://ampforwp.com/" },
      { name: "WPtouch", desc: "WPtouch switches to a mobile-friendly theme for phones. Activate the plugin and configure mobile display for better responsiveness.", linkLibrary: "https://wordpress.org/plugins/wptouch/", linkWebsite: "https://wptouch.com/" },
      { name: "Jetpack", desc: "Jetpack includes mobile theme and speed features. Enable Jetpack’s mobile module and lazy loading for improved mobile experience.", linkLibrary: "https://wordpress.org/plugins/jetpack/", linkWebsite: "https://jetpack.com/" }
    ],
    Shopify: [
      { name: "Ampify", desc: "Ampify generates AMP pages for faster mobile loading. Install, enable AMP for products, and test mobile speed.", linkLibrary: "https://apps.shopify.com/ampify-me", linkWebsite: "https://ampify.io/" },
      { name: "AMP by Shop Sheriff", desc: "AMP by Shop Sheriff creates AMP versions with conversion focus. Install and apply AMP to product pages for mobile speed.", linkLibrary: "https://apps.shopify.com/amp-by-shop-sheriff", linkWebsite: "https://shopsheriff.com/" }
    ],
    Wix: [{ name: "Built-in Mobile Editor", desc: "Wix’s built-in editor ensures responsive design on mobile. Use the mobile view in editor to adjust layout and test on devices.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Responsive", desc: "Squarespace automatically optimizes for mobile. Use the mobile preview in editor to check and adjust layout.", linkLibrary: "", linkWebsite: "" }]
  },
  "HTTPS Implementation": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Really Simple SSL forces HTTPS and fixes mixed content issues. Install, activate, and let it redirect all traffic to HTTPS.", linkLibrary: "https://wordpress.org/plugins/really-simple-ssl/", linkWebsite: "https://really-simple-ssl.com/" },
      { name: "WP Encryption", desc: "WP Encryption provides free SSL and HTTPS redirect. Install and follow setup to enable HTTPS on your site.", linkLibrary: "https://wordpress.org/plugins/wp-letsencrypt-ssl/", linkWebsite: "https://wpencryption.com/" },
      { name: "SSL Zen", desc: "SSL Zen offers free Let's Encrypt SSL setup. Install, follow the wizard to get and install the certificate.", linkLibrary: "https://wordpress.org/plugins/ssl-zen/", linkWebsite: "https://sslzen.com/" }
    ],
    Shopify: [{ name: "Built-in", desc: "Shopify enforces HTTPS on all stores by default. No action needed — all traffic is already secure.", linkLibrary: "", linkWebsite: "" }],
    Wix: [{ name: "Built-in SSL", desc: "Wix provides automatic HTTPS for all sites. No setup required — SSL is enabled by default.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in SSL", desc: "Squarespace includes free SSL certificates for all domains. HTTPS is automatic — no configuration needed.", linkLibrary: "", linkWebsite: "" }]
  },
  "Canonical Tags": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO automatically adds self-referencing canonical tags. Ensure the canonical field matches the live URL in product settings.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math manages canonical tags per page. Verify or set the canonical URL to the current product page.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "SEOPress controls canonical tags per page. Set the canonical field to match the live URL exactly.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Plug in SEO detects canonical issues. Use the app to verify or set self-referencing canonicals on products.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "Smart SEO", desc: "Smart SEO handles canonical and duplicate content. Configure canonical settings to point to the main product URL.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO", desc: "Wix automatically handles canonical tags. Ensure product URLs are unique and let Wix manage canonicals.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Squarespace adds canonical tags automatically. Keep product URLs unique to avoid duplicate issues.", linkLibrary: "", linkWebsite: "" }]
  },
  "Meta Robots Directives": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO lets you control noindex/nofollow per page. Go to product edit screen and ensure 'index' is selected in robots meta.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math manages robots meta directives. Set 'index' and 'follow' on product pages in the robots section.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "SEOPress provides advanced robots meta controls. Disable noindex/nofollow on product pages in settings.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Plug in SEO manages robots meta tags. Ensure products are set to index and follow in the app.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "SEO Manager", desc: "SEO Manager controls indexing directives. Verify products are indexable in app settings.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO", desc: "Wix controls index status in SEO settings. Ensure 'Allow search engines to include this page' is enabled.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Squarespace manages robots directives in SEO panel. Keep products set to index in advanced settings.", linkLibrary: "", linkWebsite: "" }]
  },
  "Sitemap Inclusion Hints": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO generates automatic XML sitemaps including products. Enable sitemap in settings and submit to Google Search Console.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math creates dynamic sitemaps with product inclusion. Enable sitemap in settings and submit the URL to search consoles.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "XML Sitemap & Google News", desc: "XML Sitemap plugin allows custom sitemap inclusion. Configure to include product URLs and submit to Google.", linkLibrary: "https://wordpress.org/plugins/xml-sitemap-google-news/", linkWebsite: "https://www.xml-sitemaps.com/" }
    ],
    Shopify: [
      { name: "XML Sitemap", desc: "XML Sitemap app generates automatic product sitemaps. Install and submit the sitemap URL to Google Search Console.", linkLibrary: "https://apps.shopify.com/xml-sitemap", linkWebsite: "" },
      { name: "Smart SEO", desc: "Smart SEO includes sitemap generation and submission hints. Enable sitemap in app settings and submit to search engines.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Sitemap", desc: "Wix automatically generates and updates sitemap. Submit your sitemap URL from Wix dashboard to Google.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Sitemap", desc: "Squarespace creates native XML sitemaps for products. Find sitemap in settings and submit to search consoles.", linkLibrary: "", linkWebsite: "" }]
  },
  "Product Description Quality": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO analyzes description readability and keyword usage. Expand product description to 300+ words with benefits, bullets, subheadings, and natural keywords.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Rank Math uses Content AI to improve description quality. Use AI suggestions to write benefit-focused copy with bullets and subheadings.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "AIOSEO provides content scoring for descriptions. Rewrite product description with benefits first, structured bullets, and keyword placement.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SEO Booster", desc: "SEO Booster checks description length and keyword usage. Expand descriptions to 300+ words with benefits, bullets, and keywords.", linkLibrary: "https://apps.shopify.com/seo-booster", linkWebsite: "https://seobooster.app/" },
      { name: "Smart SEO", desc: "Smart SEO analyzes description content. Use templates to structure descriptions with benefits and keywords.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Editor", desc: "Wix rich text editor supports structured descriptions. Write 300+ word descriptions with benefits first, bullets, and subheadings.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Blocks", desc: "Squarespace blocks allow structured content. Build descriptions with benefits, bullet points, and subheadings.", linkLibrary: "", linkWebsite: "" }]
  },
  "Image Optimization": {
    WordPress: [
      { name: "Smush", desc: "Smush compresses images, adds lazy loading, and supports WebP. Bulk optimize all product images, enable lazy load, and add descriptive alt text.", linkLibrary: "https://wordpress.org/plugins/wp-smushit/", linkWebsite: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "EWWW compresses images in bulk and supports WebP/AVIF. Run bulk optimization, enable lazy loading, and add keyword-rich alt text.", linkLibrary: "https://wordpress.org/plugins/ewww-image-optimizer/", linkWebsite: "https://ewww.io/" },
      { name: "Imagify", desc: "Imagify provides smart compression and next-gen formats. Upload and optimize product images, enable lazy load, and use descriptive alt text.", linkLibrary: "https://wordpress.org/plugins/imagify-webp-bulk-optimizer/", linkWebsite: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "TinyIMG adds AI alt text, compression, and WebP conversion. Install, enable auto-optimization, and let it generate descriptive alt text.", linkLibrary: "https://apps.shopify.com/tinyimg", linkWebsite: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Crush.pics compresses images and adds SEO filenames/alt text. Enable auto-compression and let it optimize product images.", linkLibrary: "https://apps.shopify.com/crush-pics-image-optimizer", linkWebsite: "https://crush.pics/" }
    ],
    Wix: [{ name: "Built-in Optimizer", desc: "Wix automatically compresses images and supports alt text. Edit product images, add descriptive alt text, and use mobile-optimized sizes.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Squarespace compresses images and provides alt text fields. Upload product images, add keyword-rich alt text, and use responsive sizes.", linkLibrary: "", linkWebsite: "" }]
  },
  "Video Embed Quality": {
    WordPress: [
      { name: "EmbedPress", desc: "EmbedPress optimizes video embeds with caption support. Embed YouTube/Vimeo videos on product pages and enable captions.", linkLibrary: "https://wordpress.org/plugins/embedpress/", linkWebsite: "https://wpdeveloper.com/plugins/embedpress/" },
      { name: "Video Embed & Thumbnail Generator", desc: "This plugin adds lazy loading and thumbnails for videos. Embed videos with poster images and enable captions.", linkLibrary: "https://wordpress.org/plugins/video-embed-thumbnail-generator/", linkWebsite: "https://www.farhatullah.com/" },
      { name: "Lazy Load – Optimize Images", desc: "Lazy Load supports lazy video loading. Enable lazy loading for offscreen videos on product pages.", linkLibrary: "https://wordpress.org/plugins/rocket-lazy-load/", linkWebsite: "https://wp-rocket.me/" }
    ],
    Shopify: [
      { name: "Video Embed Optimizer", desc: "Video Embed Optimizer adds lazy loading for embedded videos. Install and apply to product pages for better performance.", linkLibrary: "https://apps.shopify.com/video-embed-optimizer", linkWebsite: "" },
      { name: "Vitals", desc: "Vitals improves video loading and performance. Install and enable lazy loading for product videos.", linkLibrary: "https://apps.shopify.com/vitals", linkWebsite: "https://vitals.co/" }
    ],
    Wix: [{ name: "Built-in Video", desc: "Wix video blocks support captions and embedding. Add videos to product pages and enable captions in settings.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Video Blocks", desc: "Squarespace video blocks allow embedding with captions. Add video blocks to product pages and enable captions.", linkLibrary: "", linkWebsite: "" }]
  },
  "User-Generated Content (UGC)": {
    WordPress: [
      { name: "Yotpo", desc: "Yotpo adds reviews, photos, and videos with schema markup. Install Yotpo, enable photo/video reviews, and display aggregate ratings.", linkLibrary: "https://wordpress.org/plugins/yotpo-social-reviews/", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Judge.me provides product reviews with UGC and schema. Install, encourage photo/video submissions, and show star ratings.", linkLibrary: "https://wordpress.org/plugins/judge-me-product-reviews-woocommerce/", linkWebsite: "https://judge.me/" },
      { name: "WP Review", desc: "WP Review adds review schema and aggregation. Enable reviews on products and display average rating with count.", linkLibrary: "https://wordpress.org/plugins/wp-review/", linkWebsite: "https://mythemeshop.com/plugins/wp-review-pro/" }
    ],
    Shopify: [
      { name: "Yotpo", desc: "Yotpo collects reviews, photos, and videos with schema. Install, enable UGC submissions, and show ratings on products.", linkLibrary: "https://apps.shopify.com/yotpo-social-reviews", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Judge.me adds photo/video reviews and schema markup. Install and encourage customer uploads for UGC display.", linkLibrary: "https://apps.shopify.com/judgeme", linkWebsite: "https://judge.me/" }
    ],
    Wix: [{ name: "Wix Reviews", desc: "Wix Reviews enables built-in customer reviews and ratings. Turn on reviews in store settings and encourage submissions.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Comments", desc: "Squarespace comments support UGC on products. Enable comments in product settings and moderate submissions.", linkLibrary: "", linkWebsite: "" }]
  },
  "Internal Linking": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO suggests internal links during content editing. Add 3–6 relevant links in product description with descriptive anchor text.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Link Whisper", desc: "Link Whisper uses AI to suggest internal links. Accept suggestions to add contextual links to related products/categories.", linkLibrary: "https://wordpress.org/plugins/link-whisper/", linkWebsite: "https://linkwhisper.com/" },
      { name: "Internal Link Juicer", desc: "Internal Link Juicer automates internal linking. Configure keywords to auto-link to related content in descriptions.", linkLibrary: "https://wordpress.org/plugins/internal-link-juicer/", linkWebsite: "https://internallinkjuicer.com/" }
    ],
    Shopify: [
      { name: "Smart SEO", desc: "Smart SEO optimizes internal linking in content. Add contextual links to related products in descriptions.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" },
      { name: "SEO Manager", desc: "SEO Manager suggests internal links. Add 3–6 relevant links with descriptive anchors in product content.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Links", desc: "Wix editor supports anchor and product links. Add internal links to related products in description.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Navigation", desc: "Squarespace allows internal links in content. Add links to related products/categories in description.", linkLibrary: "", linkWebsite: "" }]
  },
  "Breadcrumb Navigation": {
    WordPress: [
      { name: "Yoast SEO", desc: "Yoast SEO adds breadcrumb schema automatically. Enable breadcrumbs in settings and ensure hierarchy shows Home > Category > Product.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Breadcrumb NavXT", desc: "Breadcrumb NavXT creates custom breadcrumb trails. Install, configure hierarchy, and add schema markup.", linkLibrary: "https://wordpress.org/plugins/breadcrumb-navxt/", linkWebsite: "https://mtekk.us/code/breadcrumb-navxt/" },
      { name: "Rank Math", desc: "Rank Math includes breadcrumb support with schema. Enable breadcrumbs in settings and customize hierarchy.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Breadcrumb App", desc: "Breadcrumb App adds custom breadcrumb navigation. Install and configure to show Home > Category > Product.", linkLibrary: "https://apps.shopify.com/breadcrumbs", linkWebsite: "" },
      { name: "Smart SEO", desc: "Smart SEO includes breadcrumb markup. Enable breadcrumbs in app settings for proper hierarchy.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Breadcrumbs", desc: "Wix supports native breadcrumbs in store pages. Enable breadcrumbs in navigation settings for hierarchy display.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Navigation", desc: "Squarespace provides breadcrumb tools in store. Enable breadcrumbs in design settings for clear hierarchy.", linkLibrary: "", linkWebsite: "" }]
  },
  "Product Schema Markup": {
    WordPress: [
      { name: "Schema & Structured Data for WP", desc: "This is the best free plugin for full Product schema generation. Install, enable Product schema type, map WooCommerce fields like price, availability, brand, and reviews to unlock rich snippets.", linkLibrary: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", linkWebsite: "https://wpschema.com/" },
      { name: "Rank Math", desc: "Rank Math includes built-in Product schema with field mapping. Enable schema in settings, select Product type on product pages, fill required fields, and validate output.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "AIOSEO provides a schema generator for WooCommerce products. Enable Product schema, map price, availability, and review fields, and use preview to verify markup.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Schema Plus", desc: "Schema Plus adds advanced Product schema with offers and ratings. Install, configure schema types for products, and map price/stock data.", linkLibrary: "https://apps.shopify.com/schema-plus-for-seo", linkWebsite: "" },
      { name: "SEO Manager", desc: "SEO Manager includes product schema templates with variables. Set up schema in app settings and apply to all products.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Structured Data", desc: "Wix automatically generates Product schema when product fields are filled. Complete name, image, price, availability, and brand in product settings to enable rich snippets.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Schema", desc: "Squarespace injects Product schema from product details. Fill required fields (name, image, price, stock) and use code injection for advanced markup if needed.", linkLibrary: "", linkWebsite: "" }]
  },
  "Price & Availability Markup": {
    WordPress: [
      { name: "Schema & Structured Data for WP", desc: "Schema & Structured Data for WP supports offer and price schema. Map price, currency, and availability fields in plugin settings to enable correct markup.", linkLibrary: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", linkWebsite: "https://wpschema.com/" },
      { name: "Rank Math", desc: "Rank Math adds price and availability in Product schema. Fill offer fields with price, currency, and stock status on product pages.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "AIOSEO includes offer markup for products. Map price and availability fields in schema settings to show correct data in SERPs.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Schema Plus", desc: "Schema Plus adds price and availability markup. Configure offer fields with price, currency, and stock status.", linkLibrary: "https://apps.shopify.com/schema-plus-for-seo", linkWebsite: "" },
      { name: "SEO Manager", desc: "SEO Manager includes price and stock schema templates. Set up offer markup in app settings and apply to products.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in", desc: "Wix includes price and availability in schema automatically. Fill price and stock status in product settings to enable correct markup.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in", desc: "Squarespace adds price and availability schema from product data. Ensure price and stock fields are complete for accurate markup.", linkLibrary: "", linkWebsite: "" }]
  },
  "Review Schema & Aggregation": {
    WordPress: [
      { name: "Yotpo", desc: "Yotpo adds review schema and UGC with aggregate ratings. Install, enable reviews, and display star rating + review count on products.", linkLibrary: "https://wordpress.org/plugins/yotpo-social-reviews/", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Judge.me provides aggregate rating schema and reviews. Install, encourage reviews, and show average stars with count.", linkLibrary: "https://wordpress.org/plugins/judge-me-product-reviews-woocommerce/", linkWebsite: "https://judge.me/" },
      { name: "WP Review", desc: "WP Review adds review schema and aggregation. Enable reviews on products and display average rating with count.", linkLibrary: "https://wordpress.org/plugins/wp-review/", linkWebsite: "https://mythemeshop.com/plugins/wp-review-pro/" }
    ],
    Shopify: [
      { name: "Yotpo", desc: "Yotpo collects reviews and adds schema with aggregate ratings. Install, enable reviews, and display star rating + count.", linkLibrary: "https://apps.shopify.com/yotpo-social-reviews", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Judge.me adds schema and aggregate rating display. Install and show average stars with review count on products.", linkLibrary: "https://apps.shopify.com/judgeme", linkWebsite: "https://judge.me/" }
    ],
    Wix: [{ name: "Built-in Reviews", desc: "Wix Reviews enables ratings and schema support. Turn on reviews in store settings and display average rating.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in", desc: "Squarespace supports review markup from product data. Enable ratings and show average stars with count.", linkLibrary: "", linkWebsite: "" }]
  },
  "Variant Handling": {
    WordPress: [
      { name: "WooCommerce", desc: "WooCommerce provides built-in variant management for products. Add variations in product edit screen with dropdowns or swatches for colors/sizes.", linkLibrary: "https://wordpress.org/plugins/woocommerce/", linkWebsite: "https://woocommerce.com/" },
      { name: "YITH WooCommerce Product Add-ons", desc: "YITH adds advanced variant and option handling. Install and create custom variant selectors for products.", linkLibrary: "https://wordpress.org/plugins/yith-woocommerce-product-add-ons/", linkWebsite: "https://yithemes.com/" },
      { name: "Variation Swatches for WooCommerce", desc: "Variation Swatches turns dropdowns into visual selectors. Install and configure swatches for color/size variants.", linkLibrary: "https://wordpress.org/plugins/variation-swatches-for-woocommerce/", linkWebsite: "https://getwooplugins.com/" }
    ],
    Shopify: [
      { name: "Built-in Variants", desc: "Shopify handles variants natively with dropdowns and swatches. Add variants in product settings and enable visual selectors.", linkLibrary: "", linkWebsite: "https://help.shopify.com/" },
      { name: "Infinite Options", desc: "Infinite Options adds advanced variant and custom option handling. Install and create custom selectors for products.", linkLibrary: "https://apps.shopify.com/custom-options", linkWebsite: "https://infiniteoptions.com/" }
    ],
    Wix: [{ name: "Built-in Store", desc: "Wix store supports variant dropdowns and options. Add variants in product settings and enable visual selectors.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Commerce", desc: "Squarespace commerce handles variants with dropdowns. Add variants in product settings for clean handling.", linkLibrary: "", linkWebsite: "" }]
  },
  "Social Sharing Integration": {
    WordPress: [
      { name: "Monarch", desc: "Monarch adds beautiful social sharing buttons with OG tag support. Install, place buttons on product pages, and configure OG tags for better sharing.", linkLibrary: "https://www.elegantthemes.com/plugins/monarch/", linkWebsite: "https://www.elegantthemes.com/plugins/monarch/" },
      { name: "AddToAny Share Buttons", desc: "AddToAny provides lightweight sharing with Open Graph integration. Add buttons to product pages and verify OG tags in source code.", linkLibrary: "https://wordpress.org/plugins/add-to-any/", linkWebsite: "https://www.addtoany.com/" },
      { name: "Social Warfare", desc: "Social Warfare offers stylish sharing buttons and OG control. Place buttons on product pages and set up OG tags.", linkLibrary: "https://wordpress.org/plugins/social-warfare/", linkWebsite: "https://warfareplugins.com/" }
    ],
    Shopify: [
      { name: "Social Share Buttons", desc: "Social Share Buttons adds sharing icons with OG integration. Install and place buttons on product pages.", linkLibrary: "https://apps.shopify.com/social-share-buttons", linkWebsite: "" },
      { name: "AddToAny Share", desc: "AddToAny Share provides universal sharing with meta tags. Add the app and configure buttons for social visibility.", linkLibrary: "https://apps.shopify.com/addtoany-share-buttons", linkWebsite: "https://www.addtoany.com/" }
    ],
    Wix: [{ name: "Built-in Social", desc: "Wix includes built-in social sharing tools and OG tags. Enable sharing buttons in product settings and verify OG meta tags.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Sharing", desc: "Squarespace provides native social sharing buttons. Enable sharing in design settings and verify OG tags.", linkLibrary: "", linkWebsite: "" }]
  }
};

function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) {
    console.log('Plugin Solutions: No low/average metrics to show');
    return;
  }

  console.log('Rendering Plugin Solutions for metrics:', failedMetrics.map(m => m.name));

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Plugin Solutions container not found: #${containerId}`);
    return;
  }

  const section = document.createElement('section');
  section.className = 'mt-20 max-w-5xl mx-auto px-4';

  section.innerHTML = `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
      Plugin Solutions for Product SEO
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      ${failedMetrics.length} issue${failedMetrics.length > 1 ? 's need' : ' needs'} attention.
      Check your theme or template first — many modern themes already include some of these optimizations.
      Expand any panel below to see top free/freemium plugins/apps that can help fix it.
    </p>
    <div class="space-y-6">
      ${failedMetrics.map(m => {
        const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
        const g = getPluginGrade(m.score); // Use updated grade function
        return `
          <details class="group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <summary class="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
              <h3 class="text-2xl md:text-3xl font-bold ${g.color}">
                ${g.emoji} ${m.name}
              </h3>
              <div class="transform transition-transform duration-300 group-open:rotate-180">
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </summary>
            <div class="px-2 md:px-8 pb-8 md:pb-10 border-t border-gray-200 dark:border-gray-700">
              <div class="max-w-md mx-auto my-8">
                <select id="cms-select-${metricId}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                  <option value="">Select your platform / CMS...</option>
                  ${Object.keys(pluginData[m.name] || {}).map(cms =>
                    `<option value="${cms}">${cms}</option>`
                  ).join('')}
                </select>
              </div>
              <div id="plugins-${metricId}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
                <!-- Plugins will be injected here -->
              </div>
            </div>
          </details>
        `;
      }).join('')}
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-12">
      These popular free/freemium plugins and apps can significantly improve these areas.
      Always test on a staging environment first and check for recent reviews/updates.
    </p>
  `;

  container.appendChild(section);

  // Attach event listeners
  setTimeout(() => {
    failedMetrics.forEach(m => {
      const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
      const select = document.getElementById(`cms-select-${metricId}`);
      const pluginsList = document.getElementById(`plugins-${metricId}`);

      if (!select || !pluginsList) return;

      select.addEventListener('change', (e) => {
        const selected = e.target.value;
        pluginsList.innerHTML = '';
        pluginsList.classList.add('hidden');

        if (!selected || !pluginData[m.name]?.[selected]) return;

        pluginData[m.name][selected].forEach(plugin => {
          const card = document.createElement('div');
          card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden';
          card.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-600/5 dark:from-orange-500/10 dark:to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${plugin.name}</h4>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">${plugin.desc}</p>
              <div class="flex flex-wrap gap-4">
                ${plugin.linkLibrary ? `
                  <a href="${plugin.linkLibrary}" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow hover:shadow-md transition">
                    Plugin Library
                  </a>
                ` : ''}
                ${plugin.linkWebsite ? `
                  <a href="${plugin.linkWebsite}" target="_blank" rel="noopener" class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-medium rounded-lg shadow hover:shadow-md transition">
                    Plugin Website
                  </a>
                ` : ''}
              </div>
            </div>
          `;
          pluginsList.appendChild(card);
        });

        if (pluginsList.children.length > 0) {
          pluginsList.classList.remove('hidden');
        }
      });
    });
  }, 0);
}

export { renderPluginSolutions };