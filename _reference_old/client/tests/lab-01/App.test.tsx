import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App.js";

describe("App (Lab 02 App Shell & Router)", () => {
  it("renders the TokTickIT application shell", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /TokTickIT Home/i })).toBeInTheDocument();
  });
});
