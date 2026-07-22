import type { Metadata } from 'next';
import { manrope } from '@/lib/font';
import '../globals.css';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru-KZ" className={manrope.variable}>
      <body className="m-0 min-w-80 bg-[#f4f4ef] text-[#172033] [font-family:var(--font-manrope),Arial,sans-serif]">
        {children}
      </body>
    </html>
  );
}
