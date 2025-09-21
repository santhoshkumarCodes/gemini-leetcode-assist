export async function parseLeetCodeProblem() {
  const title =
    document.querySelector(".text-title-large")?.textContent?.trim() || "";

  const contentNode = document.querySelector(".elfjS");

  let description = "";
  if (contentNode) {
    // Stop before the first example section
    for (const child of Array.from(contentNode.children)) {
      if (child.matches(".example") || child.querySelector(".example")) {
        break;
      }
      description += child.outerHTML;
    }
  }

  const examples = Array.from(contentNode?.querySelectorAll("pre") || []).map(
    (pre) => pre.textContent?.trim() || "",
  );

  const constraintsHeading = [
    ...(contentNode?.querySelectorAll("strong, b") ?? []),
  ].find((el) => el.textContent?.trim() === "Constraints:");
  const constraintsElement =
    constraintsHeading?.nextElementSibling ??
    constraintsHeading?.parentElement?.nextElementSibling;
  const constraints =
    constraintsElement?.tagName === "UL" ? constraintsElement.innerHTML : "";

  const result = {
    title,
    description,
    examples,
    constraints,
  };

  return result;
}
