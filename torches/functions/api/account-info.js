export async function onRequest(context) {
  const { request, env } = context;
  const authWorker = 'https://traffic-torch-auth.traffictorch.workers.dev';
  const url = new URL(request.url);
  const target = new URL(authWorker + '/api/account-info');
  // Forward the auth header
  const headers = new Headers(request.headers);
  headers.set('host', new URL(authWorker).host);
  return fetch(target, {
    method: request.method,
    headers,
    body: request.body,
  });
}
