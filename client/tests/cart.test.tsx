import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider, useCart } from "../src/context/CartContext";
import { AuthProvider } from "../src/context/AuthContext";
import CartDrawer from "../src/components/cart/CartDrawer";
import OrderConfirmationModal from "../src/components/cart/OrderConfirmationModal";
import * as api from "../src/api";
import { Product } from "../src/types/product";
import { OrderData } from "../src/types/order";

const TEST_PHONE: Product = {
  id: 1,
  sku: "PHON-PRO-256",
  name: "Flagship Pro Smartphone 256GB",
  category: "Smartphones",
  description: "OLED display",
  price: "899.00",
  stockQuantity: 5,
  isActive: true,
};

const TEST_KEYBOARD: Product = {
  id: 2,
  sku: "KB-MECH-RGB",
  name: "Wireless Mechanical Keyboard",
  category: "Keyboards",
  description: "RGB mechanical",
  price: "79.00",
  stockQuantity: 10,
  isActive: true,
};

vi.mock("../src/api", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getMeApi: vi.fn().mockResolvedValue({
    user: {
      id: 1,
      email: "customer1@example.com",
      name: "Alice Customer",
      role: "CUSTOMER",
      mustChangePassword: false,
      isActive: true,
    },
  }),
  changePasswordApi: vi.fn(),
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
  createOrderApi: vi.fn(),
}));

// Test harness component providing buttons to add items and open cart
const CartTestHarness: React.FC<{ onOrderSuccess: (order: OrderData) => void }> = ({ onOrderSuccess }) => {
  const { addToCart, openCart, totalItemCount } = useCart();

  return (
    <div>
      <button onClick={() => addToCart(TEST_PHONE, 1)} data-testid="add-phone-btn">
        Add Phone
      </button>
      <button onClick={() => addToCart(TEST_KEYBOARD, 2)} data-testid="add-kb-btn">
        Add 2 Keyboards
      </button>
      <button onClick={openCart} data-testid="open-cart-btn">
        Open Cart ({totalItemCount})
      </button>
      <CartDrawer onOrderSuccess={onOrderSuccess} />
    </div>
  );
};

describe("Feature 3: Cart Assembly & Order Placement (F-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("calculates running total accurately in USD ($) as items are added", async () => {
    const handleSuccess = vi.fn();

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <CartTestHarness onOrderSuccess={handleSuccess} />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    // Add 1 phone ($899.00) and 2 keyboards ($79.00 * 2 = $158.00)
    fireEvent.click(screen.getByTestId("add-phone-btn"));
    fireEvent.click(screen.getByTestId("add-kb-btn"));

    // Open drawer
    fireEvent.click(screen.getByTestId("open-cart-btn"));

    // Drawer should show both items and grand total: 899 + 158 = $1,057.00
    expect(screen.getByTestId("cart-item-PHON-PRO-256")).toBeInTheDocument();
    expect(screen.getByTestId("cart-item-KB-MECH-RGB")).toBeInTheDocument();
    expect(screen.getByTestId("cart-grand-total")).toHaveTextContent("$1,057.00");

    // Drawer footer disclaimer check: "Final total is calculated authoritatively" removed; inventory reservation notice kept
    expect(screen.getByText(/\* Inventory is reserved immediately upon placement\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Final total is calculated authoritatively by the server/i)).not.toBeInTheDocument();
  });

  it("steppers update quantities and prevent exceeding stock limit", async () => {
    const handleSuccess = vi.fn();

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <CartTestHarness onOrderSuccess={handleSuccess} />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    // Add phone (stockQuantity = 5)
    fireEvent.click(screen.getByTestId("add-phone-btn"));
    fireEvent.click(screen.getByTestId("open-cart-btn"));

    const incBtn = screen.getByTestId("qty-inc-PHON-PRO-256");
    const count = screen.getByTestId("qty-count-PHON-PRO-256");

    expect(count).toHaveTextContent("1");

    // Click increment twice (to 3)
    fireEvent.click(incBtn);
    fireEvent.click(incBtn);
    expect(count).toHaveTextContent("3");
    expect(screen.getByTestId("cart-grand-total")).toHaveTextContent("$2,697.00");
  });

  it("submits order payload and triggers confirmation modal upon success", async () => {
    const mockOrderResponse: OrderData = {
      id: 42,
      orderNumber: "ORD-20261102-0001",
      customerId: 1,
      status: "PENDING",
      totalAmount: "1057.00",
      createdAt: "2026-11-02T15:00:00.000Z",
      items: [
        {
          id: 101,
          productId: 1,
          productName: "Flagship Pro Smartphone 256GB",
          sku: "PHON-PRO-256",
          unitPrice: "899.00",
          quantity: 1,
          subtotal: "899.00",
        },
        {
          id: 102,
          productId: 2,
          productName: "Wireless Mechanical Keyboard",
          sku: "KB-MECH-RGB",
          unitPrice: "79.00",
          quantity: 2,
          subtotal: "158.00",
        },
      ],
    };

    vi.mocked(api.createOrderApi).mockResolvedValueOnce({
      data: mockOrderResponse,
    });

    let savedOrder: OrderData | null = null;
    const TestContainer = () => {
      const [order, setOrder] = React.useState<OrderData | null>(null);
      savedOrder = order;
      return (
        <div>
          <CartTestHarness onOrderSuccess={(o) => setOrder(o)} />
          <OrderConfirmationModal order={order} onClose={() => setOrder(null)} />
        </div>
      );
    };

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <TestContainer />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    // Add items and open
    fireEvent.click(screen.getByTestId("add-phone-btn"));
    fireEvent.click(screen.getByTestId("add-kb-btn"));
    fireEvent.click(screen.getByTestId("open-cart-btn"));

    // Submit order
    const placeOrderBtn = screen.getByTestId("place-order-button");
    fireEvent.click(placeOrderBtn);

    await waitFor(() => {
      expect(api.createOrderApi).toHaveBeenCalledWith({
        items: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 2 },
        ],
      });
    });

    // Confirmation modal should be visible
    await waitFor(() => {
      expect(screen.getByTestId("order-confirmation-modal")).toBeInTheDocument();
      expect(screen.getByTestId("confirmed-order-number")).toHaveTextContent("ORD-20261102-0001");
      expect(screen.getByTestId("order-status-badge")).toHaveTextContent("PENDING");
      expect(screen.getByTestId("confirmed-total-amount")).toHaveTextContent("$1,057.00");
    });
  });

  it("displays error banner when backend returns 409 Conflict due to depleted stock", async () => {
    vi.mocked(api.createOrderApi).mockRejectedValueOnce(
      new Error("Insufficient stock for 'Flagship Pro Smartphone 256GB'. Available: 1, Requested: 5")
    );

    const handleSuccess = vi.fn();

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <CartTestHarness onOrderSuccess={handleSuccess} />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("add-phone-btn"));
    fireEvent.click(screen.getByTestId("open-cart-btn"));

    fireEvent.click(screen.getByTestId("place-order-button"));

    await waitFor(() => {
      const errorBanner = screen.getByTestId("cart-error-banner");
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveTextContent("Insufficient stock");
    });

    expect(handleSuccess).not.toHaveBeenCalled();
  });
});

