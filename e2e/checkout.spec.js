import { test, expect } from "@playwright/test";
import { getProducts } from "../src/data/products.js";

// Source of truth for expected money values: the same catalogue the app renders.
const products = getProducts();
const HEADPHONES = products.find((p) => p.name === "Wireless Headphones"); // 10% off
const SPEAKER = products.find((p) => p.name === "Bluetooth Speaker"); // no discount

const unitPrice = (product) =>
  product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

const money = (value) => `$${value.toFixed(2)}`;

const VALID_DETAILS = {
  address: "5000 Forbes Ave, Pittsburgh",
  phone: "4125551234",
  notes: "Leave at the front desk.",
};

async function signUp(page, { name, email, password }) {
  await page.goto("/auth");
  // The page renders two "Sign Up" controls: the mode toggle and the submit button.
  await page.getByRole("paragraph").getByRole("button", { name: "Sign Up" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.locator("form").getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL("/");
}

/** Adds a product from its details page, where "Add to Cart" is unambiguous. */
async function addToCart(page, product, times = 1) {
  await page.goto(`/products/${product.id}`);
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
  for (let i = 0; i < times; i++) {
    await page.getByRole("button", { name: "Add to Cart" }).click();
  }
}

const cartBadge = (page) => page.getByRole("link", { name: "Shopping Cart" }).locator("span");

test.describe("checkout workflow", () => {
  test("a logged-in user can place an order, and it clears the cart", async ({ page }) => {
    await signUp(page, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "secret123",
    });
    await addToCart(page, HEADPHONES, 2);
    await addToCart(page, SPEAKER, 1);

    const expectedItems = 3;
    const expectedTotal = unitPrice(HEADPHONES) * 2 + unitPrice(SPEAKER);

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: `Total Items: ${expectedItems}` })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `Total Price: ${money(expectedTotal)}` }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL("/checkout");

    // The order summary must agree with the cart before the order is placed.
    const totalRow = page.getByRole("row").filter({ hasText: "Total" });
    await expect(totalRow.getByRole("cell").nth(1)).toHaveText(String(expectedItems));
    await expect(totalRow.getByRole("cell").nth(2)).toHaveText(money(expectedTotal));
    await expect(page.getByRole("row").filter({ hasText: HEADPHONES.name })).toContainText("2");

    // Name and email are prefilled from the signed-in user.
    await expect(page.getByLabel("Name")).toHaveValue("Ada Lovelace");
    await expect(page.getByLabel("Email")).toHaveValue("ada@example.com");
    await page.getByLabel("Address").fill(VALID_DETAILS.address);
    await page.getByLabel("Phone").fill(VALID_DETAILS.phone);
    await page.getByLabel("Notes").fill(VALID_DETAILS.notes);
    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page.getByRole("heading", { name: "Order Complete!" })).toBeVisible();
    await expect(cartBadge(page)).toBeHidden();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });

  test("the success screen redirects back to the home page", async ({ page }) => {
    await signUp(page, { name: "Grace", email: "grace@example.com", password: "secret123" });
    await addToCart(page, SPEAKER);
    await page.goto("/checkout");
    await page.getByLabel("Address").fill(VALID_DETAILS.address);
    await page.getByLabel("Phone").fill(VALID_DETAILS.phone);
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page.getByRole("heading", { name: "Order Complete!" })).toBeVisible();

    // The app schedules a redirect 5s after completion.
    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();
  });

  test("a guest cannot place an order", async ({ page }) => {
    await addToCart(page, SPEAKER);

    await page.goto("/cart");
    await expect(page.getByRole("link", { name: "Checkout" })).toHaveCount(0);
    await expect(page.getByText("Please login to proceed with checkout.")).toBeVisible();

    // Navigating straight to /checkout must not expose a way to submit the order.
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Place Order" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "login" })).toBeVisible();
  });

  test("checkout with an empty cart redirects home instead of showing the form", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();
  });

  test("missing required details block the order", async ({ page }) => {
    await signUp(page, { name: "Alan Turing", email: "alan@example.com", password: "secret123" });
    await addToCart(page, SPEAKER);
    await page.goto("/checkout");

    await page.getByLabel("Name").fill("");
    await page.getByLabel("Email").fill("");
    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Address is required")).toBeVisible();
    await expect(page.getByText("Phone is required")).toBeVisible();

    // The order was not placed: still on the form, cart untouched.
    await expect(page.getByRole("heading", { name: "Order Complete!" })).toHaveCount(0);
    await expect(page).toHaveURL("/checkout");
    await expect(cartBadge(page)).toHaveText("1");
  });

  test("malformed email and phone values block the order", async ({ page }) => {
    await signUp(page, { name: "Katherine", email: "kj@example.com", password: "secret123" });
    await addToCart(page, SPEAKER);
    await page.goto("/checkout");

    // "user@example" satisfies the browser's native email check but not the app's pattern,
    // so the app's own validation is what we are exercising here.
    await page.getByLabel("Email").fill("user@example");
    await page.getByLabel("Address").fill(VALID_DETAILS.address);
    await page.getByLabel("Phone").fill("12345");
    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Please enter a valid 10-digit phone number")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Order Complete!" })).toHaveCount(0);
  });

  test("field length limits are enforced at their boundaries", async ({ page }) => {
    await signUp(page, { name: "Edsger", email: "edsger@example.com", password: "secret123" });
    await addToCart(page, SPEAKER);
    await page.goto("/checkout");

    await page.getByLabel("Name").fill("N"); // min length is 2
    await page.getByLabel("Address").fill(VALID_DETAILS.address);
    await page.getByLabel("Phone").fill(VALID_DETAILS.phone);
    await page.getByLabel("Notes").fill("x".repeat(201)); // max length is 200
    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
    await expect(page.getByText("Notes must be at most 200 characters")).toBeVisible();

    // Exactly at the limits, the same form succeeds.
    await page.getByLabel("Name").fill("Ed");
    await page.getByLabel("Notes").fill("x".repeat(200));
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page.getByRole("heading", { name: "Order Complete!" })).toBeVisible();
  });

  test("the cart survives a reload in the middle of checkout", async ({ page }) => {
    await signUp(page, { name: "Barbara", email: "barbara@example.com", password: "secret123" });
    await addToCart(page, HEADPHONES, 2);
    await page.goto("/checkout");
    await page.getByLabel("Address").fill(VALID_DETAILS.address);

    await page.reload();

    // The cart is persisted, so checkout is still reachable — the typed details are not.
    await expect(page).toHaveURL("/checkout");
    await expect(page.getByRole("row").filter({ hasText: HEADPHONES.name })).toContainText("2");
    await expect(page.getByLabel("Address")).toHaveValue("");

    await page.getByLabel("Address").fill(VALID_DETAILS.address);
    await page.getByLabel("Phone").fill(VALID_DETAILS.phone);
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page.getByRole("heading", { name: "Order Complete!" })).toBeVisible();
  });

  // KNOWN DEFECT: the order summary prints each line as price * quantity, ignoring the
  // product discount, while the Total row applies it (src/pages/Checkout.jsx vs
  // src/context/CartContext.jsx). A discounted line therefore does not match the total.
  // Marked test.fail() so the bug stays visible without patching the application.
  test.fail("order summary line prices apply the product discount", async ({ page }) => {
    await signUp(page, { name: "Lynn", email: "lynn@example.com", password: "secret123" });
    await addToCart(page, HEADPHONES);
    await page.goto("/checkout");

    const row = page.getByRole("row").filter({ hasText: HEADPHONES.name });
    await expect(row.getByRole("cell").nth(2)).toHaveText(money(unitPrice(HEADPHONES)));
  });
});
