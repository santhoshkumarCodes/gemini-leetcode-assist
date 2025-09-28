
import { render, screen, fireEvent } from "@testing-library/react";
import MessageInput from "@/components/chat/MessageInput";

describe("MessageInput", () => {
    it("sends a message when the send button is clicked", () => {
        const mockOnSendMessage = jest.fn();

        render(<MessageInput onSendMessage={mockOnSendMessage} />);

        const inputElement = screen.getByRole("textbox");
        const sendButton = screen.getByRole("button");

        fireEvent.change(inputElement, { target: { value: "Hello, world!" } });
        fireEvent.click(sendButton);

        expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
        expect(mockOnSendMessage).toHaveBeenCalledWith("Hello, world!");
    });

    it("does not send empty messages", () => {
        const mockOnSendMessage = jest.fn();

        render(<MessageInput onSendMessage={mockOnSendMessage} />);

        const sendButton = screen.getByRole("button");

        fireEvent.click(sendButton);

        expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it("clears input after sending message", () => {
        const mockOnSendMessage = jest.fn();

        render(<MessageInput onSendMessage={mockOnSendMessage} />);

        const inputElement = screen.getByRole("textbox") as HTMLTextAreaElement;
        const sendButton = screen.getByRole("button");

        fireEvent.change(inputElement, { target: { value: "Test message" } });
        expect(inputElement.value).toBe("Test message");

        fireEvent.click(sendButton);

        expect(inputElement.value).toBe("");
    });

    it("sends message when Enter is pressed without Shift", () => {
        const mockOnSendMessage = jest.fn();

        render(<MessageInput onSendMessage={mockOnSendMessage} />);

        const inputElement = screen.getByRole("textbox");

        fireEvent.change(inputElement, { target: { value: "Enter message" } });
        fireEvent.keyDown(inputElement, { key: "Enter", shiftKey: false });

        expect(mockOnSendMessage).toHaveBeenCalledWith("Enter message");
    });

    it("does not send message when Shift+Enter is pressed", () => {
        const mockOnSendMessage = jest.fn();

        render(<MessageInput onSendMessage={mockOnSendMessage} />);

        const inputElement = screen.getByRole("textbox");

        fireEvent.change(inputElement, { target: { value: "Multiline message" } });
        fireEvent.keyDown(inputElement, { key: "Enter", shiftKey: true });

        expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
});
