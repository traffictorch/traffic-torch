export const metricExplanations = {
  ctaSpecificity: {
    id: 'cta-specificity', emoji: '🎯', name: 'CTA specificity',
    what: 'Measures whether the button label describes the value of clicking (not the effort). It scores verbs like "Start" or "Get" higher than "Submit" or "Click".',
    how: 'Checks every visible <code>&lt;a&gt;</code>, <code>&lt;button&gt;</code>, and <code>[role="button"]</code>. It looks for strong action verbs, benefit words, specificity (numbers, timeframes), and optimal length (2–5 words).',
    why: 'Specific CTAs reduce perceived risk and have been shown to lift click-through rates by 15–35%. Vague labels force the user to guess what happens next.',
    link: '/blog/posts/uxid-help-guide/#cta-specificity'
  },
  ctaVisibility: {
    id: 'cta-visibility', emoji: '👁️', name: 'CTA visibility',
    what: 'Checks if the primary CTA is above the fold, large enough to tap (44px min-height), and high-contrast.',
    how: 'Uses structural proxies: checks if a CTA appears before the first <code>&lt;h2&gt;</code>, looks for inline styles hinting at large padding/min-height, and checks class names for button-like styling.',
    why: 'If users have to scroll to find the button, or if it blends into the background, you lose conversions. The primary action must be immediately obvious.',
    link: '/blog/posts/uxid-help-guide/#cta-visibility'
  },
  valueFirst: {
    id: 'value-first', emoji: '💎', name: 'Value-first framing',
    what: 'Checks if the opening copy (first 150 words) tells the user what they get, rather than listing company features.',
    how: 'Scans for benefit-first phrasing: "you get", "so you can", "helps you", "save time", "in 5 minutes", "without [X]", and related patterns.',
    why: 'Feature-first openings lose 30–40% of visitors before the pitch. Value-first copy answers the user’s primary question: "What’s in it for me?"',
    link: '/blog/posts/uxid-help-guide/#value-first'
  },
  headings: {
    id: 'action-headings', emoji: '📢', name: 'Action-oriented headings',
    what: 'Scans your H1 and H2 headings to ensure they start with action verbs (Start, Discover, Get) rather than passive labels (About us, Welcome).',
    how: 'Extracts all H1 and H2 tags. Checks if the first word is in a list of action verbs. Subtracts points if headings are passive or company-focused.',
    why: 'Action-oriented headings keep the reader moving down the page. Passive headings act as stop signs, signalling "this is about us" rather than "this is for you".',
    link: '/blog/posts/uxid-help-guide/#action-headings'
  },
  socialProof: {
    id: 'social-proof', emoji: '👥', name: 'Social proof placement',
    what: 'Measures the volume and proximity of social proof (testimonials, ratings, logos) to the primary CTA.',
    how: 'Counts blockquotes, review schema, client logos, and star ratings. Awards a bonus if these elements are located within a few DOM nodes (proximity) of the primary CTA.',
    why: 'Proof placed next to the CTA reduces hesitation at the exact moment of decision. Proof buried three sections below is largely ignored.',
    link: '/blog/posts/uxid-help-guide/#social-proof'
  },
  trust: {
    id: 'trust-anchors', emoji: '🛡️', name: 'Trust anchors',
    what: 'Checks for risk-reversal signals: guarantees, money-back promises, privacy statements, and security badges.',
    how: 'Scans text for specific trust patterns like "money-back", "cancel anytime", "no credit card", "GDPR", "no tracking", and "open source".',
    why: 'Trust anchors remove the perceived risk of taking action. "No credit card required" converts far better than "Sign up for free" because it removes the hidden fear of being charged.',
    link: '/blog/posts/uxid-help-guide/#trust-anchors'
  },
  urgency: {
    id: 'ethical-urgency', emoji: '⏰', name: 'Ethical urgency',
    what: 'Detects deadlines, countdowns, or scarcity. Classifies them as Ethical (specific date), Review (generic phrase), or Flagged (fake scarcity).',
    how: 'Scans for countdown widgets and deadline phrases. Checks for a specific date (e.g., "ends March 15"). Neutral by default if no urgency is present.',
    why: 'Real deadlines prompt action, but fake scarcity erodes trust and is increasingly regulated as a dark pattern. Urgency must be tied to a material consequence.',
    link: '/blog/posts/uxid-help-guide/#ethical-urgency'
  },
  frictionValue: {
    id: 'friction-value', emoji: '⚖️', name: 'Friction-to-value ratio',
    what: 'Compares the number of visible form fields to the number of value propositions on the page.',
    how: 'Counts visible inputs/selects/textareas and divides them by the number of benefit bullets or feature cards. Lower ratio = higher score.',
    why: 'Asking for 10 fields to get a newsletter is a terrible trade. If you ask for data, the value proposition must justify the effort.',
    link: '/blog/posts/uxid-help-guide/#friction-value'
  },
  commitment: {
    id: 'commitment-ladder', emoji: '🪜', name: 'Micro-commitment ladder',
    what: 'Checks for multiple entry points at different commitment levels (e.g., Newsletter → Free Trial → Demo).',
    how: 'Classifies CTAs as Low (newsletter, guide), Medium (trial, calculator), or High (purchase, demo). 2+ distinct levels score higher.',
    why: 'Visitors are at different stages of readiness. If your only CTA is "Book a Demo", you lose the 90% who aren\'t ready for that yet.',
    link: '/blog/posts/uxid-help-guide/#commitment-ladder'
  },
  reciprocity: {
    id: 'reciprocity', emoji: '🤝', name: 'Reciprocity',
    what: 'Scans for free, genuinely useful offers before the ask (free tools, templates, samples).',
    how: 'Searches for patterns like "free tool", "free template", "sample download", "free calculator".',
    why: 'Giving something of value first triggers a psychological obligation to return the favor. A free tool or audit builds goodwill that converts later.',
    link: '/blog/posts/uxid-help-guide/#reciprocity'
  },
  listPresence: {
    id: 'list-presence', emoji: '📋', name: 'List presence',
    what: 'Counts the number of structured lists (ul, ol, dl) in the main content.',
    how: 'Counts list elements. 89% of AI-cited pages contain at least one structured list.',
    why: 'AI engines extract answers in fragments. Lists are already fragmented and easy to lift. Prose has to be parsed. A list is a floor for citation-worthiness.',
    link: '/blog/posts/uxid-help-guide/#list-presence'
  },
  sourcedStats: {
    id: 'sourced-stats', emoji: '📊', name: 'Sourced statistics',
    what: 'Finds numbers on the page that are backed by a citation or source cue.',
    how: 'Scans for numbers followed by "according to", "study", "report", or a link.',
    why: 'Original statistics with sources are the highest-signal indicator of authority. They are 41% more likely to be cited by AI engines.',
    link: '/blog/posts/uxid-help-guide/#sourced-stats'
  },
  definitional: {
    id: 'definitional-clarity', emoji: '📖', name: 'Definitional clarity',
    what: 'Checks if the page clearly defines its core subject in the opening paragraph.',
    how: 'Looks for patterns like "[X] is", "[X] refers to", "[X] means" in the first few paragraphs, or a clear schema description.',
    why: 'AI engines need a clear, unambiguous definition to quote. If the definition is buried halfway down the page, the AI will look elsewhere.',
    link: '/blog/posts/uxid-help-guide/#definitional-clarity'
  },
  faq: {
    id: 'faq-structure', emoji: '❓', name: 'FAQ structure',
    what: 'Detects the presence of an FAQ section, FAQ schema, or Q&A blocks.',
    how: 'Checks for "FAQPage" schema, H2/H3 headings with "FAQ" or "Questions", and <code>&lt;details&gt;</code> elements.',
    why: 'FAQs provide structured, extractable Q&A pairs that directly answer search intent. Note: schema helps extraction, but the actual Q&A text is what gets cited.',
    link: '/blog/posts/uxid-help-guide/#faq-structure'
  },
  structuredData: {
    id: 'structured-data', emoji: '🏗️', name: 'Structured data',
    what: 'Detects the presence of JSON-LD schema types that help search engines and AI parse the page.',
    how: 'Parses JSON-LD and looks for key types: WebPage, Organization, Article, FAQPage, SoftwareApplication, BreadcrumbList.',
    why: 'Schema provides explicit, machine-readable context. It tells engines exactly what the entity is, who made it, and what it offers.',
    link: '/blog/posts/uxid-help-guide/#structured-data'
  }
};
