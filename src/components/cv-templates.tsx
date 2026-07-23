"use client";

import type { ReactNode } from "react";
import {
  cvLabels,
  lines,
  type CvData,
  type CvLang,
  type CvTemplateId,
} from "@/lib/processors/cv-builder";

type Props = {
  data: CvData;
  lang: CvLang;
  template: CvTemplateId;
};

function Photo({ src, className }: { src: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} />;
  }
  return (
    <div
      className={`flex items-center justify-center text-xs ${className || ""}`}
      style={{ background: "#cbd5e1", color: "#475569" }}
    >
      Photo
    </div>
  );
}

function Bullets({ text }: { text: string }) {
  const items = lines(text);
  if (!items.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-[11px] leading-5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type IconKind = "phone" | "mail" | "pin" | "web" | "user" | "baby" | "age";

function Icon({ kind, color = "currentColor" }: { kind: IconKind; color?: string }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "shrink-0",
  };
  if (kind === "phone") {
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  if (kind === "mail") {
    return (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 7L2 7" />
      </svg>
    );
  }
  if (kind === "pin") {
    return (
      <svg {...common}>
        <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    );
  }
  if (kind === "web") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </svg>
    );
  }
  if (kind === "age") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  if (kind === "baby") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ContactRow({
  kind,
  children,
  light,
}: {
  kind: IconKind;
  children: ReactNode;
  light?: boolean;
}) {
  if (!children) return null;
  return (
    <div
      className="mb-1.5 flex items-start gap-2 text-[11px] leading-5"
      style={{ color: light ? "#ffffff" : "inherit" }}
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          background: light ? "rgba(255,255,255,0.18)" : "#e5e7eb",
        }}
      >
        <Icon kind={kind} color={light ? "#ffffff" : "#334155"} />
      </span>
      <span className="min-w-0 break-all">{children}</span>
    </div>
  );
}

function ContactBlock({ data, L, light }: { data: CvData; L: ReturnType<typeof cvLabels>; light?: boolean }) {
  return (
    <div className="mb-2">
      <ContactRow kind="mail" light={light}>
        {data.email}
      </ContactRow>
      <ContactRow kind="phone" light={light}>
        {data.phone}
      </ContactRow>
      <ContactRow kind="phone" light={light}>
        {data.phone2}
      </ContactRow>
      <ContactRow kind="pin" light={light}>
        {data.address || data.city}
      </ContactRow>
      <ContactRow kind="web" light={light}>
        {data.website}
      </ContactRow>
      <ContactRow kind="age" light={light}>
        {data.age ? `${L.age}: ${data.age}` : null}
      </ContactRow>
      <ContactRow kind="user" light={light}>
        {data.maritalStatus}
      </ContactRow>
      <ContactRow kind="baby" light={light}>
        {data.children ? `${L.children}: ${data.children}` : null}
      </ContactRow>
    </div>
  );
}

function LevelDots({ level, color = "#2563eb" }: { level: number; color?: string }) {
  return (
    <span className="inline-flex gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: i < level ? color : "#d4d4d4" }}
        />
      ))}
    </span>
  );
}

function LevelBar({ level, color }: { level: number; color: string }) {
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-black/10">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, level * 20)}%`, background: color }}
      />
    </div>
  );
}

export function CvTemplateView({ data, lang, template }: Props) {
  const L = cvLabels(lang);
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  const name = data.fullName.trim() || L.placeholderName;
  const title = data.title.trim() || L.placeholderTitle;
  const skillList = lines(data.skills);
  const langList = lines(data.languages);
  const hobbyList = lines(data.hobbies);

  const common: Common = { data, L, name, title, skillList, langList, hobbyList, dir };

  if (template === "grey-ribbon") return <GreyRibbon {...common} />;
  if (template === "blue-circle") return <BlueCircle {...common} />;
  if (template === "soft-blue") return <SoftBlue {...common} />;
  if (template === "navy-orange") return <NavyOrange {...common} />;
  if (template === "cream-modern") return <CreamModern {...common} />;
  return <NavySidebar {...common} />;
}

