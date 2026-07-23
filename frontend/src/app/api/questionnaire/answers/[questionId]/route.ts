import { forwardBackendResponse } from '@/lib/backend-api';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await params;
  return forwardBackendResponse(
    `/api/questionnaire/answers/${encodeURIComponent(questionId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: request.headers.get('authorization') ?? '',
        'Content-Type': 'application/json',
      },
      body: await request.text(),
    },
  );
}
