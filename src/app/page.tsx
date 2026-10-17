import { redirect } from "next/navigation";
import { site } from "@/content";

export default function RootPage() {
  redirect(`/${site.defaultLocale}`);
}
