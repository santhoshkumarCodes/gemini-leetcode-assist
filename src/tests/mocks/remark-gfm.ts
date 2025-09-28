// Minimal mock for remark-gfm used in tests
// Return a plugin function (no-op) so ReactMarkdown receives a valid value
const remarkGfm = () => {
  return () => {};
};

export default remarkGfm;
