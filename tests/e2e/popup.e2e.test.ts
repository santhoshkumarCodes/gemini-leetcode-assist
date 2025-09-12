import puppeteer, { Browser } from "puppeteer";
import * as path from "path";

describe("E2E Tests", () => {
  let browser: Browser;

  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, "../../dist");
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should load the content script on a LeetCode problem page", async () => {
    const page = await browser.newPage();
    await page.goto("https://leetcode.com/problems/two-sum/");
    await page.waitForSelector("#gemini-leetcode-assist-loaded");
    const contentScriptLoaded = await page.evaluate(() => {
      return !!document.getElementById("gemini-leetcode-assist-loaded");
    });
    expect(contentScriptLoaded).toBe(true);
  });
});
