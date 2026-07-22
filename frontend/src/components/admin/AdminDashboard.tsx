'use client';

import { useRouter } from 'next/navigation';
import {
  Download,
  GraduationCap,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import type { AdminUser } from '@/lib/admin-types';

type AdminDashboardProps = {
  items: AdminUser[];
  total: number;
  generatedAt: string;
};

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value)).replace(' г.', '');
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function csvCell(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function downloadUsers(items: AdminUser[]) {
  const rows = [
    ['ID', 'ФИО', 'Школа', 'Класс', 'Телефон', 'Создан', 'Обновлён'],
    ...items.map((user) => [
      user.id,
      user.fullName,
      user.school,
      user.grade,
      formatPhone(user.phone),
      formatDate(user.createdAt),
      formatDate(user.updatedAt),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `bilimorda-users-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function GradeBadge({ grade }: { grade: AdminUser['grade'] }) {
  return (
    <span className="inline-flex min-w-20 items-center justify-center rounded-full bg-[#e5f8f3] px-3 py-1.5 text-xs font-[750] text-[#225f53]">
      {grade} класс
    </span>
  );
}

export default function AdminDashboard({ items, total, generatedAt }: AdminDashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isRefreshing, startRefresh] = useTransition();
  const grade10 = items.filter((user) => user.grade === '10').length;
  const grade11 = items.filter((user) => user.grade === '11').length;
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ru-RU');
    const phoneQuery = query.replace(/\D/g, '');
    if (!normalized) return items;

    return items.filter((user) => {
      const text = `${user.fullName} ${user.school} ${user.phone}`.toLocaleLowerCase('ru-RU');
      return text.includes(normalized) || (phoneQuery && user.phone.includes(phoneQuery));
    });
  }, [items, query]);

  function refresh() {
    startRefresh(() => router.refresh());
  }

  return (
    <main className="min-h-screen bg-[#f4f4ef] px-4 py-5 [background-image:linear-gradient(rgba(23,32,51,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,51,0.026)_1px,transparent_1px)] [background-size:38px_38px] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-7 flex flex-col gap-5 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <h1 className="m-0 text-[26px] leading-tight font-[800] tracking-[-0.045em] text-[#172033] sm:text-[30px]">
              Пользователи
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="mr-auto text-[11px] leading-4 text-[#858b94] lg:mr-2 lg:text-right">
              Последнее обновление
              <br />
              <span className="font-bold text-[#555d69]">{formatDate(generatedAt)}</span>
            </div>
            <button
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[13px] border border-[#d7d9d5] bg-white px-4 text-xs font-bold text-[#303949] shadow-sm transition-[border-color,transform] hover:-translate-y-px hover:border-[#aeb3ad] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(23,32,51,0.14)] disabled:cursor-wait disabled:opacity-60"
              type="button"
              onClick={refresh}
              disabled={isRefreshing}>
              <RefreshCw
                className={isRefreshing ? 'animate-spin' : ''}
                size={16}
                aria-hidden="true"
              />
              {isRefreshing ? 'Обновляем…' : 'Обновить'}
            </button>
            <button
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[13px] border-0 bg-[#172033] px-4 text-xs font-bold text-white shadow-[0_4px_0_#9ce6d5] transition-[background,transform,box-shadow] hover:-translate-y-px hover:bg-[#26324a] hover:shadow-[0_5px_0_#9ce6d5] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(23,32,51,0.18)] active:translate-y-0.5 active:shadow-[0_2px_0_#9ce6d5] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => downloadUsers(items)}
              disabled={items.length === 0}>
              <Download size={16} aria-hidden="true" />
              Скачать CSV
            </button>
          </div>
        </header>

        <section className="mb-4 grid gap-3 sm:grid-cols-3" aria-label="Сводка">
          {[
            {
              label: 'Всего пользователей',
              value: total,
              icon: UsersRound,
              color: 'bg-[#172033] text-white',
            },
            {
              label: '10 класс',
              value: grade10,
              icon: GraduationCap,
              color: 'bg-[#9ce6d5] text-[#172033]',
            },
            {
              label: '11 класс',
              value: grade11,
              icon: GraduationCap,
              color: 'bg-[#e8ddff] text-[#382b57]',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <article
              className="flex items-center justify-between rounded-[21px] border border-[rgba(23,32,51,0.09)] bg-white p-4 shadow-[0_10px_30px_rgba(32,41,59,0.05)] sm:p-5"
              key={label}>
              <div>
                <p className="m-0 text-[11px] font-bold text-[#838991]">{label}</p>
                <p className="mt-1 mb-0 text-[28px] leading-none font-[800] tracking-[-0.04em] text-[#172033]">
                  {value}
                </p>
              </div>
              <span className={`flex size-11 items-center justify-center rounded-[14px] ${color}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-[25px] border border-[rgba(23,32,51,0.1)] bg-white shadow-[0_22px_60px_rgba(32,41,59,0.08)]">
          <div className="flex flex-col gap-3 border-b border-[#e8e9e5] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <label className="relative block w-full sm:max-w-md">
              <span className="sr-only">Поиск пользователей</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#9298a0]"
                size={17}
                aria-hidden="true"
              />
              <input
                className="h-11 w-full rounded-[13px] border border-[#dfe1dd] bg-[#f8f8f5] pr-4 pl-11 text-sm font-medium text-[#172033] outline-none transition-[border-color,box-shadow,background] placeholder:text-[#9a9fa7] focus:border-[#172033] focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,32,51,0.07)]"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ФИО, школа или телефон"
              />
            </label>
            <p className="m-0 text-xs font-semibold text-[#7d838c]" aria-live="polite">
              Показано {filteredItems.length} из {total}
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#eff0ec] text-[#858c94]">
                {items.length === 0 ? <UsersRound size={24} /> : <Search size={23} />}
              </span>
              <h2 className="m-0 text-lg font-[780] tracking-[-0.025em] text-[#172033]">
                {items.length === 0 ? 'Регистраций пока нет' : 'Ничего не найдено'}
              </h2>
              <p className="mt-2 mb-0 max-w-sm text-xs leading-5 text-[#858b94]">
                {items.length === 0
                  ? 'После первой успешной отправки формы пользователь появится здесь.'
                  : 'Попробуйте изменить имя, школу или номер телефона в поиске.'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto min-[861px]:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#fafaf7] text-[10px] font-[800] tracking-[0.07em] text-[#858b94] uppercase">
                      <th className="px-5 py-3.5">Пользователь</th>
                      <th className="px-5 py-3.5">Школа</th>
                      <th className="px-5 py-3.5">Класс</th>
                      <th className="px-5 py-3.5">Телефон</th>
                      <th className="px-5 py-3.5">Регистрация</th>
                      <th className="px-5 py-3.5">Обновление</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((user) => (
                      <tr
                        className="border-t border-[#ecece8] transition-colors hover:bg-[#fbfbf8]"
                        key={user.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#172033] text-white">
                              <UserRound size={16} aria-hidden="true" />
                            </span>
                            <span className="max-w-56 text-sm font-[750] text-[#20293a]">
                              {user.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-64 px-5 py-4 text-xs leading-5 font-semibold text-[#606874]">
                          {user.school}
                        </td>
                        <td className="px-5 py-4">
                          <GradeBadge grade={user.grade} />
                        </td>
                        <td className="px-5 py-4">
                          <a
                            className="whitespace-nowrap text-xs font-bold text-[#273345] underline decoration-[#9ce6d5] decoration-2 underline-offset-4 hover:text-[#4d3ca2]"
                            href={`tel:${user.phone}`}>
                            {formatPhone(user.phone)}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[11px] font-semibold text-[#737a84]">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[11px] font-semibold text-[#737a84]">
                          {formatDate(user.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#e9eae6] min-[861px]:hidden">
                {filteredItems.map((user) => (
                  <article className="p-4 sm:p-5" key={user.id}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#172033] text-white">
                          <UserRound size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="m-0 text-sm leading-5 font-[780] text-[#20293a]">
                            {user.fullName}
                          </h2>
                          <p className="mt-0.5 mb-0 text-xs leading-5 font-medium text-[#737a84]">
                            {user.school}
                          </p>
                        </div>
                      </div>
                      <GradeBadge grade={user.grade} />
                    </div>
                    <div className="grid gap-3 rounded-[15px] bg-[#f8f8f5] p-3.5 sm:grid-cols-3">
                      <div>
                        <span className="mb-1 block text-[9px] font-[800] tracking-[0.06em] text-[#959aa1] uppercase">
                          Телефон
                        </span>
                        <a
                          className="flex items-center gap-1.5 text-xs font-bold text-[#273345]"
                          href={`tel:${user.phone}`}>
                          <Phone size={13} aria-hidden="true" /> {formatPhone(user.phone)}
                        </a>
                      </div>
                      <div>
                        <span className="mb-1 block text-[9px] font-[800] tracking-[0.06em] text-[#959aa1] uppercase">
                          Регистрация
                        </span>
                        <span className="text-[11px] font-semibold text-[#5e6671]">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="mb-1 block text-[9px] font-[800] tracking-[0.06em] text-[#959aa1] uppercase">
                          Обновление
                        </span>
                        <span className="text-[11px] font-semibold text-[#5e6671]">
                          {formatDate(user.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="py-5 text-center text-[10px] leading-4 text-[#969ba3]">
          Персональные данные. Не передавайте ссылку на эту страницу третьим лицам.
        </footer>
      </div>
    </main>
  );
}
