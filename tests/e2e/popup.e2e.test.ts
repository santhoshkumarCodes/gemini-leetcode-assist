import puppeteer, { Browser, Page } from "puppeteer";
import * as path from "path";

describe("E2E Tests", () => {
  let browser: Browser;
  let page: Page;

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
  });

  afterAll(async () => {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  });

  it("should load the content script on a LeetCode problem page", async () => {
    await page.goto("https://leetcode.com/problems/two-sum/");
    const contentScriptLoaded = await page.evaluate(() => {
      return !!document.getElementById("gemini-leetcode-assist-loaded");
    });
    expect(contentScriptLoaded).toBe(true);
  });
});
