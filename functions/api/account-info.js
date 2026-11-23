export async function onRequest(context) {
  const { request } = context;
  const target = new URL('https://traffic-torch-auth.traffictorch.workers.dev/api/account-info');
  const headers = new Headers(request.headers);
  headers.set('host', target.host);
  return fetch(target, { method: request.method, headers });
}
