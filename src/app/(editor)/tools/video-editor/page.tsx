import type { Metadata } from "next";
import { VideoEditorWorkspace } from "@/components/video-editor-workspace";
import { getToolKeywords } from "@/lib/seo-keywords";
import {
  buildLanguageAlternateMap,
  getLocalizedMetaDescription,
  getLocalizedMetaTitle,
} from "@/lib/seo-multilang";
import { getTool } from "@/lib/tools";

const tool = getTool("video-editor");

export const metadata: Metadata = {
  title: tool
    ? getLocalizedMetaTitle("video-editor", "en", tool.title)
    : "Video editor — Free online tool",
  description: tool
    ? getLocalizedMetaDescription("video-editor", "en", tool.title)
    : "Free online video editor — no watermark on Tool2Day.",
  keywords: tool ? getToolKeywords(tool) : ["video editor", "Tool2Day"],
  alternates: {
    canonical: "https://tool2day.com/tools/video-editor",
    languages: buildLanguageAlternateMap("/tools/video-editor"),
  },
};

export default function VideoEditorPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <VideoEditorWorkspace fullscreen />
    </div>
  );
}
