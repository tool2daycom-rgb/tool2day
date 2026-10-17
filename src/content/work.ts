import type { Locale } from "./site";

export type WorkStat = { label: string; text: string };

export type WorkProject = {
  id: string;
  domain: string;
  href: string;
  image: string;
  tags: string[];
  title: string;
  summary: string;
  heroLead: string;
  visitLabel: string;
  stats: WorkStat[];
  situationTitle: string;
  situation: string;
  missionTitle: string;
  missionIntro: string;
  missionPoints: string[];
  solutionTitle: string;
  solution: string;
  resultTitle: string;
  result: string;
};

export type WorkCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  visitCta: string;
  otherTitle: string;
  backHome: string;
  breadcrumbHome: string;
  breadcrumbWork: string;
  projects: WorkProject[];
};

const de: WorkCopy = {
  eyebrow: "Beispiele",
  title: "Ausgewählte Projekte",
  lead: "Echte Umsetzungen für Unternehmen und Produkte — von der Website bis zur Web-App.",
  visitCta: "Webseite besuchen",
  otherTitle: "Weitere Projekte",
  backHome: "Zur Startseite",
  breadcrumbHome: "Startseite",
  breadcrumbWork: "Projekte",
  projects: [
    {
      id: "transpool24",
      domain: "transpool24.com",
      href: "https://www.transpool24.com/de",
      image: "/work/transpool24.png",
      tags: ["Website", "Logistik", "Buchung"],
      title: "TransPool24",
      summary:
        "Logistik- und Transportplattform aus Pforzheim mit Online-Buchung, Leistungsübersicht und Fahrernetzwerk.",
      heroLead:
        "Schnelle, transparente Transportaufträge online buchen — Efficiency oder Express, lokal verwurzelt und bundesweit vernetzt.",
      visitLabel: "Webseite besuchen",
      stats: [
        {
          label: "Online-Buchung",
          text: "Aufträge und Zahlungswege klar geführt.",
        },
        {
          label: "Zwei Optionen",
          text: "Efficiency und Express für unterschiedliche Zeitfenster.",
        },
        {
          label: "Region + DE",
          text: "Pforzheim als Basis, Transporte deutschlandweit.",
        },
      ],
      situationTitle: "Ausgangslage",
      situation:
        "TransPool24 brauchte einen digitalen Auftritt, der Transportaufträge verständlich erklärt und Besucher direkt zur Buchung führt — ohne Agentur-Overhead.",
      missionTitle: "Aufgabe",
      missionIntro: "Ziel war eine klare Plattform für Auftraggeber und Fahrer:",
      missionPoints: [
        "Leistungen und Preistransparenz verständlich darstellen",
        "Buchungswege für Efficiency und Express sichtbar machen",
        "Vertrauen durch lokale Verankerung und klare Kontaktwege aufbauen",
        "Mehrsprachige Grundlage für den deutschen Markt schaffen",
      ],
      solutionTitle: "Lösung",
      solution:
        "Umgesetzt wurde eine moderne Marketing- und Buchungswebsite mit klarer Struktur, Leistungsmodulen, Fahrerbereich und direkten Call-to-Actions — responsive und auf Conversion ausgelegt.",
      resultTitle: "Ergebnis",
      result:
        "Eine öffentliche Plattform, die Transporte erklärt, Buchungen anstößt und das Angebot von TransPool24 professionell sichtbar macht.",
    },
    {
      id: "myfixkit",
      domain: "myfixkit.com",
      href: "https://myfixkit.com/",
      image: "/work/myfixkit.png",
      tags: ["Web-App", "Marktplatz", "Anfragen"],
      title: "MyFixKit — صندوق العِدة",
      summary:
        "Marktplatz-App, mit der Haushalte in Syrien Handwerker finden und Angebote vergleichen können.",
      heroLead:
        "Anfragen in einer Minute erstellen, Angebote von geprüften Handwerkern erhalten und selbst entscheiden, mit wem Kontakt aufgenommen wird.",
      visitLabel: "Webseite besuchen",
      stats: [
        {
          label: "Anfragen",
          text: "Kostenlos erstellen, ohne Verpflichtung.",
        },
        {
          label: "Privatsphäre",
          text: "Kontaktdaten erst nach Freigabe sichtbar.",
        },
        {
          label: "Regionen",
          text: "Start in Syrien nach Stadt und Viertel.",
        },
      ],
      situationTitle: "Ausgangslage",
      situation:
        "Haushalte und Handwerker brauchten einen vertrauenswürdigen digitalen Weg zueinander — ohne undurchsichtige Vermittlung und ohne falsche Versprechen.",
      missionTitle: "Aufgabe",
      missionIntro: "Die Plattform sollte:",
      missionPoints: [
        "Anfragen schnell und verständlich erfassen",
        "Handwerker nach Region und Gewerk zuordnen",
        "Bewertungen nur nach abgeschlossenen Aufträgen zeigen",
        "Kontaktfreigabe klar in der Hand der Nutzer lassen",
      ],
      solutionTitle: "Lösung",
      solution:
        "Gebaut wurde eine arabischsprachige Web-App mit Anfragefluss, Gewerkekatalog, regionaler Suche und klarer Vertrauenskommunikation — mobil zuerst gedacht.",
      resultTitle: "Ergebnis",
      result:
        "Ein lebendiger Marktplatz-Auftritt, der Anfragen und Angebote strukturiert und Vertrauen durch transparente Abläufe stärkt.",
    },
    {
      id: "clashanime",
      domain: "clashanime.com",
      href: "https://www.clashanime.com/blog/anime-news",
      image: "/work/clashanime.png",
      tags: ["Website", "Editorial", "Community"],
      title: "Clash Anime",
      summary:
        "Editorial-Hub und Community-Plattform mit Anime-News, Guides und mehrsprachigen Inhalten.",
      heroLead:
        "Aktuelle Anime-News und Guides — redaktionell aufbereitet, klar strukturiert und für die Community von ClashAnime gebündelt.",
      visitLabel: "Webseite besuchen",
      stats: [
        {
          label: "Editorial",
          text: "News und Guides in klarer Redaktionsstruktur.",
        },
        {
          label: "Mehrsprachig",
          text: "Inhalte für internationale Leserinnen und Leser.",
        },
        {
          label: "Community",
          text: "Anbindung an Arena-Guides und Plattforminhalte.",
        },
      ],
      situationTitle: "Ausgangslage",
      situation:
        "ClashAnime brauchte einen redaktionellen Bereich, der News und Guides sammelt und zur Community-Plattform passt — schnell erfassbar und regelmäßig aktualisierbar.",
      missionTitle: "Aufgabe",
      missionIntro: "Im Fokus standen:",
      missionPoints: [
        "Übersichtliche News- und Guide-Darstellung",
        "Klare Navigation zwischen Editorial und Community",
        "Lesbare Karten und Listen für viele Beiträge",
        "Eine Basis für laufende Content-Updates",
      ],
      solutionTitle: "Lösung",
      solution:
        "Umgesetzt wurde ein Editorial-Hub mit Listen, Tags, Top-News und Guide-Bereichen — modern, mobilfreundlich und auf Lesekomfort ausgelegt.",
      resultTitle: "Ergebnis",
      result:
        "Ein Content-Bereich, der Anime-News und Guides sichtbar macht und die Community mit frischen Inhalten versorgt.",
    },
    {
      id: "like2day",
      domain: "like2day.org",
      href: "https://www.like2day.org/",
      image: "/work/like2day.png",
      tags: ["Web-App", "Community", "Growth"],
      title: "Like2Day",
      summary:
        "Community-Plattform für organisches Social-Media-Wachstum über Austausch und Credits.",
      heroLead:
        "Sichtbarkeit durch echte Teilnahme: Credits verdienen, Inhalte promoten und Wachstum schrittweise messen — ohne Bot-Versprechen.",
      visitLabel: "Webseite besuchen",
      stats: [
        {
          label: "Exchange",
          text: "Teilnahme statt künstlicher Hype.",
        },
        {
          label: "Plattformen",
          text: "YouTube, TikTok, Instagram und weitere Netzwerke.",
        },
        {
          label: "Transparenz",
          text: "Klare Erwartungen für Creator und kleine Brands.",
        },
      ],
      situationTitle: "Ausgangslage",
      situation:
        "Like2Day wollte organische Reichweite für Creator erklären und nutzbar machen — mit echten Mitgliedern statt unrealistischer Versprechen.",
      missionTitle: "Aufgabe",
      missionIntro: "Die Seite sollte:",
      missionPoints: [
        "Das Exchange-Modell in drei Schritten erklären",
        "Unterstützte Netzwerke und Märkte sichtbar machen",
        "Vertrauen durch klare Grenzen und Nutzenversprechen aufbauen",
        "Zur Registrierung und Nutzung führen",
      ],
      solutionTitle: "Lösung",
      solution:
        "Entstanden ist eine englischsprachige Produktwebsite mit starkem Hero, How-it-works, Plattformübersicht und klaren CTAs — auf Conversion und Verständlichkeit ausgelegt.",
      resultTitle: "Ergebnis",
      result:
        "Ein Auftritt, der das Community-Modell von Like2Day klar kommuniziert und neue Mitglieder zur Teilnahme einlädt.",
    },
  ],
};

