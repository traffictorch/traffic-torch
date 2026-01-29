// Updated plugin-solutions.js for metric-wide rendering and product-torch metrics
function getPluginGrade(score) {
if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
return { grade: 'Poor', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
}
const pluginData = {
"Title Tag Optimization": {
WordPress: [
{ name: "Yoast SEO", desc: "Templates for title optimization with previews, keyword focus, and length checks. Essential for on-page SEO.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Rank Math", desc: "Advanced title templates with auto-optimization and SEO analysis. Free with pro features.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "SEO Booster", desc: "Auto-optimizes titles for length and keywords. Bulk editing included.", link: "https://apps.shopify.com/seo-booster" },
{ name: "Plug in SEO", desc: "Title optimization with templates and audits. Improves CTR.", link: "https://apps.shopify.com/plug-in-seo" }
],
Wix: [
{ name: "Built-in SEO Wiz", desc: "Guides title optimization with previews and best practices.", link: "" }
],
Squarespace: [
{ name: "Built-in SEO Tools", desc: "Title editing with length recommendations in page settings.", link: "" }
],
Joomla: [
{ name: "EFSEO", desc: "Auto title generation and optimization.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://weeblr.com/joomla-seo/efseo" }
],
Drupal: [
{ name: "Metatag", desc: "Custom title templates and optimization.", link: "https://www.drupal.org/project/metatag" }
]
},
"Meta Description Relevance": {
WordPress: [
{ name: "Yoast SEO", desc: "Meta description templates with keyword and length checks.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Rank Math", desc: "AI-assisted meta descriptions with previews.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "SEO Booster", desc: "Bulk meta description optimization.", link: "https://apps.shopify.com/seo-booster" },
{ name: "Plug in SEO", desc: "Meta templates and relevance audits.", link: "https://apps.shopify.com/plug-in-seo" }
],
Wix: [
{ name: "Built-in SEO Wiz", desc: "Meta description guidance with CTA suggestions.", link: "" }
],
Squarespace: [
{ name: "Built-in SEO Tools", desc: "Meta editing with length limits.", link: "" }
],
Joomla: [
{ name: "EFSEO", desc: "Easy meta description editing.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://weeblr.com/joomla-seo/efseo" }
],
Drupal: [
{ name: "Metatag", desc: "Meta description management.", link: "https://www.drupal.org/project/metatag" }
]
},
"Heading Structure (H1–H6)": {
WordPress: [
{ name: "Yoast SEO", desc: "Heading analysis and hierarchy suggestions.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Rank Math", desc: "On-page heading optimizer.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "SEO Booster", desc: "Heading structure audits.", link: "https://apps.shopify.com/seo-booster" }
],
Wix: [
{ name: "Built-in Editor", desc: "Heading tags in content blocks.", link: "" }
],
Squarespace: [
{ name: "Built-in Blocks", desc: "Proper heading implementation.", link: "" }
],
Joomla: [
{ name: "sh404SEF", desc: "Heading and SEO analysis.", link: "https://extensions.joomla.org/extension/sh404sef/", homeLink: "https://weeblr.com/joomla-seo/sh404sef" }
],
Drupal: [
{ name: "SEO Checklist", desc: "Heading structure checks.", link: "https://www.drupal.org/project/seo_checklist" }
]
},
"URL Structure": {
WordPress: [
{ name: "Yoast SEO", desc: "Permalink optimization.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Rank Math", desc: "URL rewriting tools.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "Smart SEO", desc: "URL optimization.", link: "https://apps.shopify.com/smart-seo" }
],
Wix: [
{ name: "Built-in SEO Wiz", desc: "URL slug editing.", link: "" }
],
Squarespace: [
{ name: "Built-in Tools", desc: "Clean URL management.", link: "" }
],
Joomla: [
{ name: "sh404SEF", desc: "Advanced URL management.", link: "https://extensions.joomla.org/extension/sh404sef/", homeLink: "https://weeblr.com/joomla-seo/sh404sef" }
],
Drupal: [
{ name: "Pathauto", desc: "Automatic URL aliases.", link: "https://www.drupal.org/project/pathauto" }
]
},
"Keyword Optimization": {
WordPress: [
{ name: "Yoast SEO", desc: "Keyword density and placement analysis.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Rank Math", desc: "Keyword optimizer with suggestions.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "SEO Booster", desc: "Keyword tools and audits.", link: "https://apps.shopify.com/seo-booster" }
],
Wix: [
{ name: "Built-in SEO Wiz", desc: "Keyword guidance.", link: "" }
],
Squarespace: [
{ name: "Built-in Tools", desc: "Keyword integration tips.", link: "" }
],
Joomla: [
{ name: "EFSEO", desc: "Keyword optimization.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://weeblr.com/joomla-seo/efseo" }
],
Drupal: [
{ name: "SEO Checklist", desc: "Keyword checks.", link: "https://www.drupal.org/project/seo_checklist" }
]
},
"Mobile-Friendliness": {
WordPress: [
{ name: "AMP for WP", desc: "Mobile optimization with responsive checks.", link: "https://wordpress.org/plugins/accelerated-mobile-pages/", homeLink: "https://ampforwp.com/" },
{ name: "WPtouch", desc: "Mobile theme switcher.", link: "https://wordpress.org/plugins/wptouch/", homeLink: "https://wptouch.com/" }
],
Shopify: [
{ name: "Ampify", desc: "Mobile AMP pages.", link: "https://apps.shopify.com/ampify-me" }
],
Wix: [
{ name: "Built-in Mobile Editor", desc: "Responsive design tools.", link: "" }
],
Squarespace: [
{ name: "Built-in Responsive", desc: "Automatic mobile optimization.", link: "" }
],
Joomla: [
{ name: "Mobile Joomla", desc: "Mobile detection and optimization.", link: "https://extensions.joomla.org/extension/mobilejoomla/", homeLink: "https://www.mobilejoomla.com/" }
],
Drupal: [
{ name: "Responsive Images", desc: "Mobile image handling.", link: "https://www.drupal.org/project/responsive_images" }
]
},
"HTTPS Implementation": {
WordPress: [
{ name: "Really Simple SSL", desc: "Forces HTTPS and fixes mixed content.", link: "https://wordpress.org/plugins/really-simple-ssl/", homeLink: "https://really-simple-ssl.com/" }
],
Shopify: [
{ name: "Built-in HTTPS", desc: "Native SSL support.", link: "" }
],
Wix: [
{ name: "Built-in SSL", desc: "Automatic HTTPS.", link: "" }
],
Squarespace: [
{ name: "Built-in SSL", desc: "Free SSL certificates.", link: "" }
],
Joomla: [
{ name: "Admin Tools", desc: "HTTPS enforcement.", link: "https://extensions.joomla.org/extension/admin-tools/", homeLink: "https://www.akeeba.com/products/admin-tools.html" }
],
Drupal: [
{ name: "Secure Pages", desc: "HTTPS redirection.", link: "https://www.drupal.org/project/securepages" }
]
},
"Canonical Tags": {
WordPress: [
{ name: "Yoast SEO", desc: "Auto canonical tags.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Rank Math", desc: "Canonical management.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "Plug in SEO", desc: "Canonical audits.", link: "https://apps.shopify.com/plug-in-seo" }
],
Wix: [
{ name: "Built-in SEO", desc: "Canonical handling.", link: "" }
],
Squarespace: [
{ name: "Built-in Tools", desc: "Automatic canonicals.", link: "" }
],
Joomla: [
{ name: "sh404SEF", desc: "Canonical tags.", link: "https://extensions.joomla.org/extension/sh404sef/", homeLink: "https://weeblr.com/joomla-seo/sh404sef" }
],
Drupal: [
{ name: "Metatag", desc: "Canonical support.", link: "https://www.drupal.org/project/metatag" }
]
},
"Meta Robots Directives": {
WordPress: [
{ name: "Yoast SEO", desc: "Robots meta controls.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" }
],
Shopify: [
{ name: "Plug in SEO", desc: "Robots directives.", link: "https://apps.shopify.com/plug-in-seo" }
],
Wix: [
{ name: "Built-in SEO", desc: "Index controls.", link: "" }
],
Squarespace: [
{ name: "Built-in Tools", desc: "Robots settings.", link: "" }
],
Joomla: [
{ name: "sh404SEF", desc: "Robots management.", link: "https://extensions.joomla.org/extension/sh404sef/", homeLink: "https://weeblr.com/joomla-seo/sh404sef" }
],
Drupal: [
{ name: "Metatag", desc: "Robots directives.", link: "https://www.drupal.org/project/metatag" }
]
},
"Sitemap Inclusion Hints": {
WordPress: [
{ name: "Yoast SEO", desc: "Auto XML sitemaps.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Google XML Sitemaps", desc: "Dynamic sitemaps.", link: "https://wordpress.org/plugins/google-sitemap-generator/", homeLink: "https://status301.net/wordpress-plugins/xml-sitemaps/" }
],
Shopify: [
{ name: "XML Sitemap & Google", desc: "Auto sitemaps.", link: "https://apps.shopify.com/xml-sitemap" }
],
Wix: [
{ name: "Built-in Sitemap", desc: "Automatic generation.", link: "" }
],
Squarespace: [
{ name: "Built-in Sitemap", desc: "Native XML sitemaps.", link: "" }
],
Joomla: [
{ name: "OSMap", desc: "Sitemap generator.", link: "https://extensions.joomla.org/extension/osmap/", homeLink: "https://joomlashack.com/joomla-extensions/osmap/" }
],
Drupal: [
{ name: "XML Sitemap", desc: "Sitemap module.", link: "https://www.drupal.org/project/xmlsitemap" }
]
},
"Product Description Quality": {
WordPress: [
{ name: "Yoast SEO", desc: "Content analysis for descriptions.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" }
],
Shopify: [
{ name: "SEO Booster", desc: "Description optimization.", link: "https://apps.shopify.com/seo-booster" }
],
Wix: [
{ name: "Built-in Editor", desc: "Rich text for descriptions.", link: "" }
],
Squarespace: [
{ name: "Built-in Blocks", desc: "Structured descriptions.", link: "" }
],
Joomla: [
{ name: "K2", desc: "Advanced content for products.", link: "https://extensions.joomla.org/extension/k2/", homeLink: "https://getk2.org/" }
],
Drupal: [
{ name: "Commerce", desc: "Product description tools.", link: "https://www.drupal.org/project/commerce" }
]
},
"Image Optimization": {
WordPress: [
{ name: "Smush", desc: "Bulk compression with lazy loading, WebP/AVIF, and alt text suggestions. Auto-fills alt from filename/title or uses AI extensions. Trusted by millions for reliable accessibility and performance.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
{ name: "EWWW Image Optimizer", desc: "Pixel-perfect compression with WebP/AVIF support and bulk alt text tools. Local or cloud processing for quality retention. Excellent for professional sites needing accessibility fixes.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" },
{ name: "Imagify", desc: "Smart compression levels with visual comparison, next-gen formats, and alt text suggestions. Bulk restore and automatic optimization. Premium feel with strong accessibility focus.", link: "https://wordpress.org/plugins/imagify-image-optimizer/", homeLink: "https://imagify.io/" }
],
Shopify: [
{ name: "TinyIMG", desc: "Complete optimization with AI alt text generation, bulk processing, and WebP/AVIF support. Monitors new uploads automatically. Proven to fix alt coverage and improve accessibility.", link: "https://apps.shopify.com/tinyimg", homeLink: "https://tiny-img.com/" },
{ name: "Crush.pics", desc: "Automatic compression on upload with SEO-friendly alt/filenames and bulk tools. Set-and-forget with strong results. Clean way to improve alt text coverage.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" }
],
Wix: [
{ name: "Built-in Optimizer", desc: "Auto-compresses images on upload with manual alt text editing in editor. Native accessibility solution. Focus on adding alt text manually for full coverage.", link: "" }
],
Squarespace: [
{ name: "Built-in Tools", desc: "Native compression and responsive delivery with alt text fields in editor. Consistent across templates. Add alt text manually for complete coverage.", link: "" }
],
Joomla: [
{ name: "ImageRecycle", desc: "Cloud compression for images/PDFs with bulk alt text tools. Preserves quality and improves accessibility. Integrates with media manager.", link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/", homeLink: "https://www.imagerecycle.com/" }
],
Drupal: [
{ name: "ImageAPI Optimize", desc: "Defines optimization pipelines with alt text support and WebP/AVIF. Bulk processing for accessibility. Flexible for advanced sites.", link: "https://www.drupal.org/project/imageapi_optimize" }
]
},
"Video Embed Quality": {
WordPress: [
{ name: "EmbedPress", desc: "Optimized video embeds with captions.", link: "https://wordpress.org/plugins/embedpress/", homeLink: "https://wpdeveloper.com/plugins/embedpress/" }
],
Shopify: [
{ name: "Video Embed Optimizer", desc: "Lazy video loading.", link: "https://apps.shopify.com/video-embed-optimizer" }
],
Wix: [
{ name: "Built-in Video", desc: "Caption support.", link: "" }
],
Squarespace: [
{ name: "Built-in Video Blocks", desc: "Embed with captions.", link: "" }
],
Joomla: [
{ name: "AllVideos", desc: "Video embedding with options.", link: "https://extensions.joomla.org/extension/allvideos/", homeLink: "https://www.joomlaworks.net/extensions/allvideos" }
],
Drupal: [
{ name: "Video Embed Field", desc: "Captioned embeds.", link: "https://www.drupal.org/project/video_embed_field" }
]
},
"User-Generated Content (UGC)": {
WordPress: [
{ name: "Yotpo", desc: "Reviews and UGC with schema.", link: "https://wordpress.org/plugins/yotpo-social-reviews-for-woocommerce/", homeLink: "https://www.yotpo.com/" },
{ name: "Judge.me", desc: "Product reviews with photos.", link: "https://apps.shopify.com/judgeme", homeLink: "https://judge.me/" } // Cross-platform but WP compatible
],
Shopify: [
{ name: "Yotpo", desc: "UGC and reviews.", link: "https://apps.shopify.com/yotpo-social-reviews" },
{ name: "Judge.me", desc: "Photo/video reviews.", link: "https://apps.shopify.com/judgeme" }
],
Wix: [
{ name: "Wix Reviews", desc: "Built-in UGC.", link: "" }
],
Squarespace: [
{ name: "Built-in Comments", desc: "UGC support.", link: "" }
],
Joomla: [
{ name: "JComments", desc: "Advanced comments.", link: "https://extensions.joomla.org/extension/jcomments/", homeLink: "https://www.joomlatools.com/extensions/jcomments" }
],
Drupal: [
{ name: "Reviews", desc: "UGC module.", link: "https://www.drupal.org/project/reviews" }
]
},
"Internal Linking": {
WordPress: [
{ name: "Yoast SEO", desc: "Internal link suggestions.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" }
],
Shopify: [
{ name: "Smart SEO", desc: "Link optimization.", link: "https://apps.shopify.com/smart-seo" }
],
Wix: [
{ name: "Built-in Links", desc: "Anchor links.", link: "" }
],
Squarespace: [
{ name: "Built-in Navigation", desc: "Internal linking.", link: "" }
],
Joomla: [
{ name: "sh404SEF", desc: "Link management.", link: "https://extensions.joomla.org/extension/sh404sef/", homeLink: "https://weeblr.com/joomla-seo/sh404sef" }
],
Drupal: [
{ name: "Linkit", desc: "Internal link tools.", link: "https://www.drupal.org/project/linkit" }
]
},
"Breadcrumb Navigation": {
WordPress: [
{ name: "Yoast SEO", desc: "Breadcrumb schema.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
{ name: "Breadcrumb NavXT", desc: "Custom breadcrumbs.", link: "https://wordpress.org/plugins/breadcrumb-navxt/", homeLink: "https://mtekk.us/code/breadcrumb-navxt/" }
],
Shopify: [
{ name: "Breadcrumb App", desc: "Custom breadcrumbs.", link: "https://apps.shopify.com/breadcrumbs" }
],
Wix: [
{ name: "Built-in Breadcrumbs", desc: "Native support.", link: "" }
],
Squarespace: [
{ name: "Built-in Navigation", desc: "Breadcrumb tools.", link: "" }
],
Joomla: [
{ name: "Custom Breadcrumbs", desc: "Breadcrumb module.", link: "https://extensions.joomla.org/extension/custom-breadcrumbs/" }
],
Drupal: [
{ name: "Easy Breadcrumb", desc: "Breadcrumb generator.", link: "https://www.drupal.org/project/easy_breadcrumb" }
]
},
"Product Schema Markup": {
WordPress: [
{ name: "Schema Pro", desc: "Product schema generator.", link: "https://wpschema.com/", homeLink: "https://wpschema.com/" },
{ name: "Rank Math", desc: "Built-in product schema.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "Schema Plus", desc: "Advanced schema.", link: "https://apps.shopify.com/schema-plus-for-seo" }
],
Wix: [
{ name: "Built-in Structured Data", desc: "Product markup.", link: "" }
],
Squarespace: [
{ name: "Built-in Schema", desc: "Native support.", link: "" }
],
Joomla: [
{ name: "Schema Manager", desc: "Schema tools.", link: "https://extensions.joomla.org/extension/schema-manager/" }
],
Drupal: [
{ name: "Schema.org Metatag", desc: "Product schema.", link: "https://www.drupal.org/project/schema_metatag" }
]
},
"Price & Availability Markup": {
WordPress: [
{ name: "Schema Pro", desc: "Offer and price schema.", link: "https://wpschema.com/", homeLink: "https://wpschema.com/" }
],
Shopify: [
{ name: "Schema Plus", desc: "Price markup.", link: "https://apps.shopify.com/schema-plus-for-seo" }
],
Wix: [
{ name: "Built-in", desc: "Price schema.", link: "" }
],
Squarespace: [
{ name: "Built-in", desc: "Availability markup.", link: "" }
],
Joomla: [
{ name: "Schema Manager", desc: "Price tools.", link: "https://extensions.joomla.org/extension/schema-manager/" }
],
Drupal: [
{ name: "Schema.org Metatag", desc: "Offer schema.", link: "https://www.drupal.org/project/schema_metatag" }
]
},
"Review Schema & Aggregation": {
WordPress: [
{ name: "WP Review Pro", desc: "Review schema.", link: "https://wordpress.org/plugins/wp-review/", homeLink: "https://mythemeshop.com/plugins/wp-review-pro/" },
{ name: "Rank Math", desc: "Aggregate rating schema.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
],
Shopify: [
{ name: "Yotpo", desc: "Review schema.", link: "https://apps.shopify.com/yotpo-social-reviews" }
],
Wix: [
{ name: "Built-in Reviews", desc: "Schema support.", link: "" }
],
Squarespace: [
{ name: "Built-in", desc: "Review markup.", link: "" }
],
Joomla: [
{ name: "Schema Manager", desc: "Review schema.", link: "https://extensions.joomla.org/extension/schema-manager/" }
],
Drupal: [
{ name: "Schema.org Metatag", desc: "Review schema.", link: "https://www.drupal.org/project/schema_metatag" }
]
},
"Variant Handling": {
WordPress: [
{ name: "WooCommerce", desc: "Built-in variant management.", link: "https://wordpress.org/plugins/woocommerce/", homeLink: "https://woocommerce.com/" }
],
Shopify: [
{ name: "Built-in Variants", desc: "Native handling.", link: "" }
],
Wix: [
{ name: "Built-in Store", desc: "Variant tools.", link: "" }
],
Squarespace: [
{ name: "Built-in Commerce", desc: "Variants.", link: "" }
],
Joomla: [
{ name: "HikaShop", desc: "Variant support.", link: "https://extensions.joomla.org/extension/hikashop/", homeLink: "https://www.hikashop.com/" }
],
Drupal: [
{ name: "Commerce", desc: "Product variants.", link: "https://www.drupal.org/project/commerce" }
]
},
"Social Sharing Integration": {
WordPress: [
{ name: "Monarch", desc: "Social sharing with OG tags.", link: "https://www.elegantthemes.com/plugins/monarch/", homeLink: "https://www.elegantthemes.com/plugins/monarch/" },
{ name: "AddToAny", desc: "Sharing buttons.", link: "https://wordpress.org/plugins/add-to-any/", homeLink: "https://www.addtoany.com/" }
],
Shopify: [
{ name: "Social Share Buttons", desc: "OG integration.", link: "https://apps.shopify.com/social-share-buttons" }
],
Wix: [
{ name: "Built-in Social", desc: "Sharing tools.", link: "" }
],
Squarespace: [
{ name: "Built-in Sharing", desc: "Social buttons.", link: "" }
],
Joomla: [
{ name: "AddThis", desc: "Sharing integration.", link: "https://extensions.joomla.org/extension/addthis-share-buttons/" }
],
Drupal: [
{ name: "AddToAny", desc: "Social sharing.", link: "https://www.drupal.org/project/addtoany" }
]
}
};
export function renderPluginSolutions(failedFactors, containerId) {
const container = document.getElementById(containerId);
if (!container) return;
container.innerHTML = '';
if (!Array.isArray(failedFactors) || failedFactors.length === 0) {
container.innerHTML = 'No failed metrics — your product page is optimized!';
return;
}
failedFactors.forEach(factor => {
const plugins = pluginData[factor.metric];
if (!plugins) return;
const section = document.createElement('div');
section.classList.add('bg-white', 'dark:bg-gray-800', 'rounded-3xl', 'shadow-xl', 'p-8', 'mb-12');
section.innerHTML = `
      
        ${factor.metric} Plugin Fixes
      
      Recommended tools to improve this metric (${factor.grade.emoji} ${factor.grade.grade})
    `;
    Object.keys(plugins).forEach(platform => {
      const platPlugins = plugins[platform];
      if (platPlugins.length === 0) return;
      const platDiv = document.createElement('div');
      platDiv.classList.add('mb-8');
      platDiv.innerHTML = `${platform}`;
      platPlugins.forEach(p => {
        const pluginCard = `
          
               $${p.name}
            ${p.desc}
          
        `;
        platDiv.innerHTML += pluginCard;
      });
      section.appendChild(platDiv);
    });
    container.appendChild(section);
  });
  if (container.innerHTML === '') {
    container.innerHTML = 'No plugin suggestions available for these metrics yet.';
  }
}