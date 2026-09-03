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
      {/* Top leaderboard — desktop */}
      <div className="hidden w-full justify-center border-b border-[#eee] bg-[#f7f7f7] py-3 sm:flex">
        <AdsterraBanner size="728x90" />
      </div>
      {/* Top mobile banner */}
      <div className="flex w-full justify-center border-b border-[#eee] bg-[#f7f7f7] py-2 sm:hidden">
        <AdsterraBanner size="320x50" />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <aside className="hidden w-[180px] shrink-0 px-2 py-6 xl:block">
          <div className="sticky top-24">
            <AdsterraBanner size="160x600" />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="hidden w-[180px] shrink-0 px-2 py-6 lg:block">
          <div className="sticky top-24">
            <AdsterraBanner size="160x300" />
          </div>
        </aside>
      </div>

      <AdsterraNative />
      <div className="flex w-full justify-center border-t border-[#eee] bg-[#f7f7f7] py-3">
        <AdsterraBanner size="468x60" />
      </div>
      <div className="flex w-full justify-center bg-[#f7f7f7] pb-3 sm:hidden">
        <AdsterraBanner size="320x50" />
      </div>
      <SiteFooter />
    </div>
  );
}
