import { describe, expect, it, vi, beforeEach } from "vitest";
import { createProduct, updateProduct, restockProduct, ProductError } from "../../src/services/products.js";
import * as prismaModule from "../../src/prisma.js";

describe("Product Catalog Management unit tests (database-free)", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma);
  });

  describe("createProduct input boundaries & validation", () => {
    it("rejects empty or missing SKU", async () => {
      await expect(
        createProduct({ sku: "", name: "USB-C Cable", category: "Chargers & Power", price: 15.0 })
      ).rejects.toMatchObject({ code: "MISSING_FIELDS", status: 400 });

      await expect(
        createProduct({ sku: "   ", name: "USB-C Cable", category: "Chargers & Power", price: 15.0 })
      ).rejects.toMatchObject({ code: "MISSING_FIELDS", status: 400 });
    });

    it("rejects names shorter than 3 characters or longer than 100 characters", async () => {
      await expect(
        createProduct({ sku: "CBL-01", name: "AB", category: "Chargers & Power", price: 15.0 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });

      await expect(
        createProduct({ sku: "CBL-01", name: "X".repeat(101), category: "Chargers & Power", price: 15.0 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    });

    it("rejects missing or empty category", async () => {
      await expect(
        createProduct({ sku: "CBL-01", name: "Valid Cable", category: "   ", price: 15.0 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    });

    it("rejects negative or zero prices", async () => {
      await expect(
        createProduct({ sku: "CBL-01", name: "Valid Cable", category: "Chargers & Power", price: 0 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });

      await expect(
        createProduct({ sku: "CBL-01", name: "Valid Cable", category: "Chargers & Power", price: -10.5 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });

      await expect(
        createProduct({ sku: "CBL-01", name: "Valid Cable", category: "Chargers & Power", price: "abc" })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    });

    it("rejects negative stock quantities or non-integers", async () => {
      await expect(
        createProduct({ sku: "CBL-01", name: "Valid Cable", category: "Chargers & Power", price: 15.0, stockQuantity: -5 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });

      await expect(
        createProduct({ sku: "CBL-01", name: "Valid Cable", category: "Chargers & Power", price: 15.0, stockQuantity: 2.5 })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    });

    it("rejects duplicate SKU with 409 Conflict", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 1, sku: "PHON-PRO-256" });

      await expect(
        createProduct({ sku: "PHON-PRO-256", name: "Pro Smartphone", category: "Smartphones", price: 899.0 })
      ).rejects.toMatchObject({ code: "SKU_ALREADY_EXISTS", status: 409 });
    });

    it("persists product with uppercase trimmed SKU and formatted price when valid", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce(null);
      mockPrisma.product.create.mockResolvedValueOnce({
        id: 10,
        sku: "CHG-FAST-30W",
        name: "30W Fast Charger",
        category: "Chargers & Power",
        description: "Compact GaN charger",
        price: "29.99",
        stockQuantity: 50,
        isActive: true,
      });

      const result = await createProduct({
        sku: " chg-fast-30w ",
        name: " 30W Fast Charger ",
        category: " Chargers & Power ",
        description: " Compact GaN charger ",
        price: 29.99,
        stockQuantity: 50,
      });

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          sku: "CHG-FAST-30W",
          name: "30W Fast Charger",
          category: "Chargers & Power",
          description: "Compact GaN charger",
          price: "29.99",
          stockQuantity: 50,
          isActive: true,
        },
      });
      expect(result.sku).toBe("CHG-FAST-30W");
      expect(result.price).toBe("29.99");
    });
  });

  describe("updateProduct input boundaries & validation", () => {
    it("rejects invalid product ID", async () => {
      await expect(updateProduct(0, { name: "New Name" })).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });
    });

    it("returns 404 if product does not exist", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(updateProduct(999, { name: "New Name" })).rejects.toMatchObject({
        code: "PRODUCT_NOT_FOUND",
        status: 404,
      });
    });

    it("validates updated price if provided", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 1 });
      await expect(updateProduct(1, { price: -5 })).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
      });
    });

    it("updates fields and toggles isActive", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 1, name: "Old Name", isActive: true });
      mockPrisma.product.update.mockResolvedValueOnce({
        id: 1,
        name: "Updated Name",
        price: "79.00",
        isActive: false,
      });

      const result = await updateProduct(1, { name: "Updated Name", isActive: false });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "Updated Name", isActive: false },
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe("restockProduct input boundaries & atomic execution", () => {
    it("rejects non-positive or non-integer restock quantities", async () => {
      await expect(restockProduct(1, 0)).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
      await expect(restockProduct(1, -10)).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
      await expect(restockProduct(1, 2.5)).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    });

    it("returns 404 if product does not exist", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(restockProduct(999, 10)).rejects.toMatchObject({
        code: "PRODUCT_NOT_FOUND",
        status: 404,
      });
    });

    it("increments stockQuantity atomically and returns previous and new stock", async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce({
        id: 2,
        sku: "TAB-11",
        name: "Tablet 11",
        stockQuantity: 8,
      });
      mockPrisma.product.update.mockResolvedValueOnce({
        id: 2,
        sku: "TAB-11",
        name: "Tablet 11",
        stockQuantity: 18,
      });

      const result = await restockProduct(2, 10);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { stockQuantity: { increment: 10 } },
      });
      expect(result).toEqual({
        id: 2,
        sku: "TAB-11",
        name: "Tablet 11",
        previousStock: 8,
        restockedAmount: 10,
        newStock: 18,
      });
    });
  });
});
