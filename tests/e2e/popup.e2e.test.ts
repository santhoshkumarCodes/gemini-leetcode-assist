import puppeteer, { Browser, Page } from "puppeteer";
import * as path from "path";

describe("E2E Tests", () => {
  let browser: Browser;
  let page: Page;
  let serviceWorker: puppeteer.WebWorker;

  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, "../../dist");
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
    page = await browser.newPage();
    const extensionTarget = await browser.waitForTarget(
      (target) => target.type() === "service_worker",
      { timeout: 10000 },
    );
    serviceWorker = await extensionTarget.worker();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  });

  it("should correctly extract problem data and store it in chrome storage", async () => {
    await page.goto("https://leetcode.com/problems/two-sum/");
    await page.waitForFunction(
      () => {
        const el = document.querySelector('script[src*="injected-script.js"]');
        return !el; // Wait until the injected script is removed (which happens on load)
      },
      { timeout: 10000 },
    );

    // Wait a bit for the async operations (parsing, message passing) to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const problemData = await serviceWorker.evaluate(() => {
      return new Promise<never>((resolve) => {
        chrome.storage.local.get("leetcode-problem-two-sum", (result) => {
          resolve(result["leetcode-problem-two-sum"]);
        });
      });
    });

    expect(problemData).toBeDefined();
    expect(problemData).toHaveProperty("title");
    expect(problemData.title).toContain("Two Sum");
    expect(problemData).toHaveProperty("code");
    expect(problemData).toHaveProperty("timestamp");
  });
});
