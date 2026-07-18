import { ConvertSection } from "@/components/convert-section";
import { EditSection } from "@/components/edit-section";
import { Hero } from "@/components/hero";
import { ToolsSection } from "@/components/tools-section";

export default function Home() {
  return (
    <>
      <Hero />
      <ConvertSection />
      <EditSection />
      <ToolsSection />
    </>
  );
}
