import { forwardBackendResponse } from '@/lib/backend-api';

export async function GET() {
  return forwardBackendResponse('/api/health', { method: 'GET' });
}
