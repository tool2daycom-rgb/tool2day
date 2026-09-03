import { AdsterraBanner, AdsterraNative } from "@/components/adsterra-ads";
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
      <div className="hidden justify-center bg-[#f7f7f7] py-2 sm:flex">
        <AdsterraBanner size="728x90" />
      </div>
      <div className="flex justify-center bg-[#f7f7f7] py-2 sm:hidden">
        <AdsterraBanner size="320x50" />
      </div>
      <div className="flex flex-1">
        <aside className="hidden shrink-0 px-2 py-6 xl:block" aria-hidden>
          <div className="sticky top-24">
            <AdsterraBanner size="160x600" />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="hidden shrink-0 px-2 py-6 lg:block xl:hidden" aria-hidden>
          <div className="sticky top-24">
            <AdsterraBanner size="160x300" />
          </div>
        </aside>
        <aside className="hidden shrink-0 px-2 py-6 xl:block" aria-hidden>
          <div className="sticky top-24">
            <AdsterraBanner size="160x300" />
          </div>
        </aside>
      </div>
      <AdsterraNative />
      <div className="flex justify-center bg-[#f7f7f7] py-3">
        <AdsterraBanner size="468x60" />
      </div>
      <SiteFooter />
    </div>
  );
}
