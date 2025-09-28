import { render, screen, fireEvent, act } from "@testing-library/react";
import CopyButton from "@/components/chat/CopyButton";

describe("CopyButton", () => {
  it("copies text to clipboard when clicked", async () => {
    const textToCopy = "console.log('Hello, world!');";
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    render(<CopyButton textToCopy={textToCopy} />);
    const copyButton = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(copyButton);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
  });
});
