import { formatProblemContext } from "@/utils/context";

describe("formatProblemContext", () => {
  const problemData = {
    title: "1. Two Sum",
    description:
      "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>",
    constraints:
      "<ul><li><code>2 <= nums.length <= 10<sup>4</sup></code></li><li><code>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></code></li><li><code>-10<sup>9</sup> <= target <= 10<sup>9</sup></code></li><li><strong>Only one valid answer exists.</strong></li></ul>",
    examples: [
      "<p><strong>Input:</strong> nums = [2,7,11,15], target = 9<br><strong>Output:</strong> [0,1]</p>",
    ],
    code: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
  };

  it("should format problem details correctly", () => {
    const selectedContexts = ["Problem Details"];
    const context = formatProblemContext(problemData, selectedContexts);
    expect(context).toContain("### Problem: 1. Two Sum");
    expect(context).toContain("#### Description");
    expect(context).toContain("Given an array of integers");
    expect(context).toContain("#### Constraints");
    expect(context).toContain("- 2 <= nums.length <= 10^4");
    expect(context).toContain("- -10^9 <= nums[i] <= 10^9");
    expect(context).toContain("- -10^9 <= target <= 10^9");
    expect(context).toContain("#### Examples");
    expect(context).toContain("Input: nums = [2,7,11,15], target = 9");
  });

  it("should format code correctly", () => {
    const selectedContexts = ["Code"];
    const context = formatProblemContext(problemData, selectedContexts);
    expect(context).toContain("#### Code");
    expect(context).toContain("class Solution");
  });

  it("should format both problem details and code correctly", () => {
    const selectedContexts = ["Problem Details", "Code"];
    const context = formatProblemContext(problemData, selectedContexts);
    expect(context).toContain("### Problem: 1. Two Sum");
    expect(context).toContain("#### Description");
    expect(context).toContain("#### Code");
    expect(context).toContain("class Solution");
  });

  it("should return an empty string if no contexts are selected", () => {
    const selectedContexts: string[] = [];
    const context = formatProblemContext(problemData, selectedContexts);
    expect(context).toBe("");
  });

  it("should handle complex sup elements correctly", () => {
    const problemDataWithComplexSup = {
      ...problemData,
      constraints: "<ul><li><code>x<sup>n+1</sup></code></li></ul>",
    };
    const selectedContexts = ["Problem Details"];
    const context = formatProblemContext(
      problemDataWithComplexSup,
      selectedContexts,
    );
    expect(context).toContain("- x^(n+1)");
  });
});
