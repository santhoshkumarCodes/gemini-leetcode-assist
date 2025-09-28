import React from 'react';

interface ReactMarkdownProps {
  children: string;
  remarkPlugins?: any[];
  components?: {
    [key: string]: React.ComponentType<any>;
  };
}

const ReactMarkdown: React.FC<ReactMarkdownProps> = ({ children }) => {
  return <div data-testid="react-markdown">{children}</div>;
};

export default ReactMarkdown;
