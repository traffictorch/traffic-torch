export async function onRequest() {
  return new Response("Hello from Cloudflare Pages Functions!", { status: 200 });
}