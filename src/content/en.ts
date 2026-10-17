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
    why: "About us",
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
  why: {
    eyebrow: "About us",
    title: "Digital work, built around your business.",
    body: [
      "Tool2day is an independent digital studio for businesses that want a website or app shaped around their needs. I work directly with you, keep the process clear, and turn your ideas into a practical digital experience—without unnecessary complexity.",
      "From the first conversation to launch, you’ll know what we’re building and why. Have an idea in mind? Let’s talk about it.",
    ],
    cta: "Tell me about your project",
    imageAlt: "Portrait of the Tool2day founder",
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
    lead: "Send a short message — we will reply with the next steps.",
    note: "Your enquiry is stored securely. We will get back to you by email.",
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
    submit: "Send message",
    submitting: "Sending…",
    successMessage: "Thanks — your message was saved. We will reply soon.",
    errorMessage:
      "Your message could not be sent. Please try again or email support@tool2day.com.",
    privacyBefore: "I have read the ",
    privacyLink: "privacy policy",
    privacyAfter: " and agree to the processing of my details.",
    emailLabel: "Email",
  },
  footer: {
    blurb:
      "We design and build websites, apps and digital solutions for small businesses.",
    servicesTitle: "Services",
    companyTitle: "Company",
    websites: "Websites",
    webapps: "Web apps",
    mobile: "Mobile apps",
    hosting: "Hosting",
    about: "About us",
    projects: "Projects",
    contact: "Contact",
    imprint: "Imprint",
    privacy: "Privacy",
    cookies: "Cookie settings",
    rights: "Tool2day. All rights reserved.",
    whatsappAria: "Open WhatsApp",
  },
} satisfies Dictionary;
