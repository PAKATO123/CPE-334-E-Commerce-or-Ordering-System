import { afterEach, describe, expect, it, vi } from "vitest";
import { getOperatorOrdersApi, processOperatorOrderApi } from "../src/api";

afterEach(() => { vi.unstubAllGlobals(); });

describe("F-05 HTTP client contracts (mock fetch, no network)", () => {
  it("omits the filter for all orders and includes session credentials", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    expect(await getOperatorOrdersApi(undefined, controller.signal)).toEqual({ data: [] });
    expect(fetch).toHaveBeenCalledWith("/api/operator/orders", { credentials: "include", signal: controller.signal });
  });
  it("encodes a selected queue filter", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal("fetch", fetch);
    await getOperatorOrdersApi("REJECTED");
    expect(fetch).toHaveBeenCalledWith("/api/operator/orders?status=REJECTED", expect.objectContaining({ credentials: "include" }));
  });
  it("sends the terminal status as JSON with session credentials", async () => {
    const data = { id: 42, orderNumber: "ORD-20261105-0042", status: "ACCEPTED", updatedAt: "2026-11-05T01:00:00.000Z" };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data }) });
    vi.stubGlobal("fetch", fetch);
    expect(await processOperatorOrderApi(42, "ACCEPTED")).toEqual({ data });
    expect(fetch).toHaveBeenCalledWith("/api/operator/orders/42/status", {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: '{"status":"ACCEPTED"}',
    });
  });
  it("preserves a 409 status and domain code for conflict feedback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: { code: "ORDER_ALREADY_PROCESSED", message: "Already processed" } }) }));
    await expect(processOperatorOrderApi(42, "REJECTED")).rejects.toMatchObject({ status: 409, code: "ORDER_ALREADY_PROCESSED", message: "Already processed" });
  });
});
