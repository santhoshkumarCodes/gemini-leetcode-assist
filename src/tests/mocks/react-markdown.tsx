import React from "react";

interface ReactMarkdownProps {
  children: string;
  remarkPlugins?: unknown[];
  components?: {
    [key: string]: React.ComponentType<unknown>;
  };
}

const ReactMarkdown: React.FC<ReactMarkdownProps> = ({ children }) => {
  return <div data-testid="react-markdown">{children}</div>;
};

export default ReactMarkdown;
