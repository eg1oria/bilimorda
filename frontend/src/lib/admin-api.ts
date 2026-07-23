import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { forwardBackendResponse } from './backend-api';
import type { AdminQuestionsResponse, AdminUsersResponse } from './admin-types';

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
  return adminFetch<AdminUsersResponse>('/api/admin/users');
}

export async function getAdminQuestions(): Promise<AdminQuestionsResponse> {
  return adminFetch<AdminQuestionsResponse>('/api/admin/questions');
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const backendUrl = requiredEnvironmentValue('BACKEND_INTERNAL_URL').replace(/\/$/, '');
  const apiKey = requiredEnvironmentValue('ADMIN_API_KEY');
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      'x-admin-api-key': apiKey,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Admin API returned ${response.status}`);
  }

  return (await response.json()) as T;
}

export function forwardAdminRequest(path: string, init: RequestInit) {
  return forwardBackendResponse(path, {
    ...init,
    headers: {
      'x-admin-api-key': requiredEnvironmentValue('ADMIN_API_KEY'),
      ...init.headers,
    },
  });
}
