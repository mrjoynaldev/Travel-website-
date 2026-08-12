// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ loading: false, user: { name: "Studio Administrator", email: "admin@example.test" }, logout: vi.fn() }),
}));

vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));

vi.mock("@/lib/trpc", () => ({
  trpc: { blog: { publication: { useQuery: () => ({ data: { name: "Northstar Review" } }) } } },
}));

describe("configurable publication identity", () => {
  it("renders the stored publication name in the Studio shell header", async () => {
    const { default: DashboardLayout } = await import("@/admin-site/components/DashboardLayout");
    render(React.createElement(DashboardLayout, null, React.createElement("div", null, "Studio content")));
    expect(screen.getByText("Northstar Review Studio")).toBeInTheDocument();
    expect(screen.queryByText("Fieldnote Studio")).not.toBeInTheDocument();
  });
});
