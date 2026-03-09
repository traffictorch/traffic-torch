// modules/schema-registry.js
// Central registry – add new schemas here only (no changes to script-v1.0.js needed)

import { FAQPage } from './schema-faqpage.js';
// Add future schemas as they are created, e.g.
// import { HowTo } from './schema-howto.js';
// import { Article } from './schema-article.js';

export const schemaRegistry = {
  FAQPage: FAQPage,
  // Add future types here, e.g.
  // HowTo: HowTo,
  // Article: Article,
  // Organization: Organization,
};