import { forwardBackendResponse } from '@/lib/backend-api';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const language = url.searchParams.get('lang') === 'kk' ? 'kk' : 'ru';
  return forwardBackendResponse(`/api/questionnaire/attempt?lang=${language}`, {
    method: 'GET',
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
    },
  });
}
