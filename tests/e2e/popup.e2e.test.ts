import puppeteer, { Browser, Page, WebWorker } from "puppeteer";
import * as path from "path";
import * as fs from "fs";

// Give these E2E tests more time on slower machines or CI
jest.setTimeout(120000);

describe("E2E Tests", () => {
  let browser: Browser;
  let page: Page;
  let serviceWorker: WebWorker;

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
    page = await browser.newPage();
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

    interface ProblemData {
      title: string;
      code: string;
      timestamp: number;
    }

    const problemData = await serviceWorker.evaluate(() => {
      return new Promise<ProblemData>((resolve) => {
        chrome.storage.local.get(
          "leetcode-problem-two-sum",
          (result: { [key: string]: ProblemData }) => {
            resolve(result["leetcode-problem-two-sum"]);
          },
        );
      });
    });

    expect(problemData).toBeDefined();
    expect(problemData).toHaveProperty("title");
    expect(problemData.title).toContain("Two Sum");
    expect(problemData).toHaveProperty("code");
    expect(problemData).toHaveProperty("timestamp");
  });
});
