import type { Metadata } from "next";
import { VideoEditorWorkspace } from "@/components/video-editor-workspace";

export const metadata: Metadata = {
  title: "محرر الفيديو مجاناً",
  description:
    "محرر الفيديو مجاناً — تايملاين ومعاينة: قص، فصل صوت، سرعة، تدوير، قماش، نص وصور ثم تصدير. بدون علامة مائية على Tool2Day.",
  keywords: [
    "محرر الفيديو",
    "محرر الفيديو مجاناً",
    "محرر فيديو أونلاين",
    "أدوات الفيديو",
    "Tool2Day",
    "مجاناً",
    "بدون علامة مائية",
  ],
};

export default function VideoEditorPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <VideoEditorWorkspace fullscreen />
    </div>
  );
}
