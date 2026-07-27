/** Custom image icons for tools (overrides Lucide where set). */

export const toolImageIcons: Record<string, string> = {
  "pdf-editor": "/brand/tools/pdf-editor.png",
  "pdf-split": "/brand/tools/pdf-split.png",
  "pdf-merge": "/brand/tools/pdf-merge.png",
  "pdf-compress": "/brand/tools/pdf-compress.png",
  "pdf-unlock": "/brand/tools/pdf-unlock.png",
  "pdf-protect": "/brand/tools/pdf-protect.png",
  "pdf-rotate": "/brand/tools/pdf-rotate.png",
  "pdf-page-numbers": "/brand/tools/pdf-page-numbers.png",
  "pdf-to-jpg": "/brand/tools/pdf-to-jpg.png",
  "pdf-to-word": "/brand/tools/pdf-to-word.png",
  "pdf-to-excel": "/brand/tools/pdf-to-excel.png",
  "pdf-to-png": "/brand/tools/pdf-to-png.png",
  "jpg-to-pdf": "/brand/tools/jpg-to-pdf.png",
  "excel-to-pdf": "/brand/tools/excel-to-pdf.png",
  "word-to-pdf": "/brand/tools/word-to-pdf.png",
  "ppt-to-pdf": "/brand/tools/ppt-to-pdf.png",
  "cv-builder": "/brand/tools/cv-builder.png",
  "fancy-text": "/brand/tools/fancy-text.png",
  "email-generator": "/brand/tools/email-generator.png",
  "css-generator": "/brand/tools/css-generator.png",
  "color-palette-extractor": "/brand/tools/color-palette-extractor.png",
  "color-converter": "/brand/tools/color-converter.png",
  "css-gradient-generator": "/brand/tools/css-gradient-generator.png",
  "calorie-calculator": "/brand/tools/calorie-calculator.png",
  "loan-calculator": "/brand/tools/loan-calculator.png",
  "crypto-calculator": "/brand/tools/crypto-calculator.png",
  "timezone-calculator": "/brand/tools/timezone-calculator.png",
  "currency-exchange": "/brand/tools/currency-exchange.png",
  "ai-ocr": "/brand/tools/ai-ocr.png",
  "ai-summarize": "/brand/tools/ai-summarize.png",
  "ai-remove-bg": "/brand/tools/ai-remove-bg.png",
  "ai-upscale": "/brand/tools/ai-upscale.png",
  "ai-erase": "/brand/tools/ai-erase.png",
  "png-library": "/brand/tools/png-library.png",
  "thumbnail-downloader": "/brand/tools/thumbnail-downloader.png",
};

export function getToolImageIcon(slug: string): string | null {
  return toolImageIcons[slug] ?? null;
}
