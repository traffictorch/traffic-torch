// local-seo-tool/fixes.js
export const moduleFixes = {
  'NAP & Contact': {
    'NAP Present': {
      issue: 'Missing or incomplete NAP (Name, Address, Phone)',
      how: 'Add a clearly visible contact section with full business name, physical street address (including city, state, postcode), and clickable phone number. Use schema markup if possible.',
      priority: 'high'
    },
    'Footer NAP': {
      issue: 'No NAP signals in footer',
      how: 'Include consistent NAP in the footer — this is one of the strongest trust & local ranking signals Google uses.',
      priority: 'medium'
    },
    'Contact Complete': {
      issue: 'Missing opening hours or incomplete contact info',
      how: 'Add business hours (preferably with schema) using <time> tags or clear text format. Example: Mon–Fri: 9am–5pm.',
      priority: 'medium'
    }
  },
  'Local Keywords & Titles': {
    'Title Local': {
      issue: 'Page title lacks local intent',
      how: 'Update title to include city + primary keyword. Best practice: "Service | City | Business Name" (keep under 60 chars).',
      priority: 'high'
    },
    'Meta Local': {
      issue: 'Meta description missing local signals',
      how: 'Rewrite meta description to mention city/location naturally. Include a call-to-action. Max 160 chars.',
      priority: 'medium'
    },
    'Headings Local': {
      issue: 'No local keywords in H1/H2 headings',
      how: 'Add or modify headings to include city name or phrases like "in [City]", "local [service] in [City]".',
      priority: 'medium'
    }
  },
  'Local Content & Relevance': {
    'Body Keywords': {
      issue: 'Page content lacks local intent keywords',
      how: 'Naturally weave in phrases like "in [City]", "[service] near me", "local [service] [City]" at least 2–3 times.',
      priority: 'high'
    },
    'Intent Patterns': {
      issue: 'Too few local search intent patterns detected',
      how: 'Expand content with sections like "Areas we serve in [City]", "Why choose us in [City]?", customer stories.',
      priority: 'medium'
    },
    'Location Mentions': {
      issue: 'City/location mentioned too few times',
      how: 'Mention the city at least 3–5 times naturally (intro, headings, content, CTA). Avoid stuffing.',
      priority: 'medium'
    }
  },
  'Maps & Visuals': {
    'Map Embedded': {
      issue: 'No Google Map embedded',
      how: 'Embed a Google Map iframe centered on your business location using official embed code.',
      priority: 'high'
    },
    'Local Alt Text': {
      issue: 'No images with local-relevant alt text',
      how: 'Add alt text to at least one image including location, e.g. "Our team providing plumbing services in Sydney CBD".',
      priority: 'medium'
    }
  },
  'Structured Data': {
    'Local Schema': {
      issue: 'No LocalBusiness schema found',
      how: 'Add JSON-LD LocalBusiness schema in <head>. Include name, address, telephone, geo, openingHours, url.',
      priority: 'very-high'
    },
    'Geo Coords': {
      issue: 'Schema missing latitude/longitude',
      how: 'Add accurate geo coordinates to LocalBusiness schema (get exact lat/lng from Google Maps).',
      priority: 'high'
    },
    'Opening Hours': {
      issue: 'No opening hours in schema',
      how: 'Implement openingHoursSpecification array with dayOfWeek and opens/closes times.',
      priority: 'high'
    }
  },
  'Reviews & Structure': {
    'Review Schema': {
      issue: 'No aggregateRating in schema',
      how: 'Add AggregateRating to LocalBusiness schema using real data from Google Business Profile.',
      priority: 'medium-high'
    },
    'Canonical Tag': {
      issue: 'Missing or incorrect canonical tag',
      how: 'Add <link rel="canonical" href="[current full URL]"> to <head>.',
      priority: 'medium'
    },
    'Internal Geo Links': {
      issue: 'No internal links with local/geo intent',
      how: 'Add internal links to contact/location pages with anchor text containing city names.',
      priority: 'medium'
    }
  }
};