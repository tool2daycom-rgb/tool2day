import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/content";
import type { WorkProject } from "@/content/work";

type Props = {
  locale: Locale;
  project: WorkProject;
};

export function WorkProjectCard({ locale, project }: Props) {
  return (
    <li className="work-card">
      <Link href={`/${locale}/work/${project.id}`} className="work-card-link">
        <div className="work-thumb">
          <Image
            src={project.image}
            alt=""
            width={1280}
            height={800}
            className="work-thumb-image"
          />
        </div>
        <div className="work-body">
          <h3>{project.domain}</h3>
          <p className="work-card-meta">{project.tags.join(" · ")}</p>
        </div>
      </Link>
    </li>
  );
}
