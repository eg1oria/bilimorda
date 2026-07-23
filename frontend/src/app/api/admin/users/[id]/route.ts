import { forwardAdminRequest } from '@/lib/admin-api';
import {
  isAuthorizedAdminRequest,
  unauthorizedAdminResponse,
} from '@/lib/admin-request';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedAdminResponse();
  const { id } = await params;
  return forwardAdminRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}
