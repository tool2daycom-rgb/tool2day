import type { Dictionary } from "./de";

export const en = {
  meta: {
    title: "tool2day | Websites & apps for small businesses",
    description:
      "tool2day plans and builds websites, web apps and mobile apps for small businesses and local services — direct, clear, without big-agency detours.",
  },
  nav: {
    services: "Services",
    work: "Examples",
    why: "Why tool2day",
    process: "Process",
    contact: "Contact",
    cta: "Start a Project",
    langAria: "Choose language",
  },
  hero: {
    eyebrow: "Websites · Apps · Digital",
    title: "Digital presence that helps small businesses look clear and reach customers.",
    lead:
      "tool2day helps you show up online with websites and apps that fit your offer — practical, personal, and easy to work with.",
    primaryCta: "Start a Project",
    secondaryCta: "View services",
  },
  services: {
    eyebrow: "Services",
    title: "What tool2day builds with you",
    lead: "Clear service areas with plain language — easy to edit later.",
    items: [
      {
        id: "websites",
        label: "Websites",
        title: "Business websites",
        text: "Clear sites for local businesses and independents: home, services, contact — structured and mobile-friendly.",
      },
      {
        id: "webapps",
        label: "Web apps",
        title: "Web applications",
        text: "Lean apps for workflows, client areas or internal tools — shaped around your day-to-day, not generic templates.",
      },
      {
        id: "mobile",
        label: "Mobile",
        title: "Mobile apps",
        text: "Apps for iOS and Android when your service needs to work on the go — from idea to release.",
      },
      {
        id: "design",
        label: "Advisory",
        title: "Design & advisory",
        text: "We align goals, content and next steps before building what you do not need.",
      },
    ],
  },
  work: {
    eyebrow: "Examples",
    title: "Design concepts",
    lead:
      "Placeholders for real work. Until then, these are design concepts — not completed client projects.",
    conceptBadge: "Design concept",
    items: [
      {
        title: "Local studio — portfolio site",
        summary: "Calm one-pager structure for a creative studio with a clear path to contact.",
        href: "/en/start",
        tags: ["Website", "Concept"],
      },
      {
        title: "Neighbour shop — booking overview",
        summary: "Web-app concept for appointment overview and simple customer enquiries.",
        href: "/en/start",
        tags: ["Web app", "Concept"],
      },
      {
        title: "Field help — service app",
        summary: "Mobile-app concept for on-the-road work with a focus on clarity.",
        href: "/en/start",
        tags: ["Mobile", "Concept"],
      },
    ],
  },
  why: {
    eyebrow: "Why tool2day",
    title: "Direct, clear, tailored",
    lead: "tool2day is set up as an independent studio — close to the conversation, without unnecessary steps.",
    points: [
      {
        title: "Direct contact",
        text: "You talk with the person who plans and builds — short paths, clear answers.",
      },
      {
        title: "Clear scope",
        text: "We write down what is included and what is not, so collaboration stays readable.",
      },
      {
        title: "Fit-for-purpose solutions",
        text: "Content, structure and features follow your offer — not a one-size template.",
      },
      {
        title: "Simple process",
        text: "A few steps from first idea to launch, with optional support afterwards.",
      },
    ],
  },
  process: {
    eyebrow: "Process",
    title: "How we start together",
    lead: "Four clear steps — without fixed delivery promises.",
    steps: [
      {
        n: "01",
        title: "Intro conversation",
        text: "We clarify goal, audience and frame. Short and concrete.",
      },
      {
        n: "02",
        title: "Scope & proposal",
        text: "You receive a written proposal with services and conditions.",
      },
      {
        n: "03",
        title: "Design & build",
        text: "Design and development in close exchange — with checkpoints to review.",
      },
      {
        n: "04",
        title: "Launch & optional support",
        text: "Go-live and, if you want, later updates or guidance.",
      },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Tell us briefly about your idea",
    lead:
      "Send a message — replace the placeholders below with your real contact details before launch.",
    note: "The form opens your email app with a prepared message. There is no server-side sending yet.",
    fields: {
      name: "Name",
      email: "Email",
      service: "Service needed",
      message: "Message",
      serviceOptions: [
        "Website",
        "Web app",
        "Mobile app",
        "Design & advisory",
        "Not sure yet",
      ],
    },
    submit: "Prepare message",
    emailLabel: "Email",
  },
  footer: {
    blurb:
      "tool2day — independent studio for websites and apps. Personal, clear, practical.",
    navTitle: "Navigation",
    legalTitle: "Legal",
    imprint: "Imprint",
    privacy: "Privacy policy",
    legalHint: "Add real legal links before launching in Germany.",
    rights: "tool2day",
  },
} satisfies Dictionary;
