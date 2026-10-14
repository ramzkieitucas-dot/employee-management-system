export default function Loading() {
  return (
    <section className="animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-200" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-slate-200" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="h-96 rounded-xl bg-slate-200 xl:col-span-2" />
        <div className="h-96 rounded-xl bg-slate-200" />
      </div>
    </section>
  );
}
