const unavailableResponse = {
  message: 'Сервис регистрации временно недоступен. Попробуйте ещё раз.',
};
const maxRequestSize = 8 * 1024;
const noStoreHeaders = { 'Cache-Control': 'no-store' };

class PayloadTooLargeError extends Error {}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, { status, headers: noStoreHeaders });
}

async function readRequestBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder('utf-8', { fatal: true });
  let body = '';
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.byteLength;
    if (receivedBytes > maxRequestSize) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }

    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

function getBackendUrl() {
  const value = process.env.BACKEND_INTERNAL_URL;
  if (!value) throw new Error('BACKEND_INTERNAL_URL is not configured');

  return value.replace(/\/$/, '');
}

export async function POST(request: Request) {
  let payload: unknown;

  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return jsonResponse({ message: 'Ожидается формат application/json.' }, 415);
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxRequestSize) {
    return jsonResponse({ message: 'Слишком большой объём данных.' }, 413);
  }

  try {
    payload = JSON.parse(await readRequestBody(request)) as unknown;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonResponse({ message: 'Слишком большой объём данных.' }, 413);
    }

    return jsonResponse({ message: 'Некорректный формат данных.' }, 400);
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/users/registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    console.error('Registration proxy failed', error);
    return jsonResponse(unavailableResponse, 503);
  }
}
