import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import QuestionsDashboard from '@/components/admin/QuestionsDashboard';
import { getAdminQuestions, isAdminRouteToken } from '@/lib/admin-api';

export const metadata: Metadata = {
  title: 'Вопросы — Bilim Orda',
  description: 'Управление вопросами и публикациями теста.',
};

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  if (!isAdminRouteToken(token)) notFound();
  const data = await getAdminQuestions();

  return <QuestionsDashboard initialData={data} routeToken={token} />;
}