type Common = {
  data: CvData;
  L: ReturnType<typeof cvLabels>;
  name: string;
  title: string;
  skillList: string[];
  langList: string[];
  hobbyList: string[];
  dir: "rtl" | "ltr";
};

function NavySidebar({ data, L, name, title, skillList, langList, hobbyList, dir }: Common) {
  return (
    <div
      dir={dir}
      className="grid min-h-[900px] grid-cols-[1fr_220px] overflow-hidden bg-white text-[#1a1a1a] shadow"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <div className="p-6">
        <h1 className="text-3xl font-bold text-[#0b2c5f]">{name}</h1>
        <p className="mt-1 text-sm font-semibold">{title}</p>
        <div className="my-3 border-y border-[#0b2c5f] py-px" />
        {data.summary ? (
          <p className="text-[12px] leading-6 text-[#333]">{data.summary}</p>
        ) : null}
        <Section title={L.experience} color="#0b2c5f">
          {data.experience.map((e, i) =>
            e.role || e.company ? (
              <div key={i} className="mb-3">
                <p className="text-[12px] font-bold">
                  {e.role}
                  {e.company ? ` — ${e.company}` : ""}
                </p>
                <p className="text-[10px] text-[#666]">
                  {[e.location, [e.start, e.end].filter(Boolean).join(" – ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <Bullets text={e.details} />
              </div>
            ) : null,
          )}
        </Section>
        <Section title={L.education} color="#0b2c5f">
          {data.education.map((e, i) =>
            e.degree || e.school ? (
              <div key={i} className="mb-2">
                <p className="text-[12px] font-bold">
                  {e.degree}
                  {e.school ? ` — ${e.school}` : ""}
                </p>
                <p className="text-[10px] text-[#666]">
                  {[e.location, [e.start, e.end].filter(Boolean).join(" – "), e.note]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ) : null,
          )}
        </Section>
      </div>
      <aside className="bg-[#0b2c5f] p-4 text-white">
        <Photo
          src={data.photoDataUrl}
          className="mx-auto mb-4 h-28 w-28 rounded object-cover"
        />
        <SideTitle>{L.contact}</SideTitle>
        <ContactBlock data={data} L={L} light />
        <SideTitle>{L.skills}</SideTitle>
        <ul className="mb-3 space-y-1 text-[11px]">
          {skillList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
        <SideTitle>{L.languages}</SideTitle>
        <ul className="mb-3 space-y-1 text-[11px]">
          {langList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
        <SideTitle>{L.hobbies}</SideTitle>
        <ul className="space-y-1 text-[11px]">
          {hobbyList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function GreyRibbon({ data, L, name, title, skillList, langList, dir }: Common) {
  return (
    <div
      dir={dir}
      className="grid min-h-[900px] grid-cols-[240px_1fr] bg-white text-[#222]"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <aside className="bg-[#9ca3af] p-4 text-[#111]">
        <Photo
          src={data.photoDataUrl}
          className="mx-auto mb-4 h-32 w-32 rounded-full object-cover ring-4 ring-white"
        />
        <Ribbon>{L.about}</Ribbon>
        <p className="mb-3 text-[11px] leading-5 text-[#1f2937]">{data.summary}</p>
        <Ribbon>{L.skills}</Ribbon>
        <ul className="mb-3 space-y-1 text-[11px]">
          {skillList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
        <Ribbon>{L.contact}</Ribbon>
        <ContactBlock data={data} L={L} />
        <Ribbon>{L.languages}</Ribbon>
        <ul className="space-y-1 text-[11px]">
          {langList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      </aside>
      <div className="p-6">
        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="mt-1 text-sm text-[#444]">{title}</p>
        <Banner>{L.education}</Banner>
        {data.education.map((e, i) =>
          e.degree || e.school ? (
            <div key={i} className="mb-3 border-s-2 border-[#4b5563] ps-3">
              <p className="text-[11px] text-[#666]">
                {[e.start, e.end].filter(Boolean).join(" – ")}
              </p>
              <p className="text-[12px] font-bold">{e.degree}</p>
              <p className="text-[11px]">{e.school}</p>
            </div>
          ) : null,
        )}
        <Banner>{L.experience}</Banner>
        {data.experience.map((e, i) =>
          e.role || e.company ? (
            <div key={i} className="mb-3 border-s-2 border-[#4b5563] ps-3">
              <p className="text-[11px] text-[#666]">
                {[e.start, e.end].filter(Boolean).join(" – ")}
              </p>
              <p className="text-[12px] font-bold">{e.role}</p>
              <p className="text-[11px]">{e.company}</p>
              <Bullets text={e.details} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function BlueCircle({ data, L, name, title, skillList, langList, dir }: Common) {
  return (
    <div
      dir={dir}
      className="grid min-h-[900px] grid-cols-[230px_1fr] bg-white text-[#1e293b]"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <aside className="bg-[#0f3d6e] p-4 text-white">
        <Photo
          src={data.photoDataUrl}
          className="mx-auto mb-4 h-28 w-28 rounded-full object-cover ring-4 ring-white/30"
        />
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide">{L.about}</h3>
        <p className="mb-4 text-[11px] leading-5 opacity-95">{data.summary}</p>
        <h3 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wide">
          <span className="inline-block h-2 w-2 rounded-full bg-white" />
          {L.contact}
        </h3>
        <ContactBlock data={data} L={L} light />
        <h3 className="mb-2 mt-3 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wide">
          <span className="inline-block h-2 w-2 rounded-full bg-white" />
          {L.skills}
        </h3>
        <ul className="mb-4 space-y-1 text-[11px]">
          {skillList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide">{L.languages}</h3>
        <ul className="space-y-1 text-[11px]">
          {langList.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      </aside>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-[#0f3d6e]">{name}</h1>
        <p className="text-sm text-[#64748b]">{title}</p>
        <h2 className="mt-5 mb-3 flex items-center gap-2 border-b-2 border-[#0f3d6e] pb-1 text-lg font-extrabold text-[#0f3d6e]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0f3d6e]" />
          {L.education}
        </h2>
        {data.education.map((e, i) =>
          e.degree || e.school ? (
            <div key={i} className="mb-3 flex gap-3">
              <div className="w-16 shrink-0 text-[10px] text-[#64748b]">
                {[e.start, e.end].filter(Boolean).join("-")}
              </div>
              <div>
                <p className="text-[12px] font-bold">{e.school}</p>
                <p className="text-[11px]">{e.degree}</p>
                {e.note ? <p className="text-[10px] text-[#666]">{e.note}</p> : null}
              </div>
            </div>
          ) : null,
        )}
        <h2 className="mt-4 mb-3 flex items-center gap-2 border-b-2 border-[#0f3d6e] pb-1 text-lg font-extrabold text-[#0f3d6e]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0f3d6e]" />
          {L.experience}
        </h2>
        {data.experience.map((e, i) =>
          e.role || e.company ? (
            <div key={i} className="mb-3 flex gap-3">
              <div className="w-16 shrink-0 text-[10px] text-[#64748b]">
                {[e.start, e.end].filter(Boolean).join("-")}
              </div>
              <div>
                <p className="text-[12px] font-bold">{e.company}</p>
                <p className="text-[11px]">{e.role}</p>
                <Bullets text={e.details} />
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function SoftBlue({ data, L, name, title, skillList, langList, hobbyList, dir }: Common) {
  return (
    <div
      dir={dir}
      className="min-h-[900px] bg-white text-[#1f2937]"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <header className="flex items-center gap-4 bg-[#334155] p-5 text-white">
        <Photo
          src={data.photoDataUrl}
          className="h-20 w-20 rounded object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm opacity-90">{title}</p>
        </div>
      </header>
      <div className="grid grid-cols-[240px_1fr]">
        <aside className="bg-[#dbeafe] p-4 text-[11px] leading-5">
          <h3 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase text-[#1e3a8a]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#1e3a8a]" />
            {L.contact}
          </h3>
          <ContactBlock data={data} L={L} />
          <h3 className="mt-4 mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase text-[#1e3a8a]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#1e3a8a]" />
            {L.skills}
          </h3>
          <ul className="space-y-1">
            {skillList.map((s) => (
              <li key={s}>◆ {s}</li>
            ))}
          </ul>
          <h3 className="mt-4 mb-2 text-xs font-bold uppercase text-[#1e3a8a]">
            {L.languages}
          </h3>
          <ul className="space-y-1">
            {langList.map((s) => (
              <li key={s}>◆ {s}</li>
            ))}
          </ul>
          <h3 className="mt-4 mb-2 text-xs font-bold uppercase text-[#1e3a8a]">
            {L.hobbies}
          </h3>
          <ul className="space-y-1">
            {hobbyList.map((s) => (
              <li key={s}>◆ {s}</li>
            ))}
          </ul>
        </aside>
        <div className="p-5">
          <HeadBanner>{L.summary}</HeadBanner>
          <p className="mb-4 text-[12px] leading-6">{data.summary}</p>
          <HeadBanner>{L.education}</HeadBanner>
          {data.education.map((e, i) =>
            e.degree || e.school ? (
              <div key={i} className="mb-2 text-[12px]">
                <strong>{e.degree}</strong> — {e.school}{" "}
                <span className="text-[10px] text-[#666]">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </span>
                {e.note ? <div className="text-[10px]">{e.note}</div> : null}
              </div>
            ) : null,
          )}
          <HeadBanner>{L.experience}</HeadBanner>
          {data.experience.map((e, i) =>
            e.role || e.company ? (
              <div key={i} className="mb-3 text-[12px]">
                <strong>{e.role}</strong> — {e.company}{" "}
                <span className="text-[10px] text-[#666]">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </span>
                <Bullets text={e.details} />
              </div>
            ) : null,
          )}
          {data.courses ? (
            <>
              <HeadBanner>{L.courses}</HeadBanner>
              <Bullets text={data.courses} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NavyOrange({ data, L, name, title, dir }: Common) {
  return (
    <div
      dir={dir}
      className="min-h-[900px] overflow-hidden bg-white text-[#1e293b]"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <div className="relative bg-[#0b1f3a] px-6 py-5 text-white">
        <div className="absolute start-0 top-0 h-full w-1/3 bg-gradient-to-br from-[#f97316] to-transparent opacity-40" />
        <div className="relative flex items-center gap-4">
          <Photo
            src={data.photoDataUrl}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-[#f97316]"
          />
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <p className="text-sm text-[#fdba74]">{title}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_240px]">
        <div className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[#0b1f3a]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0b1f3a]" />
            {L.summary}
          </h2>
          <p className="mb-4 text-[12px] leading-6">{data.summary}</p>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[#0b1f3a]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0b1f3a]" />
            {L.experience}
          </h2>
          {data.experience.map((e, i) =>
            e.role || e.company ? (
              <div key={i} className="mb-3">
                <p className="text-[12px] font-bold">{e.role}</p>
                <p className="text-[11px] italic text-[#64748b]">
                  {e.company} · {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
                <Bullets text={e.details} />
              </div>
            ) : null,
          )}
        </div>
        <aside className="bg-[#0b1f3a] p-4 text-white">
          <h3 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-[#fb923c]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#fb923c]" />
            {L.contact}
          </h3>
          <ContactBlock data={data} L={L} light />
          <h3 className="mb-2 mt-3 flex items-center gap-2 text-[13px] font-extrabold text-[#fb923c]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#fb923c]" />
            {L.hardSkills}
          </h3>
          {data.hardSkills
            .filter((s) => s.name.trim())
            .map((s) => (
              <div key={s.name} className="mb-2">
                <p className="text-[11px]">{s.name}</p>
                <LevelBar level={s.level} color="#f97316" />
              </div>
            ))}
          <h3 className="mt-3 mb-2 text-xs font-bold text-[#fb923c]">{L.softSkills}</h3>
          {data.softSkills
            .filter((s) => s.name.trim())
            .map((s) => (
              <div key={s.name} className="mb-2">
                <p className="text-[11px]">{s.name}</p>
                <LevelBar level={s.level} color="#fb923c" />
              </div>
            ))}
          <h3 className="mt-3 mb-2 text-xs font-bold text-[#fb923c]">{L.education}</h3>
          {data.education.map((e, i) =>
            e.degree || e.school ? (
              <div key={i} className="mb-2 text-[11px]">
                <p className="font-bold">{e.degree}</p>
                <p className="opacity-80">{e.school}</p>
                <p className="opacity-60">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
              </div>
            ) : null,
          )}
        </aside>
      </div>
    </div>
  );
}

function CreamModern({ data, L, name, title, skillList, dir }: Common) {
  return (
    <div
      dir={dir}
      className="min-h-[900px] bg-[#fffaf0] p-5 text-[#2d2a26]"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <div className="mb-4 flex items-start gap-4">
        <Photo
          src={data.photoDataUrl}
          className="h-24 w-24 rounded-full object-cover"
        />
        <div>
          <p className="text-xs font-semibold text-[#d97706]">{title}</p>
          <h1 className="text-3xl font-bold tracking-wide">{name}</h1>
        </div>
      </div>
      <div className="grid grid-cols-[240px_1fr] gap-5">
        <aside>
          <h3 className="flex items-center gap-2 text-[13px] font-extrabold uppercase text-[#92400e]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#92400e]" />
            {L.contact}
          </h3>
          <div className="mt-1">
            <ContactBlock data={data} L={L} />
          </div>
          <h3 className="mt-4 flex items-center gap-2 text-[13px] font-extrabold uppercase text-[#92400e]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#92400e]" />
            {L.skills}
          </h3>
          <ul className="mt-1 space-y-1 text-[11px]">
            {skillList.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-bold uppercase text-[#92400e]">
            {L.hardSkills}
          </h3>
          {data.hardSkills
            .filter((s) => s.name.trim())
            .map((s) => (
              <div key={s.name} className="mt-1 flex items-center justify-between text-[11px]">
                <span>{s.name}</span>
                <LevelDots level={s.level} color="#ea580c" />
              </div>
            ))}
        </aside>
        <div>
          <h3 className="text-sm font-bold text-[#92400e]">{L.about}</h3>
          <p className="mt-1 mb-4 text-[12px] leading-6">{data.summary}</p>
          <h3 className="text-sm font-bold text-[#92400e]">{L.experience}</h3>
          {data.experience.map((e, i) =>
            e.role || e.company ? (
              <div key={i} className="mt-2 mb-3 border-s-2 border-[#f59e0b] ps-3">
                <p className="text-[10px] text-[#b45309]">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
                <p className="text-[12px] font-bold">{e.role}</p>
                <p className="text-[11px]">{e.company}</p>
                <Bullets text={e.details} />
              </div>
            ) : null,
          )}
          <h3 className="mt-3 text-sm font-bold text-[#92400e]">{L.education}</h3>
          {data.education.map((e, i) =>
            e.degree || e.school ? (
              <div key={i} className="mt-2 border-s-2 border-[#f59e0b] ps-3 text-[12px]">
                <p className="text-[10px] text-[#b45309]">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
                <p className="font-bold">{e.degree}</p>
                <p>{e.school}</p>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <h2
        className="mb-3 flex items-center gap-2 text-lg font-extrabold"
        style={{ color }}
      >
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: color }}
        />
        {title}
      </h2>
      {children}
    </div>
  );
}

function SideTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-4 flex items-center gap-2 border-b border-white/30 pb-1.5 text-[13px] font-extrabold uppercase tracking-wide">
      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-white" />
      {children}
    </h3>
  );
}

function Ribbon({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 flex items-center gap-2 bg-[#374151] px-2 py-1.5 text-[13px] font-extrabold text-white">
      <span className="inline-block h-2 w-2 rounded-full bg-white" />
      {children}
    </div>
  );
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 mb-3 flex items-center gap-2 bg-[#374151] px-3 py-2 text-base font-extrabold text-white">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" />
      {children}
    </div>
  );
}

function HeadBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 mt-4 flex items-center gap-2 bg-[#334155] px-3 py-2 text-base font-extrabold text-white">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" />
      {children}
    </div>
  );
}
