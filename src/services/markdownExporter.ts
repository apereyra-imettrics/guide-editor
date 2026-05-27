// Markdown Exporter Service
import { storage } from "./storage";
import { CollapsibleBlock, CollapsibleSection, CollapsibleSummary, CollapsibleContent } from "../components/Editor/extensions/CollapsibleExtension";
import { CalloutExtension } from "../components/Editor/extensions/CalloutExtension";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";

/**
 * Convert custom HTML nodes back to GitBook markdown syntax.
 */
function postprocessExportedMarkdown(md: string): string {
  // Callout
  md = md.replace(/<div\s+data-type="callout"\s+type="(.*?)"\s*>\s*([\s\S]*?)\s*<\/div>/g, (_, type, content) => {
    const style = type === "warning" ? "danger" : type; // GitBook uses "danger" for warnings
    return `{% hint style="${style}" %}\n${content.trim()}\n{% endhint %}`;
  });
  // Details / Collapsible
  md = md.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="collapsible-content">([\s\S]*?)<\/div>\s*<\/details>/g, (_, title, content) => {
    return `{% details title="${title.trim()}" %}\n${content.trim()}\n{% enddetails %}`;
  });
  // Parameter tables
  md = md.replace(/<div\s+data-type="parameter-table"\s+rows='([^']*)'[^>]*><\/div>/g, (_, rowsJson) => {
    try {
      const rows = JSON.parse(rowsJson.replace(/&amp;#39;/g, "'").replace(/&#39;/g, "'"));
      if (!Array.isArray(rows) || rows.length === 0) return "";
      const header = "| Parameter | Value | Type |";
      const separator = "|---|---|---|";
      const rowsMd = rows.map((r: any) => `| ${r.parameter} | ${r.value} | ${r.type} |`).join("\n");
      return `${header}\n${separator}\n${rowsMd}`;
    } catch {
      return "";
    }
  });
  return md.trim();
}

/**
 * Export a guide as markdown and return a Blob URL.
 */
export function exportGuideAsMarkdown(guideId: string): string | null {
  const guide = storage.getGuide(guideId);
  if (!guide) {
    console.warn('exportGuideAsMarkdown: guide not found', guideId);
    return null;
  }
  const editor = new Editor({
    extensions: [
      StarterKit,
      Image,
      CalloutExtension,
      CollapsibleBlock,
      CollapsibleSection,
      CollapsibleSummary,
      CollapsibleContent,
      Markdown.configure({ html: true, tightLists: true, linkify: true, breaks: true }),
    ],
    content: guide.content,
    editable: false,
  });
  let markdown = "";
  try {
    markdown = (editor.storage as any).markdown.getMarkdown();
  } catch (e) {
    console.error('exportGuideAsMarkdown: error generating markdown', e);
  }
  editor.destroy();
  markdown = postprocessExportedMarkdown(markdown);
  const blob = new Blob([markdown], { type: "text/markdown" });
  return URL.createObjectURL(blob);
}
