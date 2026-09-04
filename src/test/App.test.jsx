import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import MainLayout from "../layout/MainLayout";
import Home from "../pages/Home";
import Cart from "../pages/Cart";
import AuthProvider from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import CartProvider from "../context/CartContext";

// Renders the real Home and Cart routes inside the real layout, so the tests
// drive the cart the way a user does: click "Add to Cart" on a product card,
// then navigate to the cart page through the header link.
function renderShop() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="cart" element={<Cart />} />
            </Route>
          </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

// Product data the assertions below are derived from (src/data/products.js):
//   Wireless Headphones  $99.99, 10% off -> $89.99
//   Smartwatch          $149.99, 15% off -> $127.49
//   Bluetooth Speaker    $59.99, no discount
function addToCart(productName) {
  const card = screen.getByRole("heading", { name: productName }).closest("div.relative");
  fireEvent.click(within(card).getByRole("button", { name: "Add to Cart" }));
}

function goToCart() {
  fireEvent.click(screen.getByRole("link", { name: "Shopping Cart" }));
}

function goHome() {
  fireEvent.click(screen.getAllByRole("link", { name: "Home" })[0]);
}

// The row in the cart page that belongs to a given product.
function cartRow(productName) {
  return screen.getByRole("heading", { name: productName }).closest("div.flex.items-center");
}

function quantityOf(productName) {
  const row = cartRow(productName);
  return within(row).getByRole("button", { name: "Increase quantity" })
    .previousElementSibling.textContent;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("testing setup", () => {
  it("can render a React component and query the DOM", () => {
    render(<h1>Hello</h1>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("shopping cart", () => {
  it("starts empty", () => {
    renderShop();
    goToCart();

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.queryByText(/Total Items:/)).not.toBeInTheDocument();
  });

  it("adds a product to the cart and updates the item count and total price", () => {
    renderShop();
    addToCart("Wireless Headphones");
    goToCart();

    expect(cartRow("Wireless Headphones")).toBeInTheDocument();
    expect(quantityOf("Wireless Headphones")).toBe("1");
    expect(screen.getByText("Total Items: 1")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $89.99")).toBeInTheDocument();
  });

  it("adds the same product twice as one line item with quantity 2", () => {
    renderShop();
    addToCart("Wireless Headphones");
    addToCart("Wireless Headphones");
    goToCart();

    expect(screen.getAllByRole("heading", { name: "Wireless Headphones" })).toHaveLength(1);
    expect(quantityOf("Wireless Headphones")).toBe("2");
    expect(screen.getByText("Total Items: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $179.98")).toBeInTheDocument();
  });

  it("sums distinct products, applying each product's discount", () => {
    renderShop();
    addToCart("Wireless Headphones"); // $89.99 after 10% off
    addToCart("Bluetooth Speaker"); //   $59.99, no discount
    goToCart();

    expect(screen.getByText("Total Items: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $149.98")).toBeInTheDocument();
  });

  it("increases product quantity and recalculates the totals", () => {
    renderShop();
    addToCart("Smartwatch");
    goToCart();

    const row = cartRow("Smartwatch");
    fireEvent.click(within(row).getByRole("button", { name: "Increase quantity" }));

    expect(quantityOf("Smartwatch")).toBe("2");
    expect(screen.getByText("Total Items: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $254.98")).toBeInTheDocument(); // 2 x $127.49
  });

  it("decreases product quantity and recalculates the totals", () => {
    renderShop();
    addToCart("Wireless Headphones");
    addToCart("Wireless Headphones");
    addToCart("Wireless Headphones");
    goToCart();

    fireEvent.click(
      within(cartRow("Wireless Headphones")).getByRole("button", { name: "Decrease quantity" }),
    );

    expect(quantityOf("Wireless Headphones")).toBe("2");
    expect(screen.getByText("Total Items: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $179.98")).toBeInTheDocument();
  });

  it("drops the item when its quantity is decreased below one", () => {
    renderShop();
    addToCart("Wireless Headphones");
    goToCart();

    fireEvent.click(
      within(cartRow("Wireless Headphones")).getByRole("button", { name: "Decrease quantity" }),
    );

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("removes an item and leaves the rest of the cart intact", () => {
    renderShop();
    addToCart("Wireless Headphones");
    addToCart("Bluetooth Speaker");
    addToCart("Bluetooth Speaker");
    goToCart();

    fireEvent.click(
      within(cartRow("Wireless Headphones")).getByRole("button", { name: "Remove item" }),
    );

    expect(screen.queryByRole("heading", { name: "Wireless Headphones" })).not.toBeInTheDocument();
    expect(quantityOf("Bluetooth Speaker")).toBe("2");
    expect(screen.getByText("Total Items: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $119.98")).toBeInTheDocument();
  });

  it("removes an item with quantity greater than one in a single click", () => {
    renderShop();
    addToCart("Wireless Headphones");
    addToCart("Wireless Headphones");
    goToCart();

    fireEvent.click(
      within(cartRow("Wireless Headphones")).getByRole("button", { name: "Remove item" }),
    );

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("shows the running item count in the header badge", () => {
    renderShop();

    const header = screen.getByRole("banner");
    expect(within(header).queryByText("1")).not.toBeInTheDocument();

    addToCart("Wireless Headphones");
    expect(within(header).getByText("1")).toBeInTheDocument();

    addToCart("Smartwatch");
    expect(within(header).getByText("2")).toBeInTheDocument();
  });

  it("keeps the cart when navigating between pages", () => {
    renderShop();
    addToCart("Smartwatch");
    goToCart();
    goHome();
    goToCart();

    expect(quantityOf("Smartwatch")).toBe("1");
    expect(screen.getByText("Total Items: 1")).toBeInTheDocument();
    expect(screen.getByText("Total Price: $127.49")).toBeInTheDocument();
  });
});
