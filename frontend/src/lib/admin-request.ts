import 'server-only';
import { isAdminRouteToken } from './admin-api';

export function isAuthorizedAdminRequest(request: Request) {
  const token = request.headers.get('x-admin-route-token') ?? '';
  return isAdminRouteToken(token);
}

export function unauthorizedAdminResponse() {
  return Response.json(
    { message: 'Недостаточно прав.' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  );
}
