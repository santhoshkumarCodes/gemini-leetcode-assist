import { convert } from "html-to-text";

interface ProblemDetails {
  title: string;
  description: string;
  constraints: string;
  examples: string[];
}

interface ProblemData extends ProblemDetails {
  code: string;
}

function htmlToText(html: string): string {
  return convert(html, {
    wordwrap: false,
    formatters: {
      supFormatter: (elem, walk, builder, _formatOptions) => {
        const supText = elem.children
          .map((child) => (child as { data: string }).data)
          .join("")
          .trim();
        if (supText) {
          if (/^\d$/.test(supText)) {
            builder.addInline(`^${supText}`);
          } else {
            builder.addInline(`^(${supText})`);
          }
        }
      },
      liFormatter: (elem, walk, builder, _formatOptions) => {
        builder.addInline("- ");
        walk(elem.children, builder);
        builder.addLineBreak();
      },
    },
    selectors: [
      { selector: "sup", format: "supFormatter" },
      {
        selector: "strong",
        format: "inline",
        options: { leading: "**", trailing: "**" },
      },
      {
        selector: "b",
        format: "inline",
        options: { leading: "**", trailing: "**" },
      },
      { selector: "li", format: "liFormatter" },
      {
        selector: "p",
        format: "block",
        options: { leading: "", trailing: "\n\n" },
      },
      { selector: "br", format: "block", options: { leading: "\n" } },
      { selector: "img", format: "skip" },
      { selector: "svg", format: "skip" },
      { selector: "a", format: "skip" },
      { selector: "i", format: "skip" },
      { selector: 'a[href*="/submissions/"]', format: "skip" },
    ],
  });
}

export function formatProblemContext(
  problemData: ProblemData,
  selectedContexts: string[],
): string {
  let context = "";
  const { code, ...problemDetails } = problemData;

  if (selectedContexts.includes("Problem Details")) {
    context += `### Problem: ${problemDetails.title}\n\n`;
    if (problemDetails.description) {
      context += `#### Description\n${htmlToText(
        problemDetails.description,
      )}\n\n`;
    }
    if (problemDetails.constraints) {
      context += `#### Constraints\n${htmlToText(
        problemDetails.constraints,
      )}\n\n`;
    }
    if (problemDetails.examples && problemDetails.examples.length > 0) {
      context += `#### Examples\n${problemDetails.examples
        .map((ex) => htmlToText(ex))
        .join("\n\n")}\n\n`;
    }
  }

  if (selectedContexts.includes("Code")) {
    context += `#### Code\n\
\
${code}\n\
\
\
\
`;
  }
  return context;
}
