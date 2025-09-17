# LeetCode Assist (Powered by Gemini)

[![CI](https://github.com/santhoshkumar/gemini-leetcode-assist/actions/workflows/ci.yml/badge.svg)](https://github.com/santhoshkumar/gemini-leetcode-assist/actions/workflows/ci.yml)

An AI-powered Chrome extension designed to enhance your LeetCode problem-solving experience.  
Built with **React, Redux, TypeScript, and TailwindCSS**, it integrates seamlessly with the LeetCode problem interface to provide **AI-powered hints, explanations, and interview-style assistance directly inside LeetCode using Gemini**.

---

## Features

- **Live AI Guidance** – Get instant explanations and insights while solving problems.
- **Interactive Interview Mode** – Practice by discussing your approach with the assistant, simulating real interview scenarios.
- **Problem-Specific Chat Help** – Ask context-aware questions tied to the exact problem you are working on.
- **Image Context Support** – Upload diagrams or screenshots to enhance your discussions.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- xvfb (for E2E testing)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/santhoshkumarCodes/gemini-leetcode-assist.git
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

```bash
npm run dev
```

This will start the Vite development server and watch for changes in the source files.

### Building the Extension

```bash
npm run build
```

This will create a `dist` directory with the production-ready extension files.

### Testing

#### Unit Tests

```bash
npm run test
```

This will run the unit tests using Jest.

#### E2E Tests

The E2E tests use Puppeteer to simulate user interactions in a real browser environment. They run in a headless browser using `xvfb`.

```bash
npm run test:e2e
```
