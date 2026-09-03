import {
  AdsterraBanner,
  AdsterraNative,
} from "@/components/adsterra-ads";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      {/* Unique Adsterra keys only — never reuse the same unit twice */}
      <div className="flex w-full justify-center border-b border-[#eee] bg-[#f7f7f7] py-2">
        <div className="hidden sm:block">
          <AdsterraBanner size="728x90" />
        </div>
        <div className="sm:hidden">
          <AdsterraBanner size="320x50" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-3 px-2">
        <aside className="hidden w-[168px] shrink-0 py-4 lg:block">
          <div className="sticky top-20">
            <AdsterraBanner size="160x600" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

        <aside className="hidden w-[168px] shrink-0 py-4 lg:block">
          <div className="sticky top-20">
            <AdsterraBanner size="160x300" />
          </div>
        </aside>
      </div>

      <div className="flex w-full justify-center border-t border-[#eee] bg-[#f7f7f7] py-2">
        <AdsterraBanner size="468x60" />
      </div>

      <AdsterraNative />

      <SiteFooter />
    </div>
  );
}
