import puppeteer from "puppeteer";

describe("Chat E2E", () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto("https://leetcode.com/problems/two-sum/");
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should open the chat window and send a message", async () => {
    // Wait for the chat window to be injected
    await page.waitForSelector("#gemini-chat-window");

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
