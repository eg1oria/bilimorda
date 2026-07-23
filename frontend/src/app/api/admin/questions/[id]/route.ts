import { forwardAdminRequest } from '@/lib/admin-api';
import {
  isAuthorizedAdminRequest,
  unauthorizedAdminResponse,
} from '@/lib/admin-request';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedAdminResponse();
  const { id } = await params;

  return forwardAdminRequest(`/api/admin/questions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: await request.text(),
  });
}
