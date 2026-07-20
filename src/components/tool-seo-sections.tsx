"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import { ToolRatingBar } from "@/components/star-rating";
import type { ToolSeoContent } from "@/lib/tool-seo-content";

export function ToolSeoSections({
  content,
  toolSlug,
}: {
  content: ToolSeoContent;
  toolSlug: string;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mt-16 space-y-16 border-t border-dashed border-[#ddd] pt-14">
      <div className="flex flex-col items-center text-center">
        <BrandMarkAnimated size={52} motion="morph" />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            مجاني بالكامل
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            بدون علامة مائية
          </span>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-[#111]">{content.introTitle}</h2>
        <p className="mt-4 text-[15px] leading-8 text-[#444]">{content.intro}</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-[#111]">{content.howTitle}</h2>
        <p className="mt-3 text-[15px] leading-8 text-[#555]">{content.howIntro}</p>
        <ol className="mt-8 space-y-7">
          {content.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-sm font-extrabold text-[#111]">
                {i + 1}
              </span>
              <div>
                <h3 className="text-base font-bold text-[#111]">{step.title}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-[#555]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {content.moreTitle && content.moreBody ? (
        <section>
          <h2 className="text-2xl font-bold text-[#111]">{content.moreTitle}</h2>
          <p className="mt-4 text-[15px] leading-8 text-[#444]">{content.moreBody}</p>
        </section>
      ) : null}

      <section>
        <h2 className="text-center text-2xl font-bold text-[#111]">
          {content.whyTitle}
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {content.why.map((item) => (
            <li key={item.title} className="text-start">
              <h3 className="text-base font-bold text-[#111]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#555]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-[#111]">الأسئلة الشائعة</h2>
        <ul className="space-y-3">
          {content.faqs.map((faq, i) => {
            const open = openFaq === i;
            return (
              <li
                key={faq.q}
                className="overflow-hidden rounded-xl border border-[#e8e8e8] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start"
                  aria-expanded={open}
                >
                  <span className="text-[15px] font-bold text-[#1a1a1a]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#666] transition ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open ? (
                  <div className="border-t border-[#f0f0f0] bg-[#fafafa] px-4 py-3.5 text-[14px] leading-7 text-[#444]">
                    {faq.a}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <ToolRatingBar target={toolSlug} />
    </div>
  );
}
