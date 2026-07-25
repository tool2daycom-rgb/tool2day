/** Custom image icons for tools (overrides Lucide where set). */

export const toolImageIcons: Record<string, string> = {
  "pdf-editor": "/brand/tools/pdf-editor.png",
  "pdf-split": "/brand/tools/pdf-split.png",
  "pdf-merge": "/brand/tools/pdf-merge.png",
  "pdf-compress": "/brand/tools/pdf-compress.png",
  "pdf-unlock": "/brand/tools/pdf-unlock.png",
  "pdf-protect": "/brand/tools/pdf-protect.png",
  "pdf-page-numbers": "/brand/tools/pdf-page-numbers.png",
  "pdf-to-jpg": "/brand/tools/pdf-to-jpg.png",
};

export function getToolImageIcon(slug: string): string | null {
  return toolImageIcons[slug] ?? null;
}
