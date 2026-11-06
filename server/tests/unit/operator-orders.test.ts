import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { isFulfillmentStatus, isOperatorOrderStatus, parseOperatorOrderId, processOperatorOrder } from "../../src/services/operatorOrders.js";

describe("operator input boundaries (database-free)", () => {
  it.each(["1", "2147483647"])("accepts supported ID %s", value => expect(parseOperatorOrderId(value)).toBe(Number(value)));
  it.each(["0", "-1", "01", "1.5", "1e2", "12abc", " 1", "+1", "", "2147483648", "9007199254740993"])(
    "rejects malformed or out-of-range ID %s", value => expect(parseOperatorOrderId(value)).toBeUndefined()
  );
  it.each(["PENDING", "ACCEPTED", "REJECTED"])("permits queue status %s", value => expect(isOperatorOrderStatus(value)).toBe(true));
  it.each(["", "pending", "ALL", ["PENDING", "ACCEPTED"], {}, null, 1])("rejects queue status %j", value => expect(isOperatorOrderStatus(value)).toBe(false));
  it.each(["PENDING", "accepted", "", undefined, null, [], {}])("rejects fulfillment target %j", value => expect(isFulfillmentStatus(value)).toBe(false));
});

describe("operator transaction retries (mocked, not PostgreSQL verification)", () => {
  it("retries whole aborted transactions and returns only the committed result", async () => {
    const result = { id: 1, status: "REJECTED" };
    const transaction = vi.fn().mockRejectedValueOnce({ code: "P2034" }).mockResolvedValueOnce(result);
    const prisma = { $transaction: transaction } as unknown as Pick<PrismaClient, "$transaction">;
    expect(await processOperatorOrder(prisma, 1, "REJECTED")).toBe(result);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: "ReadCommitted" });
  });
  it("bounds repeated transaction conflicts", async () => {
    const transaction = vi.fn().mockRejectedValue({ code: "P2034" });
    const prisma = { $transaction: transaction } as unknown as Pick<PrismaClient, "$transaction">;
    await expect(processOperatorOrder(prisma, 1, "REJECTED")).rejects.toMatchObject({ statusCode: 409, code: "ORDER_PROCESSING_CONFLICT" });
    expect(transaction).toHaveBeenCalledTimes(3);
  });
  it("does not retry unrelated persistence failures", async () => {
    const failure = new Error("inventory update failed");
    const transaction = vi.fn().mockRejectedValue(failure);
    const prisma = { $transaction: transaction } as unknown as Pick<PrismaClient, "$transaction">;
    await expect(processOperatorOrder(prisma, 1, "REJECTED")).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
