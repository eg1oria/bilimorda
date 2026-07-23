import { forwardAdminRequest } from '@/lib/admin-api';
import {
  isAuthorizedAdminRequest,
  unauthorizedAdminResponse,
} from '@/lib/admin-request';

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedAdminResponse();
  return forwardAdminRequest('/api/admin/questions/actions/publish', {
    method: 'POST',
  });
}
