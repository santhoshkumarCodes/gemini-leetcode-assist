import React from "react";

interface SyntaxHighlighterProps {
  children: string;
  language?: string;
  PreTag?: string;
  className?: string;
  [key: string]: unknown;
}

export const Prism: React.FC<SyntaxHighlighterProps> = ({
  children,
  language,
  className,
  PreTag,
  ...props
}) => {
  const CustomTag = PreTag || "pre";
  return (
    <CustomTag
      data-testid="syntax-highlighter"
      data-language={language}
      className={className}
      {...props}
    >
      <code>{children}</code>
    </CustomTag>
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
