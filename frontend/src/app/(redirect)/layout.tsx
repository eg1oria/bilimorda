export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru-KZ">
      <body>{children}</body>
    </html>
  );
}
