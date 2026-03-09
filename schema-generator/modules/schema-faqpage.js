// modules/schema-faqpage.js
// FAQPage schema module for Traffic Torch Schema Generator
// Implements Schema.org FAQPage (v15+) – mainEntity as array of Question + Answer
// Designed for dynamic form editing + real-time preview

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd,
  createEducationSnippet
} from './index.js';

export const FAQPage = {
  // ──────────────────────────────────────────────
  // Metadata for UI (dropdown, cards, recommendations)
  // ──────────────────────────────────────────────
  type: 'FAQPage',
  label: 'FAQ Page',
  description: 'Best for pages with multiple questions and direct answers. Enables expandable FAQ rich results in Google SERPs, improves voice search visibility, and helps users get quick answers without scrolling.',
  icon: 'question-mark-circle', // Use heroicons name or SVG path later

  // ──────────────────────────────────────────────
  // Form configuration – used to build dynamic editor fields
  // ──────────────────────────────────────────────
  formFields: [
{
  key: 'name',
  label: 'Schema Name / Title (recommended)',
  type: 'text',
  placeholder: 'Frequently Asked Questions about [Topic]',
  required: false,
  help: 'This appears in search results as the title for the FAQ block. Prefilled from page title if scanned, or enter manually. Use a clear, descriptive title matching user intent.'
},
    {
      key: 'mainEntity',
      label: 'Questions & Answers',
      type: 'array',
      minItems: 1,
      maxItems: 12, // Google recommends not exceeding ~10-12 for best rich result display
      itemLabel: 'Q&A Pair',
      itemFields: [
        {
          key: 'question.name',
          label: 'Question',
          type: 'textarea',
          rows: 2,
          placeholder: 'What is schema markup?',
          required: true,
          help: 'Must be a clear, natural-language question users actually search for.'
        },
        {
          key: 'acceptedAnswer.text',
          label: 'Answer',
          type: 'textarea',
          rows: 5,
          placeholder: 'Schema markup is structured data that helps search engines understand your content...',
          required: true,
          help: 'Provide a concise, complete answer (150–400 words ideal). Use bullet points or short paragraphs for readability.'
        }
      ]
    }
  ],

  // ──────────────────────────────────────────────
  // Education / Tooltip content (HTML string)
  // ──────────────────────────────────────────────
  education: createEducationSnippet(`
    **Best use cases**  
    - FAQ sections on blog posts, product pages, service pages  
    - How-to guides with embedded questions  
    - Support/knowledge base articles  

    **Benefits**  
    - Expandable rich results in SERPs (mobile + desktop)  
    - Better voice search answers (Google Assistant, Siri)  
    - Helps AI overviews pull direct answers from your site  

    **Guidelines (2026)**  
    - Questions should match real user search intent  
    - Answers must be on the visible page (no hidden content)  
    - Limit to 3–10 high-quality Q&As per page  
    - Avoid keyword stuffing or repetitive questions  
    - Use JSON-LD format only (preferred by Google)
  `),

  // ──────────────────────────────────────────────
  // Generate full JSON-LD from form data
  // ──────────────────────────────────────────────
  generate(data = {}) {
    // Build base skeleton
    const base = buildJsonLdSkeleton('FAQPage', {
      name: data.name || 'Frequently Asked Questions',
      // Optional: add url or @id if available from page context
    });

    // Map Q&A pairs into mainEntity array
    const mainEntity = (data.mainEntity || []).map(item => {
      if (!item.question?.name || !item.acceptedAnswer?.text) return null;

      return {
        '@type': 'Question',
        name: item.question.name.trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.acceptedAnswer.text.trim()
        }
      };
    }).filter(Boolean); // remove invalid entries

    const schema = {
      ...base,
      mainEntity: mainEntity.length > 0 ? mainEntity : undefined
    };

    // Clean and return
    return cleanJsonLd(schema);
  },

  // ──────────────────────────────────────────────
  // Validate the generated schema (returns { valid, errors })
  // ──────────────────────────────────────────────
  validate(data) {
    const jsonLd = this.generate(data);

    // Required top-level fields for FAQPage
    const required = [
      'mainEntity',
      'mainEntity.0.@type',           // at least one Question
      'mainEntity.0.name',
      'mainEntity.0.acceptedAnswer.@type',
      'mainEntity.0.acceptedAnswer.text'
    ];

    return validateRequiredFields(jsonLd, required);
  },

  // ──────────────────────────────────────────────
  // Optional: Quick preview string (used in UI before full render)
  // ──────────────────────────────────────────────
  preview(data) {
    const jsonLd = this.generate(data);
    if (!jsonLd.mainEntity?.length) {
      return '// No valid Q&A pairs yet – add at least one question and answer';
    }
    return prettyJsonLd(jsonLd);
  }
};