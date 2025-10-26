import puppeteer, { Browser, Page, WebWorker } from "puppeteer";
import * as path from "path";
import * as fs from "fs";

// Give these E2E tests more time on slower machines or CI
jest.setTimeout(300000);

describe("Chat E2E", () => {
  let browser: Browser;
  let page: Page;
  let popupPage: Page;
  let serviceWorker: WebWorker;
  let extensionId: string;

  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, "../../dist");
    if (!fs.existsSync(extensionPath)) {
      throw new Error(
        `Extension build not found at ${extensionPath}. Run 'npm run build' before running E2E tests.`,
      );
    }
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-accelerated-2d-canvas",
        "--disable-dev-shm-usage",
        "--window-size=1920,1080",
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const extensionTarget = await browser.waitForTarget(
      (target) => target.type() === "service_worker",
      { timeout: 30000 },
    );
    const worker = await extensionTarget.worker();
    if (!worker) {
      throw new Error("Could not get service worker");
    }
    serviceWorker = worker;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await serviceWorker.evaluate(() => {
      chrome.storage.local.set({ apiKey: "test-api-key" });
    });

    // Open leetcode page
    page = await browser.newPage();
    await page.goto("https://leetcode.com/problems/two-sum/");
    // wait for content script to be ready on leetcode page
    await page.waitForSelector("#gemini-chat-root", { timeout: 30000 });

    const extensionUrl = serviceWorker.url();
    extensionId = new URL(extensionUrl).hostname;

    popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/index.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  // This hook ensures UI elements are present before each test without reloading pages.
  beforeEach(async () => {
    // Keep the chat window open between tests; don't reload the pages so the
    // already-opened chat window from the previous test can be reused.
    // Ensure the content script and popup are present.
    await page.waitForSelector("#gemini-chat-root", { timeout: 30000 });
    await popupPage.waitForSelector("button", { timeout: 5000 });
  });

  it("should open the chat window and send a message", async () => {
    await page.bringToFront();

    // Click the "Open Chat Window" button in the popup by finding it by text
    await popupPage.waitForSelector("button", { timeout: 5000 });
    const clicked = await popupPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) =>
        b.textContent?.includes("Open Chat Window"),
      );
      if (!btn) return false;
      (btn as HTMLButtonElement).click();
      return true;
    });
    if (!clicked) {
      throw new Error("Open Chat Window button not found");
    }

    // Wait for the chat window to be ready
    await page.waitForSelector("#gemini-chat-root");
    await page.waitForFunction(() =>
      document.body.textContent.includes("Hello, LeetCoder"),
    );

    // Type a message in the input
    await page.type("#gemini-chat-input", "Hello, Gemini!");

    // Wait for the send button to be visible
    await page.waitForSelector("#gemini-chat-send-button", { visible: true });

    // Click the send button
    await page.click("#gemini-chat-send-button");

    // Wait for the user message to appear in the chat
    await page.waitForSelector(".user-message");

    // Check that the user message is correct
    const userMessage = await page.$eval(
      ".user-message",
      (el) => el.textContent,
    );
    expect(userMessage).toBe("Hello, Gemini!");

    // Wait for the bot to respond
    await page.waitForSelector(".bot-message");

    // Check that the bot message is not empty
    const botMessage = await page.$eval(".bot-message", (el) => el.textContent);
    expect(botMessage).not.toBe("");
  });

  it("should allow context selection, model selection, and sending a message", async () => {
    await page.bringToFront();

    // Ensure the chat window is open; if it's already open from the previous
    // test, reuse it. Otherwise, click the popup button to open it.
    const chatExists = await page.$("#gemini-chat-root");
    if (!chatExists) {
      await popupPage.waitForSelector("button", { timeout: 5000 });
      const clickedPopup = await popupPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) =>
          b.textContent?.includes("Open Chat Window"),
        );
        if (!btn) return false;
        (btn as HTMLButtonElement).click();
        return true;
      });
      if (!clickedPopup) {
        throw new Error("Open Chat Window button not found in popup");
      }
      await page.waitForSelector("#gemini-chat-root", { timeout: 30000 });
    }

    // 1. Add and remove context
    // If a Code context already exists (because we're reusing the same chat
    // window), remove it first so the add/remove flow below is deterministic.
    const existingCode = await page.$("#context-label-Code");
    if (existingCode) {
      await page.click("button[aria-label='Remove Code']");
      await page.waitForFunction(
        () => !document.querySelector("#context-label-Code"),
      );
    }

    await page.waitForSelector("#gemini-chat-add-context-button", {
      visible: true,
    });
    await page.click("#gemini-chat-add-context-button");

    // Try to find the "Code" option in the add-context menu robustly. If not
    // found, include available button texts in the thrown error to help debug.
    const clickedCode = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => {
        const txt = b.textContent?.trim() || "";
        return txt === "Code" || txt.includes("Code");
      });
      if (!btn) return false;
      (btn as HTMLButtonElement).click();
      return true;
    });
    if (!clickedCode) {
      const available = await page.evaluate(() =>
        Array.from(document.querySelectorAll("button")).map((b) =>
          b.textContent?.trim(),
        ),
      );
      throw new Error(
        `Could not find Code button in add-context menu. Available buttons: ${available.join(", ")}`,
      );
    }

    await page.waitForSelector("#context-label-Code", { timeout: 30000 });
    await page.click("button[aria-label='Remove Code']");
    await page.waitForFunction(
      () => !document.querySelector("#context-label-Code"),
    );

    // 2. Select a model
    await page.click("#gemini-chat-model-selector-button");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) =>
        b.textContent?.includes("Gemini 2.5 Flash"),
      );
      if (btn) (btn as HTMLButtonElement).click();
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#gemini-chat-model-selector-button")
          ?.textContent === "Gemini 2.5 Flash",
    );

    // 3. Send a message
    await page.type("#gemini-chat-input", "Test message with context");
    await page.click("#gemini-chat-send-button");

    // 4. Verify message is sent and response is received
    await page.waitForSelector(".user-message");
    const userMessage = await page.$$eval(
      ".user-message",
      (els) => els[els.length - 1].textContent,
    );
    expect(userMessage).toBe("Test message with context");

    await page.waitForSelector(".bot-message");
    const botMessage = await page.$$eval(
      ".bot-message",
      (els) => els[els.length - 1].textContent,
    );
    expect(botMessage).not.toBe("");
  });
});
