// ai-search-optimization-tool/metric-explanations.js
// Global object – no export needed for GitHub Pages classic script loading
window.metricExplanations = {
  'Bold/strong formatting in opening': {
    definition: 'This metric evaluates whether key statements in the opening section are highlighted using bold or strong formatting. It focuses on the first ~1200 characters of main content to identify emphasis tags.',
    detection: 'The tool scans for the presence of <strong>, <b>, or <em> tags in the extracted opening content after removing navigation and sidebars.',
    impact: 'Bold text signals the most important quotable insights to AI engines. Pages with bold key answers are far more likely to be directly cited in featured summaries and generative responses. This simple formatting dramatically improves visibility in AI-powered search results.'
  },
  'Clear definition pattern in opening': {
    definition: 'This metric checks if the page immediately provides a clear definition or explanation of the main topic. It looks for natural definitional language in the opening section.',
    detection: 'The tool searches the first ~1200 characters for patterns like “is”, “means”, “refers to”, “defined as”, or similar definitional phrasing.',
    impact: 'Direct definitions satisfy the most common user intent for informational queries. AI systems heavily favor pages that answer “what is” questions right away. This increases chances of being selected as the authoritative source in AI overviews.'
  },
  'FAQPage schema detected': {
    definition: 'This metric verifies whether the page includes proper structured data marking it as a FAQ page. It specifically looks for FAQPage schema in JSON-LD format.',
    detection: 'The tool parses all JSON-LD scripts and checks for @type "FAQPage" with valid question/answer pairs.',
    impact: 'FAQ schema enables rich FAQ results in traditional search and provides clean, structured Q&A for AI extraction. Pages with this markup are significantly more likely to appear in direct answers. It improves both click-through rates and AI citation potential.'
  },
  'Question-style H2 headings': {
    definition: 'This metric assesses whether subheadings are written as actual user questions. It rewards content structure that mirrors real search behavior.',
    detection: 'The tool examines all H2 headings for ending punctuation that indicates a question (question mark or sometimes exclamation).',
    impact: 'Question headings match voice and text search queries exactly. They improve topical relevance signals and make content easier for AI to map to user intent. This formatting boosts both traditional rankings and AI source selection.'
  },
  'Step-by-step language in opening': {
    definition: 'This metric identifies early signals of procedural or instructional content. It looks for language that indicates a guide or tutorial format.',
    detection: 'The tool searches opening content for keywords like “step”, “guide”, “how to”, “instructions”, “follow these”, or similar instructional phrases.',
    impact: 'AI systems prioritize extractable step-by-step content for how-to queries. Early instructional signals increase chances of rich result features. This formatting makes content highly valuable for direct answer generation.'
  },
  'Strong opening section (>600 chars)': {
    definition: 'This metric measures the depth and substance of the introductory content. It evaluates whether the opening provides meaningful value before deeper sections.',
    detection: 'The tool extracts and measures character count of main content opening after cleaning navigation/footer elements.',
    impact: 'A substantial opening gives AI engines rich, high-quality text to summarize and cite. Thin introductions reduce perceived value and citation likelihood. Strong openings improve both user engagement and AI source trustworthiness.'
  },
  'JSON-LD structured data present': {
    definition: 'This metric checks for any machine-readable structured data on the page. It rewards explicit markup that helps search engines understand content.',
    detection: 'The tool counts valid <script type="application/ld+json"> blocks regardless of specific schema type.',
    impact: 'Structured data improves content understanding and trust signals for both traditional and AI search. Even basic JSON-LD increases processing accuracy. Pages with markup are more likely to be selected as authoritative sources.'
  },
  'Article/BlogPosting schema type': {
    definition: 'This metric confirms the page is properly marked as editorial content using standard article schemas.',
    detection: 'The tool parses JSON-LD for @type values of "Article" or "BlogPosting" with required properties.',
    impact: 'Proper article schema establishes topical authority and editorial intent. It helps AI systems categorize content correctly. This markup is essential for competitive visibility in information-heavy topics.'
  },
  'FAQPage/HowTo schema type': {
    definition: 'This metric identifies content specifically structured as FAQs or step-by-step guides using appropriate schemas.',
    detection: 'The tool checks JSON-LD for @type "FAQPage" or "HowTo" with valid structure.',
    impact: 'These schemas trigger rich results and make content highly extractable for direct answers. They significantly boost visibility in procedural and question-based searches. Proper markup dramatically improves AI citation rates.'
  },
  'Person schema for author': {
    definition: 'This metric verifies structured authorship information linked to a real person entity.',
    detection: 'The tool looks for "Person" entity properly connected via the "author" property in article schema.',
    impact: 'Linked Person schema proves real human authorship and expertise. It directly supports E-E-A-T evaluation in AI systems. This markup is critical for trust in competitive topics.'
  },
  'Author byline visible': {
    definition: 'This metric checks for clear, visible attribution of authorship on the rendered page.',
    detection: 'The tool scans for common author patterns in HTML including meta tags and visible bylines.',
    impact: 'Visible authorship builds immediate trust with users and AI evaluators. It demonstrates expertise and accountability. Clear bylines significantly improve E-E-A-T perception and citation likelihood.'
  },
  'Publish/update date shown': {
    definition: 'This metric evaluates whether content freshness is clearly communicated through visible dates.',
    detection: 'The tool detects publish and update dates in common HTML locations and meta tags.',
    impact: 'Visible dates signal active maintenance and current relevance. Freshness is a key ranking factor in many topics. Clear dating improves trust and selection in time-sensitive AI results.'
  },
  'Trusted outbound links': {
    definition: 'This metric measures research depth through links to authoritative external sources.',
    detection: 'The tool finds external HTTPS links excluding social media domains.',
    impact: 'Links to trusted sites demonstrate thorough research and credibility. They boost topical authority signals. Outbound linking improves both traditional rankings and AI trust evaluation.'
  },
  'Secure HTTPS connection': {
    definition: 'This metric confirms the page is served over a secure encrypted connection.',
    detection: 'The tool simply checks if the analyzed URL uses https:// protocol.',
    impact: 'HTTPS is a fundamental security and trust requirement for modern web content. Insecure sites are deprioritized in search. Secure connections are essential for user trust and AI source selection.'
  },
  'Sufficient headings (H1-H4)': {
    definition: 'This metric assesses content structure through proper heading hierarchy usage. It ensures the page is logically organized for both users and crawlers.',
    detection: 'The tool counts total H1 through H4 elements in main content.',
    impact: 'Good heading structure improves readability and content organization. It helps both users and AI parse information quickly. Proper hierarchy enhances scannability and extraction accuracy.'
  },
  'Bullet/numbered lists used': {
    definition: 'This metric evaluates use of structured lists for presenting information. It rewards clear, scannable formatting of key points.',
    detection: 'The tool counts <ul> and <ol> elements in cleaned main content.',
    impact: 'Lists are the most AI-friendly format for extracting key facts. They improve scannability for users. Structured lists significantly increase citation likelihood in summary answers.'
  },
  'Data tables present': {
    definition: 'This metric checks for tabular data presentation using proper HTML tables. It looks for structured comparison or statistical content.',
    detection: 'The tool detects any <table> elements in main content area.',
    impact: 'Tables provide highly structured, extractable data for AI systems. They improve comprehension of comparisons and stats. Well-marked tables dramatically boost reuse in answers.'
  },
  'Short paragraphs (<35 words)': {
    definition: 'This metric measures paragraph length for optimal readability. It promotes concise, digestible writing style.',
    detection: 'The tool counts paragraphs with fewer than 35 words after cleaning.',
    impact: 'Short paragraphs improve reading speed and comprehension on all devices. They make content more scannable for both users and AI. Better readability reduces bounce rates and improves processing accuracy.'
  },
  'Excellent heading density': {
    definition: 'This metric evaluates frequency of headings for optimal content flow. It ensures regular structural breaks in long-form content.',
    detection: 'The tool checks for more than 8 total headings across the content.',
    impact: 'Regular headings guide readers through long content effectively. They help AI understand content structure and hierarchy. Optimal density improves both engagement and parsing accuracy.'
  },
  'Direct "you" address (>5)': {
    definition: 'This metric measures conversational tone through direct reader address. It rewards personal, engaging writing style.',
    detection: 'The tool counts occurrences of “you”, “your”, and “yours” in main content.',
    impact: 'Direct address creates personal connection and matches natural search language. It improves engagement and time on page. Conversational tone aligns closely with voice search patterns.'
  },
  'Personal "I/we" sharing': {
    definition: 'This metric assesses personal voice and experience sharing in content. It looks for first-person perspective indicators.',
    detection: 'The tool counts personal pronouns indicating first-person perspective.',
    impact: 'Personal voice adds authenticity and human connection. It demonstrates real experience rather than generic information. This tone significantly improves trust and E-E-A-T perception.'
  },
  'Engaging questions asked': {
    definition: 'This metric evaluates use of rhetorical questions to engage readers. It rewards content that mirrors reader curiosity.',
    detection: 'The tool counts sentences ending with question marks.',
    impact: 'Questions mirror reader thoughts and increase engagement. They improve dwell time and interaction signals. Rhetorical questions align content with natural user curiosity.'
  },
  'Reader pain points acknowledged': {
    definition: 'This metric checks for empathy through recognition of reader challenges. It looks for acknowledgment of common problems or frustrations.',
    detection: 'The tool scans for keywords indicating problems, struggles, or frustrations.',
    impact: 'Acknowledging pain points builds immediate rapport and trust. It keeps readers engaged with relevant solutions. Empathy improves conversion rates and perceived helpfulness.'
  },
  'Good Flesch score (>60)': {
    definition: 'This metric measures overall reading ease using the Flesch formula. It evaluates sentence length and word complexity.',
    detection: 'The tool calculates score based on sentence length and syllable count.',
    impact: 'Clear writing improves comprehension for all audiences including AI processing. Higher readability reduces misinterpretation in summaries. Easy-to-read content performs better across all devices and demographics.'
  },
  'Natural sentence variation': {
    definition: 'This metric evaluates rhythm through varying sentence lengths. It rewards natural, human-like flow in writing.',
    detection: 'The tool measures statistical variance in sentence word counts.',
    impact: 'Natural rhythm makes writing feel human and engaging. It avoids robotic patterns common in low-quality content. Variation improves readability and authenticity signals.'
  },
  'Low passive voice': {
    definition: 'This metric assesses preference for active over passive constructions. It promotes direct, authoritative language.',
    detection: 'The tool detects common passive voice patterns in content.',
    impact: 'Active voice is clearer, more direct, and authoritative. It improves readability and impact. Clear voice enhances both user experience and AI processing accuracy.'
  },
  'Low complex words (<15%)': {
    definition: 'This metric measures vocabulary complexity through syllable counting. It encourages accessible language.',
    detection: 'The tool calculates percentage of words with 3+ syllables.',
    impact: 'Simple language improves accessibility and comprehension. It reduces cognitive load for readers. Clear vocabulary enhances both user experience and AI summarization quality.'
  },
  'First-hand experience markers': {
    definition: 'This metric identifies language indicating personal testing or observation. It looks for authentic experience signals.',
    detection: 'The tool scans for phrases like “I tested”, “in my experience”, “we found”.',
    impact: 'First-hand markers prove real expertise and original insight. They significantly boost E-E-A-T evaluation. Personal experience differentiates content from generic sources.'
  },
  'Dated/timely results mentioned': {
    definition: 'This metric checks for references to recent testing or observations. It rewards content showing current relevance.',
    detection: 'The tool looks for time-bound phrases indicating current relevance.',
    impact: 'Timely references demonstrate freshness and real-world application. They improve trust in fast-moving topics. Current results increase perceived authority and relevance.'
  },
  'Interviews/quotes included': {
    definition: 'This metric evaluates inclusion of third-party perspectives and expert quotes. It rewards external validation.',
    detection: 'The tool detects quote patterns and interview-related language.',
    impact: 'Expert quotes add external authority and exclusive value. They improve credibility and depth perception. Third-party validation strengthens E-E-A-T signals significantly.'
  },
  'Deep content (1500+ words)': {
    definition: 'This metric measures overall content depth and comprehensiveness. It evaluates thoroughness of topic coverage.',
    detection: 'The tool counts words in cleaned main content area.',
    impact: 'In-depth content signals thorough expertise and coverage. It improves topical authority in competitive areas. Comprehensive pages are favored as primary sources by AI systems.'
  },
  'High sentence burstiness': {
    definition: 'This metric assesses dramatic variation in sentence length patterns. It looks for natural human writing rhythm.',
    detection: 'The tool evaluates statistical burstiness in sentence structure.',
    impact: 'High burstiness is a strong indicator of natural human writing. It helps avoid AI-generation flags. Dramatic variation improves authenticity and engagement.'
  },
  'Low word repetition': {
    definition: 'This metric measures vocabulary diversity and phrasing variety. It rewards sophisticated, non-repetitive writing.',
    detection: 'The tool checks if any word exceeds 10 repetitions.',
    impact: 'Varied vocabulary prevents robotic feel and improves readability. It signals sophisticated writing. Low repetition enhances both user experience and quality perception.'
  },
  'No predictable sentence starts': {
    definition: 'This metric evaluates variety in sentence opening structure. It rewards diverse, natural flow.',
    detection: 'The tool analyzes frequency of identical sentence starting words/phrases.',
    impact: 'Varied starts break predictable patterns common in generated text. They create natural flow and rhythm. This variation strengthens human authenticity signals.'
  }
};