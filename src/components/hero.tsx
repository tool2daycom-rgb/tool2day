import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div
        aria-hidden
        className="animate-pan pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(239,91,60,0.28),transparent_68%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(11,92,99,0.28),transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-6xl items-end gap-10 px-5 pb-14 pt-28 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20">
        <div className="max-w-xl">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-bold leading-none tracking-tight text-brand sm:text-6xl md:text-7xl">
            Tool2Day
          </p>
          <h1 className="animate-rise-delay-1 mt-5 text-3xl font-bold leading-snug text-ink sm:text-4xl md:text-[2.65rem]">
            حوّل ملفاتك وحرّر فيديوهاتك في مكان واحد
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-8 text-ink-soft sm:text-lg">
            أدوات سريعة لتحويل الفيديو والصوت وPDF والملفات، مع محرّر فيديو
            ترويجي جاهز للنشر.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/#tools"
              className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
            >
              استكشف الأدوات
            </Link>
            <Link
              href="/#edit"
              className="rounded-md border border-line bg-surface px-5 py-3 text-sm font-semibold text-brand backdrop-blur transition hover:border-brand"
            >
              تحرير الفيديو
            </Link>
          </div>
        </div>

        <div className="animate-float relative mx-auto w-full max-w-lg lg:mx-0">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(11,92,99,0.18),rgba(239,91,60,0.2),rgba(11,92,99,0.12))] blur-xl" />
          <div className="overflow-hidden rounded-[1.6rem] border border-line bg-ink shadow-[0_30px_80px_rgba(19,35,40,0.28)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-xs text-white/70">محطة التحرير</span>
              <span className="text-xs text-accent-soft">جاهز للنشر</span>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1a3f44] via-[#0f2a2e] to-[#241814]">
              <div className="animate-scrub absolute inset-y-8 inset-x-[-10%] grid grid-cols-6 gap-2 opacity-80">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-md"
                    style={{
                      background:
                        i % 3 === 0
                          ? "linear-gradient(135deg,#ef5b3c,#ff9b86)"
                          : i % 2 === 0
                            ? "linear-gradient(135deg,#2a8f98,#0b5c63)"
                            : "linear-gradient(135deg,#4d6a70,#21383c)",
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-x-6 bottom-5 rounded-lg border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                <div className="mb-2 flex items-center justify-between text-[11px] text-white/75">
                  <span>00:08</span>
                  <span>00:42</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[38%] rounded-full bg-accent" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center text-[11px] text-white/70">
              <span>قص</span>
              <span>ترجمة</span>
              <span>تصدير</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
