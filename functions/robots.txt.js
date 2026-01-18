export const onRequest = async () => {
  return new Response(`User-agent: *
Allow: /

Sitemap: https://traffictorch.net/sitemap.xml`, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};