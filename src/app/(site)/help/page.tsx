import type { Metadata } from "next";
import { HelpFaq } from "@/components/help-faq";

export const metadata: Metadata = {
  title: "Help | المساعدة",
  description:
    "Tool2Day help center — billing, account, and troubleshooting for video, audio, and PDF tools.",
};

export default function HelpPage() {
  return <HelpFaq />;
}
