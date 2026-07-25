/** Custom image icons for tools (overrides Lucide where set). */

export const toolImageIcons: Record<string, string> = {
  "pdf-editor": "/brand/tools/pdf-editor.png",
};

export function getToolImageIcon(slug: string): string | null {
  return toolImageIcons[slug] ?? null;
}