const en: WorkCopy = {
  eyebrow: "Examples",
  title: "Selected projects",
  lead: "Real builds for companies and products — from marketing sites to web apps.",
  visitCta: "Visit website",
  otherTitle: "Other projects",
  backHome: "Back to home",
  breadcrumbHome: "Home",
  breadcrumbWork: "Projects",
  projects: [
    {
      id: "transpool24",
      domain: "transpool24.com",
      href: "https://www.transpool24.com/de",
      image: "/work/transpool24.png",
      tags: ["Website", "Logistics", "Booking"],
      title: "TransPool24",
      summary:
        "Logistics and transport platform based in Pforzheim with online booking, service overview and driver network.",
      heroLead:
        "Book transport jobs online with clear pricing — Efficiency or Express, rooted locally and connected across Germany.",
      visitLabel: "Visit website",
      stats: [
        {
          label: "Online booking",
          text: "Orders and payment paths kept clear.",
        },
        {
          label: "Two options",
          text: "Efficiency and Express for different timelines.",
        },
        {
          label: "Region + DE",
          text: "Pforzheim base, nationwide transport reach.",
        },
      ],
      situationTitle: "Starting point",
      situation:
        "TransPool24 needed a digital presence that explains transport services and guides visitors straight to booking — without agency overhead.",
      missionTitle: "Brief",
      missionIntro: "The platform needed to:",
      missionPoints: [
        "Present services and pricing clearly",
        "Make Efficiency and Express booking paths visible",
        "Build trust through local roots and clear contact options",
        "Provide a solid German-market foundation",
      ],
      solutionTitle: "Solution",
      solution:
        "We delivered a modern marketing and booking site with clear structure, service modules, a driver area and direct CTAs — responsive and conversion-focused.",
      resultTitle: "Result",
      result:
        "A public platform that explains transports, starts bookings and presents TransPool24 professionally.",
    },
    {
      id: "myfixkit",
      domain: "myfixkit.com",
      href: "https://myfixkit.com/",
      image: "/work/myfixkit.png",
      tags: ["Web app", "Marketplace", "Requests"],
      title: "MyFixKit",
      summary:
        "Marketplace app that helps households in Syria find tradespeople and compare offers.",
      heroLead:
        "Create a request in a minute, receive offers from trusted tradespeople, and decide who can contact you.",
      visitLabel: "Visit website",
      stats: [
        {
          label: "Requests",
          text: "Create free requests with no obligation.",
        },
        {
          label: "Privacy",
          text: "Contact details stay private until approved.",
        },
        {
          label: "Regions",
          text: "Starting across cities and districts in Syria.",
        },
      ],
      situationTitle: "Starting point",
      situation:
        "Households and tradespeople needed a trustworthy digital path to each other — without opaque middlemen or inflated claims.",
      missionTitle: "Brief",
      missionIntro: "The platform needed to:",
      missionPoints: [
        "Capture requests quickly and clearly",
        "Match trades by region and craft",
        "Show reviews only after completed jobs",
        "Keep contact release under user control",
      ],
      solutionTitle: "Solution",
      solution:
        "We built an Arabic-first web app with request flow, trade catalogue, regional search and clear trust messaging — designed mobile-first.",
      resultTitle: "Result",
      result:
        "A marketplace presence that structures requests and offers while strengthening trust through transparent steps.",
    },
    {
      id: "clashanime",
      domain: "clashanime.com",
      href: "https://www.clashanime.com/blog/anime-news",
      image: "/work/clashanime.png",
      tags: ["Website", "Editorial", "Community"],
      title: "Clash Anime",
      summary:
        "Editorial hub and community platform with anime news, guides and multilingual content.",
      heroLead:
        "Latest anime news and guides — curated for the ClashAnime community in a clear, readable structure.",
      visitLabel: "Visit website",
      stats: [
        {
          label: "Editorial",
          text: "News and guides in a clear content structure.",
        },
        {
          label: "Multilingual",
          text: "Built for an international audience.",
        },
        {
          label: "Community",
          text: "Connected to arena guides and platform content.",
        },
      ],
      situationTitle: "Starting point",
      situation:
        "ClashAnime needed an editorial space that collects news and guides while fitting the community platform — scannable and easy to update.",
      missionTitle: "Brief",
      missionIntro: "The focus was on:",
      missionPoints: [
        "Clear news and guide presentation",
        "Navigation between editorial and community areas",
        "Readable cards and lists for many posts",
        "A base for ongoing content updates",
      ],
      solutionTitle: "Solution",
      solution:
        "We delivered an editorial hub with lists, tags, top news and guide areas — modern, mobile-friendly and comfortable to read.",
      resultTitle: "Result",
      result:
        "A content area that surfaces anime news and guides and keeps the community supplied with fresh material.",
    },
    {
      id: "like2day",
      domain: "like2day.org",
      href: "https://www.like2day.org/",
      image: "/work/like2day.png",
      tags: ["Web app", "Community", "Growth"],
      title: "Like2Day",
      summary:
        "Community platform for organic social growth through exchange and credits.",
      heroLead:
        "Visibility through real participation: earn credits, promote content and measure growth step by step — without bot promises.",
      visitLabel: "Visit website",
      stats: [
        {
          label: "Exchange",
          text: "Participation instead of artificial hype.",
        },
        {
          label: "Platforms",
          text: "YouTube, TikTok, Instagram and more networks.",
        },
        {
          label: "Transparency",
          text: "Clear expectations for creators and small brands.",
        },
      ],
      situationTitle: "Starting point",
      situation:
        "Like2Day wanted to explain and enable organic creator reach — with real members instead of unrealistic promises.",
      missionTitle: "Brief",
      missionIntro: "The site needed to:",
      missionPoints: [
        "Explain the exchange model in three steps",
        "Show supported networks and markets",
        "Build trust with clear boundaries and benefits",
        "Lead visitors to registration and use",
      ],
      solutionTitle: "Solution",
      solution:
        "We created an English product site with a strong hero, how-it-works, platform overview and clear CTAs — focused on clarity and conversion.",
      resultTitle: "Result",
      result:
        "A presence that communicates Like2Day’s community model clearly and invites new members to take part.",
    },
  ],
};

export function getWorkCopy(locale: Locale): WorkCopy {
  return locale === "de" ? de : en;
}

export function getWorkProject(locale: Locale, id: string): WorkProject | undefined {
  return getWorkCopy(locale).projects.find((project) => project.id === id);
}
