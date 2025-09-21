import { parseLeetCodeProblem } from "../../scripts/content-script/parser";

describe("parseLeetCodeProblem", () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = "";
  });

  it("should parse the LeetCode problem page correctly", async () => {
    // Set up the mock DOM
    document.body.innerHTML = `
      <div>
        <div class="text-title-large">1. Two Sum</div>
        <div class="elfjS">
          <div><p>Given an array of integers...</p></div>
          <div class="example">Example 1</div>
          <pre>Example 1 Content</pre>
          <ul><li>Constraint 1</li></ul>
        </div>
      </div>
    `;

    const problem = await parseLeetCodeProblem();

    expect(problem.title).toBe("1. Two Sum");
    expect(problem.description).toContain(
      "<p>Given an array of integers...</p>",
    );
    expect(problem.examples).toEqual(["Example 1 Content"]);
    expect(problem.constraints).toBe("<li>Constraint 1</li>");
  });

  it("should handle missing elements gracefully", async () => {
    // No DOM elements are present
    const problem = await parseLeetCodeProblem();

    expect(problem.title).toBe("");
    expect(problem.description).toBe("");
    expect(problem.examples).toEqual([]);
    expect(problem.constraints).toBe("");
  });

  it("should correctly parse a description that ends before the first example", async () => {
    document.body.innerHTML = `
      <div>
        <div class="elfjS">
          <p>Part 1 of description</p>
          <p>Part 2 of description</p>
          <div class="example">Example starts here</div>
          <p>This part should not be in the description</p>
        </div>
      </div>
    `;

    const problem = await parseLeetCodeProblem();

    expect(problem.description).toBe(
      "<p>Part 1 of description</p><p>Part 2 of description</p>",
    );
    expect(problem.description).not.toContain(
      "This part should not be in the description",
    );
  });
});
