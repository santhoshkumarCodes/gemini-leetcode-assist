/* eslint-env browser */
(function () {
  const MONACO_WAIT_TIMEOUT = 15000; // 15 seconds
  const DEBOUNCE_DELAY = 750; // 750ms

  // --- Debounce utility ---
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- Communication with content script ---
  const postCodeUpdate = debounce((code) => {
    window.postMessage({ type: "CODE_UPDATE", code: code || "" }, "*");
  }, DEBOUNCE_DELAY);

  function getCode() {
    if (typeof window.monaco === "undefined") return null;

    const models = window.monaco.editor.getModels();
    if (!models || models.length === 0) return null;

    // Find the model that is not the diff editor and has substantial content
    let mainModel = models.find((model) => {
      const uri = model.uri.toString();
      return !uri.startsWith("inmemory:") && model.getValueLength() > 0;
    });

    // Fallback to the longest code if the above logic fails
    if (!mainModel) {
      mainModel = models.reduce((prev, current) =>
        prev.getValueLength() > current.getValueLength() ? prev : current,
      );
    }

    return mainModel?.getValue() || null;
  }

  function setupListeners() {
    if (typeof window.monaco === "undefined") return;

    const onContentChange = () => {
      const currentCode = getCode();
      postCodeUpdate(currentCode);
    };

    // Listen to existing models
    window.monaco.editor.getModels().forEach((model) => {
      model.onDidChangeContent(onContentChange);
    });

    // Listen to newly created models
    window.monaco.editor.onDidCreateModel((model) => {
      model.onDidChangeContent(onContentChange);
    });

    // Send initial code state
    const initialCode = getCode();
    if (initialCode) {
      window.postMessage({ type: "CODE_UPDATE", code: initialCode }, "*");
    }
  }

  // --- Entry Point ---
  let retries = MONACO_WAIT_TIMEOUT / 100;
  const interval = setInterval(() => {
    if (
      typeof window.monaco !== "undefined" &&
      typeof window.monaco.editor.getModels === "function"
    ) {
      clearInterval(interval);

      setupListeners();
    } else if (--retries === 0) {
      clearInterval(interval);
    }
  }, 100);
})();
