import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import type { AdminUsersResponse } from './admin-types';

function requiredEnvironmentValue(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function isAdminRouteToken(received: string) {
  const expected = requiredEnvironmentValue('ADMIN_ROUTE_TOKEN');
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function getAdminUsers(): Promise<AdminUsersResponse> {
  const backendUrl = requiredEnvironmentValue('BACKEND_INTERNAL_URL').replace(/\/$/, '');
  const apiKey = requiredEnvironmentValue('ADMIN_API_KEY');
  const response = await fetch(`${backendUrl}/api/admin/users`, {
    headers: { 'x-admin-api-key': apiKey },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Admin API returned ${response.status}`);
  }

  return (await response.json()) as AdminUsersResponse;
}
