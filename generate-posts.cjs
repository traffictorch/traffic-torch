const fs = require('fs');
const path = require('path');

const POSTS_JSON = path.join(__dirname, 'blog', 'posts', 'posts.json');
const TEMPLATE_PATH = path.join(__dirname, 'blog', 'posts', 'template.html');
const OUTPUT_DIR = path.join(__dirname, 'blog', 'posts');

// Read source files
const posts = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

posts.forEach(post => {
  const slug = post.slug;
  if (!slug) {
    console.warn('Skipping post without slug:', post.title);
    return;
  }

  // Build the HTML by replacing placeholders
  let html = template
    .replace(/{{title}}/g, post.title || 'Untitled')
    .replace(/{{slug}}/g, slug)
    .replace(/{{date}}/g, post.date || new Date().toISOString().slice(0, 10))
    .replace(/{{excerpt}}/g, post.excerpt || '')
    .replace(/{{content}}/g, post.content || '<p>Content coming soon.</p>');

  // Create folder: /blog/posts/{slug}/
  const postDir = path.join(OUTPUT_DIR, slug);
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }

  // Write index.html
  const outputFile = path.join(postDir, 'index.html');
  fs.writeFileSync(outputFile, html, 'utf8');
  console.log(`✅ Generated /blog/posts/${slug}/index.html`);
});

console.log('🎉 All posts generated successfully.');