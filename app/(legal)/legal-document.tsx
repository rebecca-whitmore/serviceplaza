import { readFileSync } from "node:fs";
import { join } from "node:path";
import styles from "./legal.module.css";

type Block = { kind: "heading" | "list" | "paragraph" | "updated"; text: string; id?: string };

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseDocument(source: string): Block[] {
  return source.replace(/\r/g, "").trim().split(/\n\s*\n/).map((raw) => raw.trim()).filter(Boolean).map((text) => {
    if (/^last updated:/i.test(text)) return { kind: "updated" as const, text };
    if (text.split("\n").every((line) => line.trim().startsWith("- "))) return { kind: "list" as const, text };
    if ((/^\d+\.\s+/.test(text) || /^About (this|these)/i.test(text)) && text.length < 100) return { kind: "heading" as const, text, id: slug(text) };
    return { kind: "paragraph" as const, text };
  });
}

function linkedText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s,)]+)/g);
  return parts.map((part, index) => /^https?:\/\//.test(part) ? <a href={part} key={`${part}-${index}`}>{part.replace(/^https?:\/\//, "")}</a> : part);
}

export function LegalDocument({ file, title, eyebrow, summary }: { file: "cookies.md" | "privacy.md" | "terms.md"; title: string; eyebrow: string; summary: string }) {
  const blocks = parseDocument(readFileSync(join(process.cwd(), "docs", file), "utf8"));
  const headings = blocks.filter((block) => block.kind === "heading");
  return <>
    <header className={styles.documentHeader}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{summary}</p></header>
    <div className={styles.documentLayout}>
      <aside className={styles.contents}><strong>On this page</strong><nav>{headings.map((heading) => <a href={`#${heading.id}`} key={heading.id}>{heading.text}</a>)}</nav></aside>
      <article className={styles.document}>
        {blocks.map((block, index) => block.kind === "heading" ? <h2 id={block.id} key={index}>{block.text}</h2>
          : block.kind === "list" ? <ul key={index}>{block.text.split("\n").map((line) => <li key={line}>{linkedText(line.replace(/^\s*-\s*/, ""))}</li>)}</ul>
          : block.kind === "updated" ? <p className={styles.updated} key={index}>{block.text}</p>
          : <p key={index}>{block.text.split("\n").map((line, lineIndex) => <span key={lineIndex}>{linkedText(line)}{lineIndex < block.text.split("\n").length - 1 ? <br/> : null}</span>)}</p>)}
      </article>
    </div>
  </>;
}
