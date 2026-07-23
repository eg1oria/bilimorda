import Link from 'next/link';
import { FileQuestion, UsersRound } from 'lucide-react';

export default function AdminNav({
  token,
  active,
}: {
  token: string;
  active: 'users' | 'questions';
}) {
  const items = [
    { key: 'users', label: 'Пользователи', href: `/manage/${token}`, icon: UsersRound },
    {
      key: 'questions',
      label: 'Вопросы',
      href: `/manage/${token}/questions`,
      icon: FileQuestion,
    },
  ] as const;

  return (
    <nav className="flex rounded-[14px] border border-[#dfe1dd] bg-white p-1 shadow-sm">
      {items.map(({ key, label, href, icon: Icon }) => (
        <Link
          className={`flex h-9 items-center gap-2 rounded-[10px] px-3 text-xs font-bold transition-colors ${
            active === key
              ? 'bg-[#172033] text-white'
              : 'text-[#68707c] hover:bg-[#f4f4ef] hover:text-[#172033]'
          }`}
          href={href}
          key={key}
          aria-current={active === key ? 'page' : undefined}>
          <Icon size={15} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
