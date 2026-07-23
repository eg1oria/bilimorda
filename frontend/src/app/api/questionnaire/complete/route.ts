import { forwardBackendResponse } from '@/lib/backend-api';

export async function POST(request: Request) {
  return forwardBackendResponse('/api/questionnaire/complete', {
    method: 'POST',
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
    },
  });
}
