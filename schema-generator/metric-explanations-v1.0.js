const coreSchemas = [
  {
    id: 'organization',
    emoji: '🏢',
    name: 'Organization',
    what: 'Organization schema defines your company or brand as a formal entity with name, logo, URL, social profiles (sameAs), and contact info. It establishes your business identity for search engines.',
    when: 'Use on homepage, About page, or footer — especially for brands, multi-location businesses, or any site wanting Knowledge Graph recognition.',
    why: 'Builds brand authority, enables logo/sitelinks in SERPs, strengthens E-E-A-T, and serves as foundation for LocalBusiness and other entity-linked schemas.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#organization'
  },
  {
    id: 'article',
    emoji: '✍️',
    name: 'Article / BlogPosting',
    what: 'Article or BlogPosting schema marks up news articles, blog posts, or long-form content with headline, date, author, image, publisher, and mainEntityOfPage.',
    when: 'Apply to every individual blog post, news article, guide, or dated editorial content — prefer BlogPosting subtype for most blogs.',
    why: 'Unlocks rich article thumbnails, author bylines, date display, and carousel eligibility; boosts E-E-A-T and CTR for informational content.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#article'
  },
  {
    id: 'localbusiness',
    emoji: '📍',
    name: 'LocalBusiness',
    what: 'LocalBusiness schema describes physical or service-area businesses with address, geo coordinates, opening hours, phone, price range, and area served.',
    when: 'Use on homepage, contact/location pages, or branch pages — ideal for stores, restaurants, service pros with local intent.',
    why: 'Powers rich local results (map pin, hours, directions), boosts Google Maps/local pack visibility, and is a top local SEO signal.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#localbusiness'
  },
  {
    id: 'person',
    emoji: '👤',
    name: 'Person',
    what: 'Person schema identifies individual authors, experts, or team members with name, jobTitle, image, sameAs social links, and worksFor Organization.',
    when: 'Apply in author bylines of articles, About pages, team bios, or contributor profiles — especially multi-author blogs.',
    why: 'Enables author knowledge panels, richer bylines, stronger E-E-A-T signals, and builds individual topical authority over time.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#person'
  },
  {
    id: 'breadcrumblist',
    emoji: '🔗',
    name: 'BreadcrumbList',
    what: 'BreadcrumbList schema represents site navigation hierarchy (Home → Category → Post) with ordered ListItem entries (position, name, item URL).',
    when: 'Use on any page deeper than homepage — blog posts, categories, products, docs — wherever visible breadcrumbs exist.',
    why: 'Replaces plain URL path in SERPs with clickable breadcrumbs, improves CTR, helps Google understand site structure, and boosts internal linking signals.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#breadcrumbList'
  }
];

