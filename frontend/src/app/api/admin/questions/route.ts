import { forwardAdminRequest } from '@/lib/admin-api';
import {
  isAuthorizedAdminRequest,
  unauthorizedAdminResponse,
} from '@/lib/admin-request';

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedAdminResponse();
  return forwardAdminRequest('/api/admin/questions', { method: 'GET' });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedAdminResponse();
  return forwardAdminRequest('/api/admin/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await request.text(),
  });
}
