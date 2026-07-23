import 'server-only';

export function getBackendUrl() {
  const value = process.env.BACKEND_INTERNAL_URL;
  if (!value) throw new Error('BACKEND_INTERNAL_URL is not configured');
  return value.replace(/\/$/, '');
}

export async function forwardBackendResponse(
  path: string,
  init: RequestInit,
) {
  try {
    const response = await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Backend proxy failed', error);
    return Response.json(
      { message: 'Сервис временно недоступен. Попробуйте ещё раз.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