const contentEngagementSchemas = [
  {
    id: 'faqpage',
    emoji: '❓',
    name: 'FAQPage',
    what: 'FAQPage schema marks up question-and-answer lists with Question name and acceptedAnswer text — ideal for support, product Q&A, or informational FAQs.',
    when: 'Use on dedicated FAQ pages, help articles, or product pages with expanded Q&A sections (3–8 high-quality pairs recommended).',
    why: 'Triggers expandable FAQ accordions in SERPs, captures zero-click traffic, improves voice search answers, and boosts CTR for question-based queries.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#faqpage'
  },
  {
    id: 'howto',
    emoji: '🔧',
    name: 'HowTo',
    what: 'HowTo schema outlines step-by-step instructions with name, description, supply/tool lists, estimated times, and ordered HowToStep blocks (with images).',
    when: 'Apply to tutorials, DIY guides, repair instructions, setup processes, or any page whose primary purpose is teaching a task.',
    why: 'Unlocks step-by-step carousels or expanded steps in SERPs, dominates how-to searches, increases dwell time, and provides instant value.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#howto'
  },
  {
    id: 'videoobject',
    emoji: '🎥',
    name: 'VideoObject',
    what: 'VideoObject schema describes embedded or hosted videos with name, thumbnailUrl, duration, uploadDate, contentUrl/embedUrl, and optional transcript/Clip objects.',
    when: 'Use on pages where video is central — tutorials, product demos, interviews, recipes, or explainer content (nest inside HowTo/Article if applicable).',
    why: 'Triggers video thumbnails, play icons, key moments, and carousel placements; boosts visibility in video tab, Discover, and voice search.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#videoobject'
  },
  {
    id: 'recipe',
    emoji: '🍳',
    name: 'Recipe',
    what: 'Recipe schema details food/drink recipes with ingredients, instructions, prep/cook times, servings, nutrition, images, and optional AggregateRating.',
    when: 'Apply to full recipe posts or pages with complete ingredient lists, step-by-step directions, and high-quality photos of the dish.',
    why: 'Powers rich recipe cards with stars, cook time, calories, and step carousels; dominates food-related searches and increases visual CTR.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#recipe'
  },
  {
    id: 'event',
    emoji: '🎟️',
    name: 'Event',
    what: 'Event schema marks up real-world or virtual events with name, start/end dates, location (or VirtualLocation), performer, organizer, offers, and attendance mode.',
    when: 'Use on event landing pages, ticket pages, or announcements for conferences, concerts, workshops, webinars, or local meetups.',
    why: 'Triggers event cards with date/time/location/tickets in SERPs and Maps; boosts visibility for "events near me" and time-sensitive queries.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#event'
  },
  {
    id: 'review-aggregaterating',
    emoji: '⭐',
    name: 'Review / AggregateRating',
    what: 'Review and AggregateRating schemas show individual reviews and average star ratings/count for products, businesses, recipes, events, etc.',
    when: 'Apply wherever visible ratings/reviews appear — product pages, local listings, recipes, events — with at least 3–5 genuine reviews.',
    why: 'Displays stars and review count in SERPs, boosts trust/CTR, strengthens E-E-A-T, and improves local/product visibility dramatically.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#review-aggregaterating'
  }
];

const advancedSchemas = [
  {
    id: 'jobposting',
    emoji: '💼',
    name: 'JobPosting',
    what: 'JobPosting schema describes open positions with title, description, hiringOrganization, jobLocation, salary, employmentType, datePosted, and apply link.',
    when: 'Use on individual job detail pages on career sites, company sites, or job boards — especially for roles with clear salary/location info.',
    why: 'Powers Google for Jobs carousel, rich job cards, and "jobs near me" results; significantly increases application rates and visibility.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#jobposting'
  },
  {
    id: 'course',
    emoji: '📚',
    name: 'Course',
    what: 'Course schema outlines educational programs with name, provider, description, offers, hasCourseInstance (mode, workload), instructor, and ratings.',
    when: 'Apply to online course landing pages, university programs, bootcamps, certifications, or training workshops with enrollment info.',
    why: 'Triggers course cards/carousels in SERPs with provider, price, duration; boosts visibility for "best online [skill] course" searches.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#course'
  },
  {
    id: 'softwareapplication',
    emoji: '🖥️',
    name: 'SoftwareApplication',
    what: 'SoftwareApplication schema describes apps/software with name, description, operatingSystem, applicationCategory, offers, screenshots, and download URLs.',
    when: 'Use on SaaS landing pages, mobile/desktop app pages, browser extensions, or tool download sites with screenshots and pricing.',
    why: 'Powers app rich results with icons, screenshots, ratings, price; increases installs/clicks in software comparison and tool searches.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#softwareapplication'
  },
  {
    id: 'book',
    emoji: '📖',
    name: 'Book',
    what: 'Book schema details published books with title, author, ISBN, publisher, datePublished, bookFormat, numberOfPages, offers, and cover image.',
    when: 'Apply to author sites, publisher pages, book review posts, or dedicated book landing pages with buy links and ISBN.',
    why: 'Triggers book cards with cover, author, price, buy links; improves discoverability in Google Books and title/author searches.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#book'
  },
  {
    id: 'dataset',
    emoji: '📊',
    name: 'Dataset',
    what: 'Dataset schema describes downloadable public datasets with name, description, creator, license, distribution (download URL + format), and coverage info.',
    when: 'Use on open data portals, research papers, ML dataset pages, or government/company data releases with direct download links.',
    why: 'Powers inclusion in Google Dataset Search and rich snippets; drives downloads/citations for research, AI, and data journalism queries.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#dataset'
  },
  {
    id: 'speakable',
    emoji: '🗣️',
    name: 'Speakable',
    what: 'Speakable schema marks up text sections ideal for voice readout using cssSelector or xpath — enhances content for Google Assistant/smart speakers.',
    when: 'Apply to news articles, FAQs, how-to intros, or recipe overviews with concise, natural-language text (30–90 seconds spoken).',
    why: 'Enables voice read-aloud in Assistant and voice search results; improves accessibility and reach on voice devices.',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#speakable'
  },
  {
    id: 'factcheck',
    emoji: '✅',
    name: 'FactCheck (ClaimReview)',
    what: 'FactCheck / ClaimReview schema evaluates a specific claim’s accuracy with claimReviewed text, reviewRating, author (fact-check org), and sources.',
    when: 'Use only on formal fact-check articles by verified organizations following IFCN standards — not for opinions or personal blogs.',
    why: 'Triggers "Fact Check" labels/verdict boxes in SERPs; boosts credibility and visibility during misinformation events (strictly moderated by Google).',
    learnMore: 'https://traffictorch.net/blog/posts/schema-markup-help-guide/#factcheck'
  }
];


