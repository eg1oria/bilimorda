import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLoading from '@/components/admin/AdminLoading';
import { getAdminUsers, isAdminRouteToken } from '@/lib/admin-api';

export const metadata: Metadata = {
  title: 'Пользователи — Bilim Orda',
  description: 'Внутренняя панель зарегистрированных пользователей.',
};

async function AdminContent() {
  await connection();
  const data = await getAdminUsers();

  return (
    <AdminDashboard
      items={data.items}
      total={data.total}
      generatedAt={data.generatedAt}
    />
  );
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isAdminRouteToken(token)) notFound();

  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminContent />
    </Suspense>
  );
}
