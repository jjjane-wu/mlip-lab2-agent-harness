import { fireEvent, render, screen } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Home from "../pages/Home";
import Cart from "../pages/Cart";
import AuthProvider from "../context/AuthContext";
import CartProvider from "../context/CartContext";

function renderWithProviders(component) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>{component}</CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('testing setup', () => {
  it('can render a React component and query the DOM', () => {
    render(<h1>Hello</h1>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

describe("shopping cart", () => {
  it("adds a product and updates the item count and total price", () => {
    renderWithProviders(<Home />);

    fireEvent.click(screen.getAllByRole("button", { name: "Add to Cart" })[0]);

    renderWithProviders(<Cart />);

    expect(screen.getByText("Total Items: 1")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $89.99")).toBeInTheDocument();
  });

  it("increases and decreases a product quantity and recalculates totals", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          id: 1,
          name: "Wireless Headphones",
          price: 99.99,
          discount: 10,
          quantity: 1,
        },
      ]),
    );
    renderWithProviders(<Cart />);

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByText("Total Items: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $179.98")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(screen.getByText("Total Items: 1")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $89.99")).toBeInTheDocument();
  });

  it("removes an item from the cart", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          id: 1,
          name: "Wireless Headphones",
          price: 99.99,
          discount: 10,
          quantity: 1,
        },
      ]),
    );
    renderWithProviders(<Cart />);

    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });
});