function injectSchemaCards() {
  const container = document.getElementById('metric-cards-container');
  if (!container) {
    return;
  }
  container.innerHTML = '';
  
  const renderGroup = (title, schemas) => {
    if (!schemas || schemas.length === 0) return '';
    let html = `
      <h2 class="text-3xl md:text-4xl font-black text-center mt-16 mb-10 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
        ${title}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    `;
    schemas.forEach(m => {
      html += `
        <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
          <div class="p-8 text-center flex-grow">
            <div class="text-7xl md:text-8xl mb-6">${m.emoji}</div>
            <h3 class="text-2xl md:text-3xl font-extrabold text-orange-600 dark:text-orange-400 mb-6">${m.name}</h3>
            <details class="group mt-4">
              <summary class="cursor-pointer text-lg font-semibold text-orange-700 dark:text-orange-300 hover:text-orange-500 dark:hover:text-orange-200 transition flex items-center justify-center gap-3">
                Learn More
                <span class="text-2xl group-open:rotate-180 transition-transform duration-300">↓</span>
              </summary>
              <div class="mt-6 space-y-6 text-left text-gray-700 dark:text-gray-300 leading-relaxed px-2">
                <div>
                  <p class="font-bold text-orange-600 dark:text-orange-400 mb-2">What is it?</p>
                  <p class="text-base">${m.what} <a href="${m.learnMore}" target="_blank" rel="noopener" class="text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1">Learn more →</a></p>
                </div>
                <div>
                  <p class="font-bold text-orange-600 dark:text-orange-400 mb-2">When to use?</p>
                  <p class="text-base">${m.when} <a href="${m.learnMore}" target="_blank" rel="noopener" class="text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1">Learn more →</a></p>
                </div>
                <div>
                  <p class="font-bold text-orange-600 dark:text-orange-400 mb-2">Why it matters</p>
                  <p class="text-base">${m.why} <a href="${m.learnMore}" target="_blank" rel="noopener" class="text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1">Learn more →</a></p>
                </div>
              </div>
            </details>
          </div>
        </div>`;
    });
    html += '</div>';
    return html;
  };

  container.innerHTML = `
    ${renderGroup('Core & Foundational Schemas', coreSchemas)}
    ${renderGroup('Content & Engagement Schemas', contentEngagementSchemas)}
    ${renderGroup('Advanced & Specialized Schemas', advancedSchemas)}
  `;
  
}

// Run automatically (works with type=module + defer)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSchemaCards);
} else {
  injectSchemaCards();
}