const SITE = 'https://traffictorch.net';

export function profileJsonLd(profile, username) {
  const display = profile.display_name || username;
  const url = `${SITE}/torcher/${username}/`;
  const sameAs = [profile.website_url, profile.social1_url, profile.social2_url].filter(Boolean);

  const person = {
    '@type': 'Person',
    name: display,
    alternateName: `@${username}`,
    url,
    image: `${SITE}/images/avatars/${profile.avatar_preset || 'owner'}.svg`,
  };
  if (profile.bio) person.description = profile.bio;
  if (profile.job_title) person.jobTitle = profile.job_title;
  if (profile.company) person.worksFor = { '@type': 'Organization', name: profile.company };
  if (profile.location) person.address = profile.location;
  if (sameAs.length) person.sameAs = sameAs;

  const graph = [
    {
      '@type': 'ProfilePage',
      '@id': url,
      url,
      name: `${display} (@${username}) · Traffic Torch`,
      isPartOf: { '@type': 'WebSite', url: SITE },
      mainEntity: person,
      primaryImageOfPage: { '@type': 'ImageObject', url: person.image },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Community', item: SITE + '/community/' },
        { '@type': 'ListItem', position: 3, name: `@${username}`, item: url },
      ],
    },
  ];

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function jsonLdScript(obj) {
  // escape closing script tag inside strings
  const json = JSON.stringify(obj).replace(/<\/script/gi, '<\\/script');
  return `<script type="application/ld+json">${json}</script>`;
}

export function torchJsonLd(post, author, id) {
  const url = `${SITE}/torch/${id}/`;
  const domain = post.domain_mode === 'hidden'
    ? (post.domain_label || 'Hidden site')
    : (post.url ? new URL(post.url).hostname.replace(/^www\./, '') : 'Unknown');

  const graph = [
    {
      '@type': 'Review',
      '@id': url,
      url,
      name: (post.page_title && post.page_title.trim()) || domain,
      reviewBody: post.note || `Scored ${post.score}/100 on the ${post.tool} audit.`,
      datePublished: new Date(post.created_at).toISOString(),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: post.score,
        bestRating: 100,
        worstRating: 0,
      },
      author: {
        '@type': 'Person',
        name: author.display_name || author.username,
        url: `${SITE}/torcher/${author.username}/`,
      },
      itemReviewed: {
        '@type': 'WebSite',
        name: domain,
        url: post.url || undefined,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Community', item: SITE + '/community/' },
        { '@type': 'ListItem', position: 3, name: `@${author.username}`, item: `${SITE}/torcher/${author.username}/` },
        { '@type': 'ListItem', position: 4, name: `Torch #${id}`, item: url },
      ],
    },
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function communityJsonLd(posts, tool) {
  const url = `${SITE}/community/`;
  const items = (posts || []).slice(0, 20).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE}/torch/${p.id}/`,
    name: (p.page_title && p.page_title.trim()) || `Torch #${p.id}`,
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name: tool ? `${tool} Torches` : 'Community Torches',
        isPartOf: { '@type': 'WebSite', url: SITE },
        mainEntity: { '@type': 'ItemList', itemListElement: items },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Community', item: url },
        ],
      },
    ],
  };
}
