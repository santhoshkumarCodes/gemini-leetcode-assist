import React from "react";

interface ReactMarkdownProps {
  children: string;
  remarkPlugins?: unknown[];
  components?: {
    code?: React.ComponentType<React.ReactNode>;
  };
}

const ReactMarkdown: React.FC<ReactMarkdownProps> = ({
  children,
  components,
}) => {
  const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  const parts = [];

  let match;
  while ((match = codeRegex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(children.substring(lastIndex, match.index));
    }
    if (components?.code) {
      const language = match[1];
      const code = match[2];
      const CodeComponent = components.code;
      parts.push(
        <CodeComponent key={lastIndex} className={`language-${language}`}>
          {code}
        </CodeComponent>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < children.length) {
    parts.push(children.substring(lastIndex));
  }

  return <div data-testid="react-markdown">{parts}</div>;
};

export default ReactMarkdown;
