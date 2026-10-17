import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/content";
import { getWorkCopy, type WorkProject } from "@/content/work";
import { Header } from "./Header";
import { SiteFooter } from "./SiteFooter";
import { WorkProjectCard } from "./WorkProjectCard";
import { getDictionary } from "@/content";

type Props = {
  locale: Locale;
  project: WorkProject;
};

export function WorkProjectPage({ locale, project }: Props) {
  const t = getDictionary(locale);
  const work = getWorkCopy(locale);
  const others = work.projects.filter((item) => item.id !== project.id);

  return (
    <>
      <Header locale={locale} t={t} />
      <main>
        <section className="project-hero">
          <div className="shell">
            <nav className="project-breadcrumb" aria-label="Breadcrumb">
              <Link href={`/${locale}`}>{work.breadcrumbHome}</Link>
              <span>/</span>
              <Link href={`/${locale}#work`}>{work.breadcrumbWork}</Link>
              <span>/</span>
              <span>{project.domain}</span>
            </nav>
            <h1>{project.title}</h1>
            <p className="project-hero-lead">{project.heroLead}</p>
            <ul className="project-tags">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <a
              className="btn btn-primary project-visit"
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {project.visitLabel}
              <span aria-hidden="true"> →</span>
            </a>

            <ul className="project-stats">
              {project.stats.map((stat) => (
                <li key={stat.label}>
                  <strong>{stat.label}</strong>
                  <p>{stat.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section project-preview-section">
          <div className="shell">
            <div className="project-browser">
              <div className="project-browser-bar" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <Image
                src={project.image}
                alt={`${project.title} preview`}
                width={1280}
                height={800}
                className="project-browser-image"
                priority
              />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell project-copy">
            <article>
              <h2>{project.situationTitle}</h2>
              <p>{project.situation}</p>
            </article>
            <article>
              <h2>{project.missionTitle}</h2>
              <p>{project.missionIntro}</p>
              <ul>
                {project.missionPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
            <article>
              <h2>{project.solutionTitle}</h2>
              <p>{project.solution}</p>
            </article>
            <article>
              <h2>{project.resultTitle}</h2>
              <p>{project.result}</p>
            </article>
          </div>
        </section>

        {others.length ? (
          <section className="section section-muted" aria-labelledby="other-projects">
            <div className="shell">
              <header className="section-head">
                <h2 id="other-projects">{work.otherTitle}</h2>
              </header>
              <ul className="work-grid work-grid-related">
                {others.map((item) => (
                  <WorkProjectCard key={item.id} locale={locale} project={item} />
                ))}
              </ul>
              <p className="project-back">
                <Link href={`/${locale}`}>{work.backHome}</Link>
              </p>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter locale={locale} t={t} />
    </>
  );
}
