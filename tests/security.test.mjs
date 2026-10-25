import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateCartItems,
  calculateAuthoritativeTotals,
  validateShippingAddress
} from "../src/lib/orderValidation.js";
import { products } from "../src/data/products.js";

describe("Security & Order Integrity Validation", () => {
  it("authoritatively validates genuine cart items and attaches catalog prices", () => {
    const rawCart = [
      { id: 1, qty: 1 },
      { id: 2, qty: 2 }
    ];

    const { valid, items, errors } = validateCartItems(rawCart);
    assert.equal(valid, true);
    assert.equal(items.length, 2);
    assert.equal(errors.length, 0);

    // Verify catalog pricing is locked in
    const p1 = products.find((p) => p.id === 1);
    const p2 = products.find((p) => p.id === 2);
    assert.equal(items[0].price, p1.price);
    assert.equal(items[1].price, p2.price);
  });

  it("detects and rejects tampered product IDs", () => {
    const maliciousCart = [
      { id: 999999, qty: 1 } // non-existent product
    ];

    const { valid, errors } = validateCartItems(maliciousCart);
    assert.equal(valid, false);
    assert.match(errors[0], /Product ID 999999 not found/);
  });

  it("rejects malicious or out-of-range quantities (e.g. negative, floats, >10)", () => {
    assert.equal(validateCartItems([{ id: 1, qty: -5 }]).valid, false);
    assert.equal(validateCartItems([{ id: 1, qty: 0 }]).valid, false);
    assert.equal(validateCartItems([{ id: 1, qty: 2.5 }]).valid, false);
    assert.equal(validateCartItems([{ id: 1, qty: 50 }]).valid, false);
  });

  it("computes authoritative totals and ignores client price overrides", () => {
    // Client attempts to pass a fake price of ₹1
    const tamperedCart = [
      { id: 1, qty: 1, price: 1 }
    ];
    const { items } = validateCartItems(tamperedCart);
    const totals = calculateAuthoritativeTotals(items, null);

    const actualP1 = products.find((p) => p.id === 1);
    assert.equal(totals.subtotal, actualP1.price); // Price must come from catalog (₹899), not client (₹1)
    assert.equal(totals.shipping, 0); // >= 499 is free shipping
    assert.equal(totals.total, actualP1.price);
  });

  it("applies legitimate coupons and rejects invalid or fabricated promo codes", () => {
    const items = [
      { id: 1, name: "Vase", price: 1000, qty: 1 }
    ];

    // WELCOME10 gives 10%
    const welcome10 = calculateAuthoritativeTotals(items, "welcome10");
    assert.equal(welcome10.discount, 100);
    assert.equal(welcome10.total, 900);
    assert.equal(welcome10.couponCode, "WELCOME10");

    // Invalid coupon gives 0 discount
    const invalid = calculateAuthoritativeTotals(items, "SUPER_HACKER_90_PERCENT");
    assert.equal(invalid.discount, 0);
    assert.equal(invalid.couponCode, null);
  });

  it("validates Indian 6-digit PIN codes and address structures", () => {
    const validAddress = {
      street: "42 Indiranagar 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038"
    };
    assert.equal(validateShippingAddress(validAddress).valid, true);

    const invalidPin = { ...validAddress, pincode: "01234" }; // invalid PIN
    assert.equal(validateShippingAddress(invalidPin).valid, false);

    const emptyStreet = { ...validAddress, street: "   " };
    assert.equal(validateShippingAddress(emptyStreet).valid, false);
  });
});
