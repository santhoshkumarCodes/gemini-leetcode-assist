import puppeteer, { Browser, Page } from "puppeteer";
import * as path from "path";
import * as fs from "fs";

// Give these E2E tests more time on slower machines or CI
jest.setTimeout(300000);

describe("Chat E2E", () => {
  let browser: Browser;
  let page: Page;
  let popupPage: Page;
  let serviceWorker: puppeteer.WebWorker;

  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, "../../dist");
    if (!fs.existsSync(extensionPath)) {
      throw new Error(
        `Extension build not found at ${extensionPath}. Run 'npm run build' before running E2E tests.`,
      );
    }
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-accelerated-2d-canvas",
        "--disable-dev-shm-usage",
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const extensionTarget = await browser.waitForTarget(
      (target) => target.type() === "service_worker",
      { timeout: 30000 },
    );
    serviceWorker = await extensionTarget.worker();
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
    const extensionId = new URL(extensionUrl).hostname;

    popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/index.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should open the chat window and send a message", async () => {
    await page.bringToFront();

    // Click the "Open Chat Window" button in the popup by finding it by text
    await popupPage.waitForSelector("button", { timeout: 5000 });
    const clicked = await popupPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Open Chat Window"));
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
});
