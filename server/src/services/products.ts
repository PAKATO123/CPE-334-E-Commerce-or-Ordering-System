import { getPrisma } from "../prisma.js";

export interface CreateProductInput {
  sku: string;
  name: string;
  category: string;
  description?: string;
  price: number | string;
  stockQuantity?: number;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  price?: number | string;
  stockQuantity?: number;
  isActive?: boolean;
}

export class ProductError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number = 400) {
    super(message);
    this.name = "ProductError";
    this.code = code;
    this.status = status;
  }
}

export async function createProduct(input: CreateProductInput) {
  const { sku, name, category, description, price, stockQuantity } = input;

  if (!sku || typeof sku !== "string" || !sku.trim()) {
    throw new ProductError("SKU is required.", "MISSING_FIELDS", 400);
  }

  const trimmedSku = sku.trim().toUpperCase();

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    throw new ProductError("Product name must be at least 3 characters long.", "VALIDATION_ERROR", 400);
  }

  if (name.trim().length > 100) {
    throw new ProductError("Product name cannot exceed 100 characters.", "VALIDATION_ERROR", 400);
  }

  if (!category || typeof category !== "string" || !category.trim()) {
    throw new ProductError("Category is required.", "VALIDATION_ERROR", 400);
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    throw new ProductError("Price must be a positive number greater than 0.", "VALIDATION_ERROR", 400);
  }

  const stock = stockQuantity !== undefined ? Number(stockQuantity) : 0;
  if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    throw new ProductError("Stock quantity must be a non-negative integer.", "VALIDATION_ERROR", 400);
  }

  const prisma = getPrisma();

  // Check unique SKU
  const existing = await prisma.product.findUnique({
    where: { sku: trimmedSku },
  });

  if (existing) {
    throw new ProductError(`A product with SKU '${trimmedSku}' already exists.`, "SKU_ALREADY_EXISTS", 409);
  }

  const created = await prisma.product.create({
    data: {
      sku: trimmedSku,
      name: name.trim(),
      category: category.trim(),
      description: description ? description.trim() : null,
      price: numPrice.toFixed(2),
      stockQuantity: stock,
      isActive: true,
    },
  });

  return {
    ...created,
    price: Number(created.price).toFixed(2),
  };
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  if (isNaN(id) || id <= 0) {
    throw new ProductError("Product ID must be a positive integer.", "INVALID_ID", 400);
  }

  const prisma = getPrisma();
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ProductError(`Product ID ${id} does not exist.`, "PRODUCT_NOT_FOUND", 404);
  }

  const dataToUpdate: any = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length < 3) {
      throw new ProductError("Product name must be at least 3 characters long.", "VALIDATION_ERROR", 400);
    }
    if (input.name.trim().length > 100) {
      throw new ProductError("Product name cannot exceed 100 characters.", "VALIDATION_ERROR", 400);
    }
    dataToUpdate.name = input.name.trim();
  }

  if (input.category !== undefined) {
    if (typeof input.category !== "string" || !input.category.trim()) {
      throw new ProductError("Category cannot be empty.", "VALIDATION_ERROR", 400);
    }
    dataToUpdate.category = input.category.trim();
  }

  if (input.description !== undefined) {
    dataToUpdate.description = input.description ? input.description.trim() : null;
  }

  if (input.price !== undefined) {
    const numPrice = Number(input.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      throw new ProductError("Price must be a positive number greater than 0.", "VALIDATION_ERROR", 400);
    }
    dataToUpdate.price = numPrice.toFixed(2);
  }

  if (input.stockQuantity !== undefined) {
    const stock = Number(input.stockQuantity);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      throw new ProductError("Stock quantity must be a non-negative integer.", "VALIDATION_ERROR", 400);
    }
    dataToUpdate.stockQuantity = stock;
  }

  if (input.isActive !== undefined) {
    if (typeof input.isActive !== "boolean") {
      throw new ProductError("isActive must be a boolean value.", "VALIDATION_ERROR", 400);
    }
    dataToUpdate.isActive = input.isActive;
  }

  const updated = await prisma.product.update({
    where: { id },
    data: dataToUpdate,
  });

  return {
    ...updated,
    price: Number(updated.price).toFixed(2),
  };
}

export async function restockProduct(id: number, quantity: number) {
  if (isNaN(id) || id <= 0) {
    throw new ProductError("Product ID must be a positive integer.", "INVALID_ID", 400);
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
    throw new ProductError("Restock quantity must be a positive integer.", "VALIDATION_ERROR", 400);
  }

  const prisma = getPrisma();
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ProductError(`Product ID ${id} does not exist.`, "PRODUCT_NOT_FOUND", 404);
  }

  const previousStock = existing.stockQuantity;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      stockQuantity: { increment: qty },
    },
  });

  return {
    id: updated.id,
    sku: updated.sku,
    name: updated.name,
    previousStock,
    restockedAmount: qty,
    newStock: updated.stockQuantity,
  };
}
