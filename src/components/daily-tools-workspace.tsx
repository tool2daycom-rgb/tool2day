"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { useToolDisplay } from "@/hooks/use-tool-display";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  buildQrPayload,
  decodeJwt,
  generateBios,
  generateCompanyNames,
  generatePassword,
  generateSlogans,
  generateSocialCaptions,
  generateUsernames,
  parseListItems,
  passwordStrength,
  pickRandom,
  rollDice,
  type CaptionPlatform,
  type PasswordOptions,
  type QrMode,
} from "@/lib/processors/daily-utils";

export type DailyToolKind =
  | "company-slogan-generator"
  | "jwt-decoder"
  | "social-caption-generator"
  | "bio-username-generator"
  | "random-picker"
  | "qr-generator"
  | "password-generator";

type Props = {
  kind: DailyToolKind;
  slug: string;
  arTitle: string;
  arDescription: string;
};

const field =
  "w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#2563eb]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-[#111] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#333] disabled:opacity-50";
const btnGhost =
  "inline-flex items-center justify-center rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-bold text-[#333] transition hover:bg-[#f5f5f5]";

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-semibold text-[#111]">{title}</p>
      <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function ResultList({
  items,
  slug,
  joined,
}: {
  items: string[];
  slug: string;
  joined?: boolean;
}) {
  const [note, setNote] = useState<string | null>(null);
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnGhost}
          onClick={async () => {
            beginToolUse(slug);
            await copyText(joined ? items.join("\n\n") : items.join("\n"));
            setNote("تم نسخ الكل");
          }}
        >
          نسخ الكل
        </button>
      </div>
      {note ? <p className="text-xs text-[#666]">{note}</p> : null}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={`${i}-${item.slice(0, 24)}`}
            className="flex items-start justify-between gap-3 rounded-lg border border-[#eee] bg-[#fafafa] px-3 py-2"
          >
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#222]">
              {item}
            </p>
            <button
              type="button"
              className="shrink-0 text-xs font-bold text-[#2563eb]"
              onClick={async () => {
                beginToolUse(slug);
                await copyText(item);
                setNote("تم النسخ");
              }}
            >
              نسخ
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DailyToolsWorkspace({
  kind,
  slug,
  arTitle,
  arDescription,
}: Props) {
  const { title, description } = useToolDisplay(slug, arTitle, arDescription);
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "password-generator") {
    return <PasswordPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "qr-generator") {
    return <QrPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "jwt-decoder") {
    return <JwtPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "random-picker") {
    return <RandomPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "company-slogan-generator") {
    return <CompanyPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "bio-username-generator") {
    return <BioPanel slug={slug} title={title} description={description} />;
  }
  return <CaptionPanel slug={slug} title={title} description={description} />;
}

function PasswordPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 16,
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
  });
  const [password, setPassword] = useState(() => generatePassword(opts));
  const strength = useMemo(() => passwordStrength(password), [password]);
  const [note, setNote] = useState<string | null>(null);

  function regenerate() {
    beginToolUse(slug);
    setPassword(generatePassword(opts));
    setNote(null);
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        الطول: {opts.length}
        <input
          type="range"
          min={6}
          max={64}
          value={opts.length}
          className="mt-2 w-full"
          onChange={(e) =>
            setOpts((o) => ({ ...o, length: Number(e.target.value) }))
          }
        />
      </label>
      <div className="flex flex-wrap gap-3 text-sm text-[#333]">
        {(
          [
            ["lower", "أحرف صغيرة"],
            ["upper", "أحرف كبيرة"],
            ["digits", "أرقام"],
            ["symbols", "رموز"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={opts[key]}
              onChange={(e) =>
                setOpts((o) => ({ ...o, [key]: e.target.checked }))
              }
            />
            {label}
          </label>
        ))}
      </div>
      <div className="rounded-lg border border-[#eee] bg-[#fafafa] px-3 py-3 font-mono text-sm break-all text-[#111]">
        {password}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-[#666]">
          <span>قوة كلمة المرور</span>
          <span>{strength.label}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
          <div
            className="h-full rounded-full bg-[#111] transition-all"
            style={{ width: `${strength.percent}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={regenerate}>
          توليد جديد
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={async () => {
            beginToolUse(slug);
            await copyText(password);
            setNote("تم النسخ");
          }}
        >
          نسخ
        </button>
      </div>
      {note ? <p className="text-xs text-[#666]">{note}</p> : null}
    </Shell>
  );
}

function QrPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [mode, setMode] = useState<QrMode>("url");
  const [url, setUrl] = useState("https://www.tool2day.com");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [ssid, setSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [text, setText] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () =>
      buildQrPayload(mode, {
        url,
        phone,
        message,
        ssid,
        password: wifiPass,
        wifiType,
        text,
      }),
    [mode, url, phone, message, ssid, wifiPass, wifiType, text],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!payload) {
        setDataUrl(null);
        setError(null);
        return;
      }
      try {
        const png = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) {
          setDataUrl(png);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setDataUrl(null);
          setError("تعذّر إنشاء رمز QR — راجع المدخلات.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <Shell title={title} description={description}>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["url", "رابط"],
            ["whatsapp", "واتساب"],
            ["wifi", "واي فاي"],
            ["text", "نص"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={mode === id ? btnPrimary : btnGhost}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <label className="block text-sm font-semibold text-[#333]">
          الرابط
          <input
            className={`mt-1 ${field}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
        </label>
      ) : null}
      {mode === "whatsapp" ? (
        <>
          <label className="block text-sm font-semibold text-[#333]">
            رقم واتساب (مع مفتاح الدولة)
            <input
              className={`mt-1 ${field}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9665xxxxxxxx"
              dir="ltr"
            />
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            رسالة اختيارية
            <input
              className={`mt-1 ${field}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        </>
      ) : null}
      {mode === "wifi" ? (
        <>
          <label className="block text-sm font-semibold text-[#333]">
            اسم الشبكة (SSID)
            <input
              className={`mt-1 ${field}`}
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            نوع الحماية
            <select
              className={`mt-1 ${field}`}
              value={wifiType}
              onChange={(e) =>
                setWifiType(e.target.value as "WPA" | "WEP" | "nopass")
              }
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">بدون كلمة مرور</option>
            </select>
          </label>
          {wifiType !== "nopass" ? (
            <label className="block text-sm font-semibold text-[#333]">
              كلمة مرور الشبكة
              <input
                className={`mt-1 ${field}`}
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                type="text"
              />
            </label>
          ) : null}
        </>
      ) : null}
      {mode === "text" ? (
        <label className="block text-sm font-semibold text-[#333]">
          النص
          <textarea
            className={`mt-1 min-h-24 ${field}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {dataUrl ? (
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="QR code"
            className="h-56 w-56 rounded-lg border border-[#eee] bg-white p-2"
          />
          <div className="flex flex-wrap gap-2">
            <a
              href={dataUrl}
              download="tool2day-qr.png"
              className={btnPrimary}
              onClick={() => beginToolUse(slug)}
            >
              تنزيل PNG
            </a>
            <button
              type="button"
              className={btnGhost}
              onClick={async () => {
                beginToolUse(slug);
                await copyText(payload);
              }}
            >
              نسخ المحتوى
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#888]">أدخل البيانات لمعاينة رمز QR.</p>
      )}
    </Shell>
  );
}

function JwtPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [token, setToken] = useState("");
  const result = useMemo(() => decodeJwt(token), [token]);
  const [note, setNote] = useState<string | null>(null);

  return (
    <Shell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        الصق JWT
        <textarea
          className={`mt-1 min-h-28 font-mono text-xs ${field}`}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
          dir="ltr"
          spellCheck={false}
        />
      </label>
      {!result.ok ? (
        <p className="text-sm text-[#888]">{result.error}</p>
      ) : (
        <div className="space-y-3">
          {result.notes.map((n) => (
            <p key={n} className="text-xs leading-5 text-[#666]">
              {n}
            </p>
          ))}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111]">Header</p>
              <button
                type="button"
                className="text-xs font-bold text-[#2563eb]"
                onClick={async () => {
                  beginToolUse(slug);
                  await copyText(result.headerJson);
                  setNote("تم نسخ Header");
                }}
              >
                نسخ
              </button>
            </div>
            <pre
              className="overflow-x-auto rounded-lg border border-[#eee] bg-[#0f172a] p-3 text-xs leading-5 text-[#e2e8f0]"
              dir="ltr"
            >
              {result.headerJson}
            </pre>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111]">Payload</p>
              <button
                type="button"
                className="text-xs font-bold text-[#2563eb]"
                onClick={async () => {
                  beginToolUse(slug);
                  await copyText(result.payloadJson);
                  setNote("تم نسخ Payload");
                }}
              >
                نسخ
              </button>
            </div>
            <pre
              className="overflow-x-auto rounded-lg border border-[#eee] bg-[#0f172a] p-3 text-xs leading-5 text-[#e2e8f0]"
              dir="ltr"
            >
              {result.payloadJson}
            </pre>
          </div>
          <p className="text-xs text-[#888]" dir="ltr">
            Signature: {result.signature.slice(0, 24)}…
          </p>
          {note ? <p className="text-xs text-[#666]">{note}</p> : null}
        </div>
      )}
    </Shell>
  );
}

function RandomPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [list, setList] = useState("خيار 1\nخيار 2\nخيار 3");
  const [pick, setPick] = useState<string | null>(null);
  const [dice, setDice] = useState(6);
  const [roll, setRoll] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<{
    value: number;
    sides: number;
    rolling: boolean;
    key: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const items = useMemo(() => parseListItems(list), [list]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!overlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlay]);

  useEffect(() => {
    if (!overlay?.rolling) return;
    const t = window.setTimeout(() => {
      setOverlay((o) => (o ? { ...o, rolling: false } : o));
    }, 1150);
    return () => window.clearTimeout(t);
  }, [overlay?.key, overlay?.rolling]);

  function throwDice() {
    beginToolUse(slug);
    const value = rollDice(dice);
    setRoll(value);
    setOverlay({
      value,
      sides: dice,
      rolling: true,
      key: Date.now(),
    });
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        القائمة (سطر لكل خيار، أو مفصولة بفاصلة)
        <textarea
          className={`mt-1 min-h-32 ${field}`}
          value={list}
          onChange={(e) => setList(e.target.value)}
        />
      </label>
      <p className="text-xs text-[#888]">{items.length} خيار جاهز</p>
      <button
        type="button"
        className={btnPrimary}
        disabled={!items.length}
        onClick={() => {
          beginToolUse(slug);
          setPick(pickRandom(items));
        }}
      >
        اختيار عشوائي
      </button>
      {pick ? (
        <p className="rounded-lg border border-[#111] bg-[#111] px-4 py-3 text-center text-lg font-bold text-white">
          {pick}
        </p>
      ) : null}

      <div className="border-t border-[#eee] pt-4">
        <p className="text-sm font-semibold text-[#333]">رمي نرد</p>
        <label className="mt-2 block text-sm text-[#555]">
          عدد الأوجه
          <select
            className={`mt-1 ${field}`}
            value={dice}
            onChange={(e) => setDice(Number(e.target.value))}
          >
            {[4, 6, 8, 10, 12, 20].map((n) => (
              <option key={n} value={n}>
                {n} أوجه
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={`${btnPrimary} mt-3`} onClick={throwDice}>
          ارمِ النرد (ملء الشاشة)
        </button>
        {roll != null && !overlay ? (
          <p className="mt-3 text-sm text-[#666]">
            آخر نتيجة: <span className="font-black text-[#111]">{roll}</span>
          </p>
        ) : null}
      </div>

      {mounted && overlay
        ? createPortal(
            <DiceFullscreen
              key={overlay.key}
              sides={overlay.sides}
              value={overlay.value}
              rolling={overlay.rolling}
              onClose={() => setOverlay(null)}
              onReroll={throwDice}
            />,
            document.body,
          )
        : null}
    </Shell>
  );
}

const D6_FACE_TRANSFORM: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateY(-90deg)",
  3: "rotateX(-90deg)",
  4: "rotateX(90deg)",
  5: "rotateY(90deg)",
  6: "rotateY(180deg)",
};

const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DicePips({ value }: { value: number }) {
  const active = new Set(PIP_MAP[value] ?? [4]);
  return (
    <div className="dice-face-pips">
      {Array.from({ length: 9 }, (_, i) =>
        active.has(i) ? <span key={i} className="dice-pip" /> : <span key={i} />,
      )}
    </div>
  );
}

function DiceCube3D({
  value,
  rolling,
}: {
  value: number;
  rolling: boolean;
}) {
  const final = D6_FACE_TRANSFORM[value] ?? D6_FACE_TRANSFORM[1]!;
  const half = "calc(var(--dice-size) / 2)";

  const faces: { n: number; transform: string }[] = [
    { n: 1, transform: `rotateY(0deg) translateZ(${half})` },
    { n: 6, transform: `rotateY(180deg) translateZ(${half})` },
    { n: 2, transform: `rotateY(90deg) translateZ(${half})` },
    { n: 5, transform: `rotateY(-90deg) translateZ(${half})` },
    { n: 3, transform: `rotateX(90deg) translateZ(${half})` },
    { n: 4, transform: `rotateX(-90deg) translateZ(${half})` },
  ];

  return (
    <div className="dice-stage">
      <div
        className={`dice-cube${rolling ? " is-rolling" : ""}`}
        style={
          {
            "--dice-final": final,
            transform: rolling ? undefined : final,
          } as CSSProperties
        }
      >
        {faces.map((f) => (
          <div
            key={f.n}
            className="dice-face"
            style={{ transform: f.transform }}
            aria-hidden={f.n !== value}
          >
            <DicePips value={f.n} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DiceFullscreen({
  sides,
  value,
  rolling,
  onClose,
  onReroll,
}: {
  sides: number;
  value: number;
  rolling: boolean;
  onClose: () => void;
  onReroll: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dice-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="نتيجة رمي النرد"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {sides === 6 ? (
          <DiceCube3D value={value} rolling={rolling} />
        ) : (
          <div className={`dice-poly${rolling ? " is-rolling" : ""}`}>
            <span className="dice-face-num">{rolling ? "?" : value}</span>
          </div>
        )}
        <p className="dice-result-label">
          {rolling ? "يرمي…" : `النتيجة: ${value}`}
          {!rolling ? ` / ${sides}` : ""}
        </p>
        <p className="dice-hint">اضغط خارج النرد للإغلاق</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="rounded-md bg-white px-4 py-2.5 text-sm font-bold text-[#111]"
            onClick={onReroll}
            disabled={rolling}
          >
            ارمِ مجدداً
          </button>
          <button
            type="button"
            className="rounded-md border border-white/30 bg-transparent px-4 py-2.5 text-sm font-bold text-white"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanyPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [keyword, setKeyword] = useState("تقنية");
  const [names, setNames] = useState<string[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);

  function generate() {
    beginToolUse(slug);
    setNames(generateCompanyNames(keyword));
    setSlogans(generateSlogans(keyword));
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        الكلمة المفتاحية / المجال
        <input
          className={`mt-1 ${field}`}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="مثال: تعليم، قهوة، تصميم"
        />
      </label>
      <button type="button" className={btnPrimary} onClick={generate}>
        توليد أسماء وشعارات
      </button>
      {names.length ? (
        <>
          <p className="text-sm font-bold text-[#111]">أسماء مقترحة</p>
          <ResultList items={names} slug={slug} />
          <p className="text-sm font-bold text-[#111]">شعارات (Slogan)</p>
          <ResultList items={slogans} slug={slug} />
        </>
      ) : null}
    </Shell>
  );
}

function BioPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("محتوى");
  const [usernames, setUsernames] = useState<string[]>([]);
  const [bios, setBios] = useState<string[]>([]);

  function generate() {
    beginToolUse(slug);
    setUsernames(generateUsernames(name || niche));
    setBios(generateBios(name || "صانع محتوى", niche));
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        الاسم أو العلامة
        <input
          className={`mt-1 ${field}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: سارة"
        />
      </label>
      <label className="block text-sm font-semibold text-[#333]">
        التخصص / النيتش
        <input
          className={`mt-1 ${field}`}
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="مثال: طبخ، برمجة، موضة"
        />
      </label>
      <button type="button" className={btnPrimary} onClick={generate}>
        توليد Bio وأسماء مستخدم
      </button>
      {usernames.length ? (
        <>
          <p className="text-sm font-bold text-[#111]">أسماء مستخدم</p>
          <ResultList items={usernames} slug={slug} />
          <p className="text-sm font-bold text-[#111]">نصوص Bio</p>
          <ResultList items={bios} slug={slug} />
        </>
      ) : null}
    </Shell>
  );
}

function CaptionPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<CaptionPlatform>("instagram");
  const [captions, setCaptions] = useState<string[]>([]);

  function generate() {
    beginToolUse(slug);
    setCaptions(generateSocialCaptions(topic, platform));
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        الموضوع
        <input
          className={`mt-1 ${field}`}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="مثال: روتين صباحي، مراجعة منتج"
        />
      </label>
      <label className="block text-sm font-semibold text-[#333]">
        المنصة
        <select
          className={`mt-1 ${field}`}
          value={platform}
          onChange={(e) => setPlatform(e.target.value as CaptionPlatform)}
        >
          <option value="instagram">انستغرام</option>
          <option value="youtube">يوتيوب</option>
          <option value="tiktok">تيك توك</option>
        </select>
      </label>
      <button type="button" className={btnPrimary} onClick={generate}>
        توليد الأوصاف
      </button>
      <ResultList items={captions} slug={slug} joined />
    </Shell>
  );
}
