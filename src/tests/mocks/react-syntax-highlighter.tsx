import React from "react";

interface SyntaxHighlighterProps {
  children: string;
  language?: string;
  style?: unknown;
  PreTag?: string;
  className?: string;
  [key: string]: unknown;
}

export const Prism: React.FC<SyntaxHighlighterProps> = ({
  children,
  language,
  className,
  ...props
}) => {
  return (
    <pre
      data-testid="syntax-highlighter"
      data-language={language}
      className={className}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
};

const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  children,
  language,
  className,
  ...props
}) => {
  return (
    <pre
      data-testid="syntax-highlighter"
      data-language={language}
      className={className}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
};

export default SyntaxHighlighter;
