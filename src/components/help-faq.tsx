"use client";

import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

type FaqItem = {
  id: string;
  question: string;
  answer: React.ReactNode;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

const supportLink = (
  <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
    contact our support team
  </Link>
);

const sections: FaqSection[] = [
  {
    id: "billing",
    title: "Billing & Account",
    items: [
      {
        id: "cancel-subscription",
        question: "How do I cancel my subscription or turn off auto‑renew?",
        answer: (
          <>
            <p>Please check whether your subscription has been canceled. Here’s how:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>Log in if you’re not already logged in to your Tool2Day account.</li>
              <li>Click the profile icon in the top-left area of the header (or top-right in LTR views).</li>
              <li>
                Select <strong>Account</strong> from the menu.
              </li>
              <li>Scroll to the bottom of the page.</li>
              <li>
                If your plan status is <strong>Active</strong>, click{" "}
                <strong>Cancel subscription</strong>.
              </li>
            </ol>
            <p className="mt-3">
              If Premium is not active but you were charged, the subscription may have been
              purchased under a different email. Try every email you might have used and repeat
              the steps above.
            </p>
            <p className="mt-3">
              If the subscription is canceled but charges continue, please {supportLink}.
            </p>
          </>
        ),
      },
      {
        id: "still-charged",
        question: "Why am I still getting charged after canceling?",
        answer: (
          <>
            <p>
              Please confirm you are logged into the correct account via the profile icon in the
              header.
            </p>
            <p className="mt-3">
              If you are logged in but Premium is missing after payment, make sure you used the
              same email at checkout. The subscription may belong to another account.
            </p>
            <p className="mt-3">
              If you are sure this is the right account and access is still missing, please{" "}
              {supportLink}.
            </p>
          </>
        ),
      },
      {
        id: "restore-premium",
        question: "I was charged but I don’t have Premium access. How do I restore it?",
        answer: (
          <>
            <p>
              You may have a subscription under a different account. Check every email you might
              have used. If you find an unwanted subscription, cancel it using the steps in{" "}
              <a href="#cancel-subscription" className="font-medium text-[#2563eb] hover:underline">
                How do I cancel my subscription?
              </a>
              .
            </p>
            <p className="mt-3">
              If you only have one subscription but were charged twice, please {supportLink} and
              include your payment receipts.
            </p>
          </>
        ),
      },
      {
        id: "charged-twice",
        question: "I was charged twice. What should I do?",
        answer: (
          <>
            <p>
              Check whether you have another active subscription under a different email. Cancel
              any unwanted plans as described{" "}
              <a href="#cancel-subscription" className="font-medium text-[#2563eb] hover:underline">
                here
              </a>
              .
            </p>
            <p className="mt-3">
              If you are sure there is only one subscription, please {supportLink} and send the
              payment receipts.
            </p>
          </>
        ),
      },
      {
        id: "annual-vs-monthly",
        question:
          "I accidentally bought an annual plan but wanted monthly. Can you switch or refund?",
        answer: (
          <p>
            Mistakes happen. If you chose an annual plan instead of monthly, contact us within{" "}
            <strong>12 hours</strong> of purchase and we will try to help — {supportLink}.
          </p>
        ),
      },
      {
        id: "change-payment",
        question: "How do I change my payment method?",
        answer: (
          <>
            <p>To change your payment method:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>Log in to your Tool2Day account.</li>
              <li>
                Open <strong>Payment method</strong> and click <strong>Change</strong>.
              </li>
              <li>Select a new method from the available options and confirm.</li>
            </ol>
            <p className="mt-3">
              The updated method will be used for future billing. If you have issues, please{" "}
              {supportLink}.
            </p>
          </>
        ),
      },
      {
        id: "payment-failed",
        question: "My payment keeps failing or being declined. What can I do?",
        answer: (
          <>
            <p>If the transaction is declined, try these steps:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>Check your card details.</strong> Confirm number, expiration date, and CVV.
              </li>
              <li>
                <strong>Check for sufficient funds</strong> on the linked account.
              </li>
              <li>
                <strong>Enable online and international payments</strong> in your banking app if
                required.
              </li>
              <li>
                <strong>Ask your bank</strong> whether the charge was blocked for security reasons.
              </li>
              <li>
                <strong>Disable VPNs or proxies</strong> and try again.
              </li>
              <li>
                <strong>Try another card or browser</strong> (Chrome, Firefox, Safari, Edge).
              </li>
            </ol>
            <p className="mt-3">
              Still stuck after confirming with your bank? Please {supportLink} so we can check the
              error code.
            </p>
          </>
        ),
      },
      {
        id: "upi",
        question: "Do you support UPI payment method?",
        answer: (
          <p>Not at the moment, but we are considering enabling it in the future.</p>
        ),
      },
      {
        id: "crypto",
        question: "Can I pay with crypto?",
        answer: (
          <p>Not at the moment, but we are considering enabling it in the future.</p>
        ),
      },
      {
        id: "cant-login",
        question: "I can’t log in to my account",
        answer: (
          <>
            <p>If login fails, try the following:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>Check your login details</strong> for typos, spaces, or keyboard layout.
              </li>
              <li>
                <strong>Try a normal window</strong> if private/incognito mode blocks cookies.
              </li>
              <li>
                <strong>Reset your password</strong> with “Forgot Password”.
              </li>
              <li>
                <strong>Clear cookies and cache</strong>, then try again.
              </li>
              <li>
                <strong>Try another browser or device.</strong>
              </li>
              <li>
                <strong>Disable ad blockers / privacy extensions</strong> that may block login.
              </li>
              <li>
                <strong>Use the same sign-in method</strong> you registered with (Google, Apple,
                email, etc.).
              </li>
              <li>
                <strong>Try again later</strong> in case of a temporary service issue.
              </li>
            </ol>
            <p className="mt-3">
              If none of these help, please {supportLink} with details about the issue.
            </p>
          </>
        ),
      },
      {
        id: "reset-email",
        question: "I don’t receive the password reset email",
        answer: (
          <>
            <p>If the reset email doesn’t arrive:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>Check spam / junk.</strong>
              </li>
              <li>
                <strong>Verify the email</strong> matches the one used when creating the account.
              </li>
              <li>
                <strong>Wait up to 10 minutes</strong> — delivery can be delayed.
              </li>
              <li>
                Search your inbox for “Tool2Day” or “Password Reset”.
              </li>
              <li>
                <strong>Check mailbox storage</strong> — a full inbox may block new mail.
              </li>
              <li>
                Review email security settings so tool2day.com is not blocked.
              </li>
              <li>
                Corporate or school filters may delay system emails.
              </li>
              <li>
                If you registered with Google/Apple, sign in with that method instead of password
                reset.
              </li>
              <li>
                Wait a few minutes between reset requests to avoid rate limits.
              </li>
              <li>
                Confirm your internet connection is stable.
              </li>
            </ol>
            <p className="mt-3">
              Still nothing? Please {supportLink} and include your registered email.
            </p>
          </>
        ),
      },
      {
        id: "delete-account",
        question: "How do I delete my account?",
        answer: (
          <>
            <p>To delete your account:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>Log in to your account.</li>
              <li>
                Scroll down and click <strong>Delete account</strong>.
              </li>
              <li>Confirm in the dialog, or cancel if you change your mind.</li>
            </ol>
            <p className="mt-3">
              <strong>Please note:</strong> Deleting your account permanently removes associated
              data and cancels any Premium subscription. This cannot be undone.
            </p>
          </>
        ),
      },
      {
        id: "unknown-charge",
        question: "I was charged, but I don’t remember subscribing",
        answer: (
          <>
            <p>Unrecognized Tool2Day charges usually come from one of these:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>Subscription renewal.</strong> An older monthly/annual plan may have
                auto-renewed.
              </li>
              <li>
                <strong>Look-alike websites.</strong> Sites that resemble Tool2Day are not always
                affiliated with us. On your statement, our charges typically appear as{" "}
                <strong>TOOL2DAY</strong> or similar. A different descriptor usually means another
                service.
              </li>
              <li>
                <strong>Household use.</strong> Someone with access to your payment method may have
                subscribed.
              </li>
              <li>
                <strong>Unauthorized use.</strong> If you suspect fraud, contact your bank
                immediately to block the card.
              </li>
            </ol>
            <p className="mt-3">
              If none of these apply, please {supportLink} so we can help.
            </p>
          </>
        ),
      },
      {
        id: "change-email",
        question: "How can I change my email address?",
        answer: (
          <p>
            Changing the email on an existing account is not available yet. We plan to add this in
            profile settings in a future update. For urgent cases, please {supportLink}.
          </p>
        ),
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    items: [
      {
        id: "stuck-progress",
        question: "The upload or export process is stuck (e.g. 0%, 100%, NaN%, etc.)",
        answer: (
          <>
            <p>If progress stops moving, it’s often a connection issue:</p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>
                <strong>Check your connection</strong> — use a stable network.
              </li>
              <li>
                <strong>Try a different network</strong> (e.g. mobile hotspot) in case office/school
                filters block processing.
              </li>
              <li>
                <strong>Disable VPN/proxy</strong> or change the server location and retry.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "larger-output",
        question:
          "Why is the output file larger than the original, even though I cut parts of it?",
        answer: (
          <p>
            Tool2Day re-encodes video on export. Your original file may have used heavy compression.
            To keep quality, we may apply a higher bitrate, so the file can grow even after cutting.
            To shrink the result, choose a lower resolution or a lower quality/compression setting
            when exporting.
          </p>
        ),
      },
      {
        id: "encoding-failed",
        question: 'I get error "Encoding failed". How do I fix it?',
        answer: (
          <p>
            This usually means the source file format, codec, or structure caused a problem during
            conversion. We support most common formats, but rare codecs or slightly corrupted files
            can fail. Please {supportLink} for help.
          </p>
        ),
      },
      {
        id: "subtitles",
        question: "How do I add subtitles, captions or text?",
        answer: (
          <p>
            You can add text overlays in the{" "}
            <Link href="/tools/video-editor" className="font-medium text-[#2563eb] hover:underline">
              video editor
            </Link>{" "}
            with the Text tool. Timed subtitles / closed captions are not supported yet — we plan to
            add them later.
          </p>
        ),
      },
      {
        id: "save-button",
        question: 'I can\'t find the "Save" button. Where is it?',
        answer: (
          <p>
            In the video editor, the action is labeled <strong>Export</strong> (usually near the top
            of the workspace). We use “Export” to match common video/audio editing apps.
          </p>
        ),
      },
      {
        id: "transitions",
        question: "How do I add transitions or fade effects?",
        answer: (
          <p>
            Cross-fades and fade-in/out transitions are not available yet. We know these are
            important and are working on them for upcoming updates.
          </p>
        ),
      },
      {
        id: "remove-logo",
        question: "How do I remove a logo or watermark from a video?",
        answer: (
          <>
            <p>
              Use the{" "}
              <Link
                href="/tools/remove-logo"
                className="font-medium text-[#2563eb] hover:underline"
              >
                Remove logo
              </Link>{" "}
              tool to blur logos or watermarks. Desktop works best; mobile support is limited for
              now.
            </p>
            <p className="mt-3 font-semibold">Instructions:</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>
                Open{" "}
                <Link
                  href="/tools/remove-logo"
                  className="font-medium text-[#2563eb] hover:underline"
                >
                  Remove logo from video
                </Link>
                .
              </li>
              <li>
                Click <strong>Choose File</strong> and upload your video.
              </li>
              <li>
                Draw a selection over the logo (you can select multiple areas).
              </li>
              <li>
                Click <strong>Export</strong> when finished.
              </li>
              <li>Choose resolution/format and download the result.</li>
            </ol>
          </>
        ),
      },
      {
        id: "remove-logo-mobile",
        question: 'Does the "Remove logo" tool work on mobile?',
        answer: (
          <p>
            Not fully yet — Remove logo works best on desktop. We’re working on a better mobile
            experience.
          </p>
        ),
      },
      {
        id: "mic-camera",
        question:
          'How do I enable the microphone or camera if I clicked "Block" or "Never Allow"?',
        answer: (
          <>
            <p>
              If you denied camera/microphone access, re-enable it in the browser for{" "}
              <strong>tool2day.com</strong>.
            </p>
            <p className="mt-4 font-semibold">Google Chrome & Microsoft Edge</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>Open the Tool2Day page that needs camera/mic.</li>
              <li>Click the lock (or site info) icon left of the address bar.</li>
              <li>
                Set <strong>Camera</strong> / <strong>Microphone</strong> to Allow (or Ask).
              </li>
              <li>Reload the page.</li>
            </ol>
            <p className="mt-4 font-semibold">Safari (macOS)</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>
                Safari → <strong>Settings</strong> → <strong>Websites</strong>.
              </li>
              <li>
                Choose Camera or Microphone, find tool2day.com, set to <strong>Allow</strong>.
              </li>
              <li>Reload and try again.</li>
            </ol>
            <p className="mt-4 font-semibold">Mozilla Firefox</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>Open the site, click the lock icon in the address bar.</li>
              <li>
                Clear the blocked Camera/Microphone permission (X), reload, then Allow when prompted.
              </li>
            </ol>
            <p className="mt-4 font-semibold">If it still doesn’t work</p>
            <ul className="mt-2 list-disc space-y-2 ps-5">
              <li>
                Allow the browser in OS privacy settings (e.g. macOS → System Settings → Privacy &amp;
                Security).
              </li>
              <li>Close other apps/tabs using the camera or mic.</li>
            </ul>
          </>
        ),
      },
      {
        id: "relogin",
        question: "Why am I sometimes asked to log in again when switching tools?",
        answer: (
          <>
            <p>
              Login sessions depend on browser cookies. Private/Incognito mode and strict privacy
              settings often clear or block them when you move between pages or tools.
            </p>
            <p className="mt-3">To stay signed in more reliably:</p>
            <ul className="mt-2 list-disc space-y-2 ps-5">
              <li>Avoid Incognito / Private mode</li>
              <li>Allow cookies for tool2day.com</li>
              <li>Disable extensions that block cookies</li>
            </ul>
          </>
        ),
      },
      {
        id: "projects-shared",
        question:
          "Are projects shared between audio and video editors or apps on different domains?",
        answer: (
          <p>
            Projects are stored per tool/session in the browser and are not automatically shared
            across every Tool2Day tool. Data is kept separately for privacy and storage limits in
            the browser.
          </p>
        ),
      },
      {
        id: "project-other-computer",
        question:
          "Why is a project created on one computer not available or only partially available on another computer?",
        answer: (
          <>
            <p>
              Many Tool2Day tools process files in your browser. Projects/files may stay on that
              device unless sync is enabled for a signed-in plan.
            </p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>Sync may not have finished before you switched devices</li>
              <li>Free sessions may keep files only locally for a limited time</li>
              <li>Temporary server issues (rare)</li>
              <li>Unstable internet interrupting upload/sync</li>
            </ul>
          </>
        ),
      },
      {
        id: "timeline-missing",
        question:
          "Why is the video editor timeline missing or not showing my uploaded files?",
        answer: (
          <>
            <p>This is often caused by an outdated browser.</p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>
                <strong>Update your browser</strong> to the latest Chrome, Firefox, Safari, or Edge.
              </li>
              <li>
                <strong>Windows 7 / 8:</strong> Chrome may stop updating past older versions. Prefer{" "}
                <strong>Firefox</strong>, which remains compatible with our video editor.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
];

function itemSearchText(item: FaqItem) {
  return `${item.question} ${item.id}`.toLowerCase();
}

export function HelpFaq() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("cancel-subscription");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            itemSearchText(item).includes(q) ||
            section.title.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <div dir="ltr" className="mx-auto w-full max-w-3xl px-4 py-12 text-left sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-[#111] sm:text-4xl">Help</h1>
      <p className="mt-2 text-[#666]">
        Answers for Tool2Day billing, accounts, and tools. Need more help?{" "}
        <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
          Contact us
        </Link>
        .
      </p>

      <label className="relative mt-8 block">
        <span className="sr-only">Search help</span>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-full border border-[#e5e5e5] bg-white py-3 pe-4 ps-10 text-[15px] text-[#222] outline-none ring-[#2563eb]/30 placeholder:text-[#999] focus:border-[#2563eb] focus:ring-2"
        />
      </label>

      <div className="mt-10 space-y-10">
        {filtered.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="mb-4 text-xl font-bold text-[#111]">{section.title}</h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const open = openId === item.id;
                return (
                  <li key={item.id} id={item.id} className="scroll-mt-24">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : item.id)}
                      className="flex w-full items-start gap-2.5 rounded-md px-1 py-3 text-start transition hover:bg-[#f7f7f7]"
                    >
                      <ChevronDown
                        className={`mt-0.5 h-4 w-4 shrink-0 text-[#444] transition-transform duration-200 ${
                          open ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <span className="text-[15px] font-bold leading-snug text-[#1a1a1a]">
                        {item.question}
                      </span>
                    </button>
                    {open ? (
                      <div className="mb-3 ms-6 rounded-xl bg-[#f3f4f6] px-4 py-4 text-[14px] leading-7 text-[#333] sm:px-5">
                        {item.answer}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {filtered.length === 0 ? (
          <p className="text-[#666]">
            No results. Try another keyword or{" "}
            <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
              contact support
            </Link>
            .
          </p>
        ) : null}
      </div>

      <p className="mt-12">
        <Link href="/" className="text-sm font-semibold text-[#2563eb] hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
