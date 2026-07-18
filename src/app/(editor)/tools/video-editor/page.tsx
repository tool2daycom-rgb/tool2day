import type { Metadata } from "next";
import { VideoEditorWorkspace } from "@/components/video-editor-workspace";

export const metadata: Metadata = {
  title: "محرر الفيديو",
  description:
    "محرر احترافي بتايملاين ومعاينة: قص، فصل صوت، سرعة، تدوير، قماش، نص وصور ثم تصدير.",
};

export default function VideoEditorPage() {
  return <VideoEditorWorkspace fullscreen />;
}
