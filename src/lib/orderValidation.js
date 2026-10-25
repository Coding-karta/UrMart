import { products, COUPONS } from "../data/products.js";

/**
 * Authoritative Order Validation and Price Calculation Engine
 * 
 * Never trust prices, totals, discounts, or shipping calculated by the client.
 * This module authoritatively recalculates every figure using trusted catalog data.
 */

export function validateCartItems(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return { valid: false, error: "Your shopping bag is empty." };
  }

  const validatedItems = [];

  for (const item of cart) {
    if (!item || typeof item.id === "undefined") {
      return { valid: false, error: "Invalid item in cart." };
    }

    // Look up authoritative product from trusted catalog
    const product = products.find((p) => p.id === item.id);
    if (!product) {
      const msg = `Product ID ${item.id} not found in catalog.`;
      return { valid: false, error: msg, errors: [msg] };
    }

    // Validate quantity: must be an integer between 1 and 10
    const rawQty = Number(item.qty);
    if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 10) {
      const msg = `Invalid quantity for ${product.name}. Allowed: 1-10 units.`;
      return { valid: false, error: msg, errors: [msg] };
    }

    validatedItems.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price, // Authoritative price from catalog
      qty: rawQty
    });
  }

  return { valid: true, items: validatedItems, errors: [] };
}

export function calculateAuthoritativeTotals(validatedItems, couponCode = "") {
  // Authoritative Subtotal calculation
  const subtotal = validatedItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Authoritative Coupon Validation
  let validatedCoupon = null;
  let discountAmount = 0;

  if (couponCode && typeof couponCode === "string") {
    const cleanCode = couponCode.trim().toUpperCase();
    if (COUPONS[cleanCode]) {
      validatedCoupon = COUPONS[cleanCode];
      if (validatedCoupon.discountPercent > 0) {
        discountAmount = Math.round(subtotal * (validatedCoupon.discountPercent / 100));
      }
    }
  }

  // Authoritative Shipping Calculation
  // Free delivery for orders >= ₹499 or with FREESHIP coupon, otherwise ₹80 standard shipping
  const isFreeShipping = subtotal >= 499 || validatedCoupon?.freeShipping === true;
  const shippingFee = isFreeShipping ? 0 : 80;

  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return {
    subtotal,
    discount: discountAmount,
    discountAmount,
    coupon: validatedCoupon,
    couponCode: validatedCoupon?.code || null,
    shipping: shippingFee,
    shippingFee,
    total
  };
}

export function validateShippingAddress(address) {
  if (!address || typeof address !== "object") {
    return { valid: false, error: "Shipping address is required." };
  }

  const street = (address.street || "").trim();
  const city = (address.city || "").trim();
  const state = (address.state || "").trim();
  const pincode = (address.pincode || "").trim();

  if (street.length < 5 || street.length > 120) {
    return { valid: false, error: "Street address must be between 5 and 120 characters." };
  }

  if (city.length < 2 || city.length > 50) {
    return { valid: false, error: "City must be between 2 and 50 characters." };
  }

  if (state.length < 2 || state.length > 50) {
    return { valid: false, error: "State must be between 2 and 50 characters." };
  }

  // Indian 6-digit pincode check
  if (!/^\d{6}$/.test(pincode)) {
    return { valid: false, error: "Please enter a valid 6-digit postal pincode." };
  }

  return {
    valid: true,
    address: { street, city, state, pincode }
  };
}
