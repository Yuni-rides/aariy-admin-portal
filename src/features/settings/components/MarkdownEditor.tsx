"use client";

import { useRef } from "react";
import { Bold, Heading2, Image as ImageIcon, Italic, Link2, List } from "lucide-react";
import { Textarea } from "@/components/ui/TextArea";

type MarkdownEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
};

type Action = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Wraps the selection, or prefixes each selected line when `line` is set. */
  before: string;
  after?: string;
  line?: boolean;
  /** Text inserted when nothing is selected. */
  sample: string;
};

const ACTIONS: Action[] = [
  { label: "Bold", icon: Bold, before: "**", after: "**", sample: "bold text" },
  { label: "Italic", icon: Italic, before: "*", after: "*", sample: "italic text" },
  { label: "Heading", icon: Heading2, before: "## ", line: true, sample: "Heading" },
  { label: "List", icon: List, before: "- ", line: true, sample: "List item" },
  { label: "Link", icon: Link2, before: "[", after: "](https://)", sample: "link text" },
  { label: "Image", icon: ImageIcon, before: "![", after: "](https://)", sample: "image description" },
];

/** Plain textarea with a Markdown toolbar (B, I, H2, List, Link, Image) like the design. */
export function MarkdownEditor({ id, value, onChange, placeholder, invalid }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const apply = (a: Action) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || a.sample;
    let insert: string;
    if (a.line) {
      insert = selected
        .split("\n")
        .map((l) => (l.startsWith(a.before) ? l : a.before + l))
        .join("\n");
      // Line formats need to start on their own line.
      if (start > 0 && value[start - 1] !== "\n") insert = "\n" + insert;
    } else {
      insert = a.before + selected + (a.after ?? "");
    }
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      // Select the sample (or the URL placeholder) so it can be typed over.
      const urlAt = a.after?.includes("https://") ? start + insert.length - 1 - "https://".length : -1;
      if (urlAt > 0) el.setSelectionRange(urlAt, urlAt + "https://".length);
      else {
        const s = start + insert.indexOf(selected);
        el.setSelectionRange(s, s + selected.length);
      }
    });
  };

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap gap-1.5 rounded-t-[10px] border border-b-0 border-input bg-background p-2"
      >
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            aria-label={a.label}
            title={a.label}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border bg-white text-muted-foreground hover:text-foreground"
            onClick={() => apply(a)}
          >
            <a.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <Textarea
        ref={ref}
        id={id}
        rows={12}
        className={`rounded-b-[10px] rounded-t-none bg-white font-mono text-[13px] leading-relaxed ${invalid ? "border-destructive" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
