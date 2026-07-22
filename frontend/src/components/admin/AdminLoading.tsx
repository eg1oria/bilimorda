export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#f4f4ef] px-4 py-6 [background-image:linear-gradient(rgba(23,32,51,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,51,0.026)_1px,transparent_1px)] [background-size:38px_38px] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1280px] animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-12 w-48 rounded-2xl bg-[#e2e3de]" />
          <div className="h-11 w-64 rounded-2xl bg-[#e2e3de]" />
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-28 rounded-[22px] bg-white" key={item} />
          ))}
        </div>
        <div className="h-[520px] rounded-[26px] bg-white" />
      </div>
      <span className="sr-only">Загружаем пользователей…</span>
    </main>
  );
}
