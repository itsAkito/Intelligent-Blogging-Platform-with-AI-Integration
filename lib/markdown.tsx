import React from "react";

export function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdownBlocks(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let numberedBuffer: string[] = [];
  let checklistBuffer: { checked: boolean; text: string }[] = [];
  let tableBuffer: string[] = [];

  const flushTableBuffer = (key: string) => {
    if (tableBuffer.length < 2) {
      tableBuffer = [];
      return;
    }

    const rows = tableBuffer.map((row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
    );

    const header = rows[0] || [];
    const bodyRows = rows.slice(2);

    if (header.length === 0) {
      tableBuffer = [];
      return;
    }

    blocks.push(
      <div key={`${key}-table-wrap`} className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {header.map((cell, idx) => (
                <th
                  key={`${key}-th-${idx}`}
                  className="border border-outline-variant/30 bg-surface-container px-3 py-2 text-left"
                  dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={`${key}-tr-${rowIdx}`}>
                {row.map((cell, cellIdx) => (
                  <td
                    key={`${key}-td-${rowIdx}-${cellIdx}`}
                    className="border border-outline-variant/20 px-3 py-2"
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    tableBuffer = [];
  };

  const flushBuffers = (key: string) => {
    flushTableBuffer(key);

    if (bulletBuffer.length > 0) {
      blocks.push(
        <ul key={`${key}-bullets`} className="list-disc pl-6 my-4 space-y-1">
          {bulletBuffer.map((item, idx) => (
            <li key={`${key}-b-${idx}`} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
          ))}
        </ul>
      );
      bulletBuffer = [];
    }

    if (numberedBuffer.length > 0) {
      blocks.push(
        <ol key={`${key}-numbers`} className="list-decimal pl-6 my-4 space-y-1">
          {numberedBuffer.map((item, idx) => (
            <li key={`${key}-n-${idx}`} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
          ))}
        </ol>
      );
      numberedBuffer = [];
    }

    if (checklistBuffer.length > 0) {
      blocks.push(
        <ul key={`${key}-checklist`} className="list-none pl-1 my-4 space-y-2">
          {checklistBuffer.map((item, idx) => (
            <li key={`${key}-c-${idx}`} className="flex items-start gap-2">
              <input type="checkbox" checked={item.checked} readOnly className="mt-1" />
              <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item.text) }} />
            </li>
          ))}
        </ul>
      );
      checklistBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      bulletBuffer.push(trimmed.replace(/^-\s+/, ""));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      numberedBuffer.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    if (/^- \[( |x|X)\]\s+/.test(trimmed)) {
      checklistBuffer.push({
        checked: /^- \[(x|X)\]/.test(trimmed),
        text: trimmed.replace(/^- \[( |x|X)\]\s+/, ""),
      });
      return;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      tableBuffer.push(trimmed);
      return;
    }

    flushBuffers(`line-${index}`);

    if (!trimmed) return;

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${index}`}
          className="text-xl font-bold mt-6 mb-2"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed.replace(/^###\s+/, "")) }}
        />
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${index}`}
          className="text-2xl font-bold mt-7 mb-3"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed.replace(/^##\s+/, "")) }}
        />
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h1
          key={`h1-${index}`}
          className="text-3xl font-bold mt-8 mb-4"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed.replace(/^#\s+/, "")) }}
        />
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`q-${index}`}
          className="border-l-4 border-primary/40 pl-4 my-3 italic"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed.replace(/^>\s+/, "")) }}
        />
      );
      return;
    }

    if (trimmed.startsWith("```")) {
      const code = trimmed.replace(/```/g, "").trim();
      blocks.push(
        <pre key={`code-${index}`} className="bg-surface-container p-4 rounded-lg overflow-x-auto my-4">
          <code className="text-sm font-mono">{code}</code>
        </pre>
      );
      return;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${index}`} className="my-6 border-outline-variant/20" />);
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="my-3" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed) }} />
    );
  });

  flushBuffers("end");
  return blocks;
}
