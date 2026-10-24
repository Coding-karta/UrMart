import { useEffect, useMemo, useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "Sculpted Ceramic Vase",
    category: "Home Decor",
    price: 899,
    oldPrice: 1299,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=700&q=85",
    emoji: "🏺",
    color: "#e9dfd0",
    description: "A sculptural ceramic vase that brings warmth and character to your living space."
  },
  {
    id: 2,
    name: "Linen Cushion Cover",
    category: "Home Decor",
    price: 499,
    oldPrice: 699,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=85",
    emoji: "🛋️",
    color: "#d9cbb8",
    description: "Soft neutral-toned cushion covers for a relaxed, layered interior."
  },
  {
    id: 3,
    name: "Amber Table Lamp",
    category: "Lighting",
    price: 1499,
    oldPrice: 1999,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
    emoji: "💡",
    color: "#e8d8bd",
    description: "Create a cosy atmosphere with warm ambient lighting and timeless styling."
  },
  {
    id: 4,
    name: "Minimal Wall Clock",
    category: "Home Decor",
    price: 1099,
    oldPrice: 1499,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=700&q=85",
    emoji: "🕰️",
    color: "#d8d7c8",
    description: "A clean, understated clock designed to complement modern interiors."
  },
  {
    id: 5,
    name: "Stoneware Coffee Mug",
    category: "Kitchen",
    price: 349,
    oldPrice: 499,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=85",
    emoji: "☕",
    color: "#e5d5c3",
    description: "A tactile stoneware mug for slow mornings and your favourite daily brew."
  },
  {
    id: 6,
    name: "Pour-Over Coffee Set",
    category: "Kitchen",
    price: 1299,
    oldPrice: 1699,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=85",
    emoji: "☕",
    color: "#d9d1c2",
    description: "A thoughtfully styled coffee set for a more mindful morning ritual."
  },
  {
    id: 7,
    name: "Acacia Serving Board",
    category: "Kitchen",
    price: 799,
    oldPrice: 1099,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85",
    emoji: "🍽️",
    color: "#dfc39d",
    description: "Natural wood styling for serving snacks, bread and small gatherings."
  },
  {
    id: 8,
    name: "Ribbed Glass Bottle",
    category: "Kitchen",
    price: 399,
    oldPrice: 549,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=85",
    emoji: "🫙",
    color: "#dce5dc",
    description: "A reusable everyday bottle with a clean, minimal silhouette."
  },
  {
    id: 9,
    name: "Walnut Desk Organizer",
    category: "Workspace",
    price: 699,
    oldPrice: 999,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&q=85",
    emoji: "🗂️",
    color: "#d7c2a7",
    description: "Keep everyday essentials organised with a warm, natural desk aesthetic."
  },
  {
    id: 10,
    name: "Hardcover Journal",
    category: "Workspace",
    price: 299,
    oldPrice: 449,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=85",
    emoji: "📓",
    color: "#d9d5c8",
    description: "A simple journal for plans, reflections, sketches and fresh ideas."
  },
  {
    id: 11,
    name: "Desk Companion Lamp",
    category: "Workspace",
    price: 1199,
    oldPrice: 1599,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
    emoji: "💡",
    color: "#e9ddc9",
    description: "A focused glow for reading, studying and long work sessions."
  },
  {
    id: 12,
    name: "Canvas Storage Basket",
    category: "Workspace",
    price: 549,
    oldPrice: 749,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1593085260707-5377ba37f868?auto=format&fit=crop&w=700&q=85",
    emoji: "🧺",
    color: "#e2d4bf",
    description: "A versatile storage basket for keeping small spaces tidy."
  },
  {
    id: 13,
    name: "Botanical Reed Diffuser",
    category: "Wellness",
    price: 649,
    oldPrice: 899,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=85",
    emoji: "🌿",
    color: "#dce2d1",
    description: "A fragrance-inspired home accessory for a calm, welcoming atmosphere."
  },
  {
    id: 14,
    name: "Daily Skincare Essentials",
    category: "Wellness",
    price: 999,
    oldPrice: 1399,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85",
    emoji: "🧴",
    color: "#ead8d0",
    description: "A curated skincare-themed set for a simple daily self-care ritual."
  },
  {
    id: 15,
    name: "Cotton Bath Towel",
    category: "Wellness",
    price: 599,
    oldPrice: 799,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=700&q=85",
    emoji: "🛁",
    color: "#e4ded2",
    description: "Soft neutral styling for a clean and comfortable bathroom."
  },
  {
    id: 16,
    name: "Self-Care Gift Box",
    category: "Wellness",
    price: 1199,
    oldPrice: 1599,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=85",
    emoji: "🎁",
    color: "#e6d4ca",
    description: "A thoughtful gift concept for birthdays, celebrations and everyday appreciation."
  },
  {
    id: 17,
    name: "Weekend Canvas Tote",
    category: "Travel",
    price: 799,
    oldPrice: 1099,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=85",
    emoji: "👜",
    color: "#ded3c1",
    description: "A versatile carryall for errands, casual outings and weekend plans."
  },
  {
    id: 18,
    name: "Travel Packing Cubes",
    category: "Travel",
    price: 699,
    oldPrice: 999,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85",
    emoji: "🧳",
    color: "#d7ded1",
    description: "Keep clothing and travel essentials neatly organised in your luggage."
  },
  {
    id: 19,
    name: "Insulated Travel Tumbler",
    category: "Travel",
    price: 599,
    oldPrice: 849,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=700&q=85",
    emoji: "🥤",
    color: "#d5dfd7",
    description: "A practical reusable tumbler for commutes and everyday adventures."
  },
  {
    id: 20,
    name: "Everyday Travel Backpack",
    category: "Travel",
    price: 1699,
    oldPrice: 2299,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=700&q=85",
    emoji: "🎒",
    color: "#d8d2c5",
    description: "A versatile backpack for daily commutes, short trips and everyday essentials."
  }
];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function ProductImage({ product, className = "product-photo" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="image-fallback" role="img" aria-label={product.name}>
        {product.emoji}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function App() {
  const [cart, setCart] = useState(() => readStorage("shop-cart", []));
  const [wishlist, setWishlist] = useState(() => readStorage("shop-wishlist", []));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [notice, setNotice] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! 👋 Welcome to UrMart. Ask me about products, shipping, returns or payments."
    }
  ]);

  useEffect(() => {
    localStorage.setItem("shop-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("shop-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const visibleProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesText = `${p.name} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return (
        matchesText &&
        (category === "All" || p.category === category) &&
        (!wishlistOnly || wishlist.includes(p.id))
      );
    });

    if (sort === "low") result.sort((a, b) => a.price - b.price);
    if (sort === "high") result.sort((a, b) => b.price - a.price);
    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [query, category, sort, wishlist, wishlistOnly]);

  const getQuantity = (id) => cart.find((item) => item.id === id)?.qty || 0;
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  function changeQty(id, amount) {
    setCart((old) => {
      const existing = old.find((item) => item.id === id);

      if (!existing) {
        return amount > 0 ? [...old, { id, qty: amount }] : old;
      }

      return old
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + amount } : item
        )
        .filter((item) => item.qty > 0);
    });
  }

  function addToCart(id) {
    changeQty(id, 1);
    setNotice("Added to your cart ✓");
    window.setTimeout(() => setNotice(""), 2000);
  }

  function removeFromCart(id) {
    setCart((old) => old.filter((item) => item.id !== id));
  }

  function toggleWishlist(id) {
    setWishlist((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id]
    );
  }

  function goHome() {
    setPage("home");
    setSelectedProduct(null);
    setWishlistOnly(false);
    setQuery("");
    setCategory("All");
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function QuantityControl({ productId }) {
    const qty = getQuantity(productId);

    if (qty === 0) {
      return (
        <button className="add-button" onClick={() => addToCart(productId)}>
          + Add to cart
        </button>
      );
    }

    return (
      <div className="product-quantity">
        <button onClick={() => changeQty(productId, -1)} aria-label="Decrease quantity">−</button>
        <span>{qty} in cart</span>
        <button onClick={() => changeQty(productId, 1)} aria-label="Increase quantity">+</button>
      </div>
    );
  }

  function askBot(text) {
    const value = text.trim();
    if (!value) return;

    const lower = value.toLowerCase();
    let answer;

    if (lower.includes("return") || lower.includes("refund")) {
      answer = "Our demo store has a sample 7-day return policy. No actual return requests are processed.";
    } else if (lower.includes("shipping") || lower.includes("delivery")) {
      answer = "Standard demo delivery is estimated at 3–5 business days. Actual shipping is not configured.";
    } else if (lower.includes("payment") || lower.includes("pay")) {
      answer = "This demo does not accept real payments. Please don't enter payment details.";
    } else if (lower.includes("track") || lower.includes("order status")) {
      answer = "Order tracking isn't enabled because this demo has no order database.";
    } else if (lower.includes("cart")) {
      answer = `Your cart contains ${cartCount} items worth ${money(subtotal)}.`;
    } else if (lower.includes("price") || lower.includes("cheap") || lower.includes("budget")) {
      answer = "Budget picks: " + [...products]
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
        .map((p) => `${p.name} (${money(p.price)})`)
        .join(", ");
    } else if (lower.includes("contact") || lower.includes("help")) {
      answer = "I can help you browse products, check your cart and answer common questions. Live support isn't connected.";
    } else {
      const match = products.find((p) => lower.includes(p.name.toLowerCase()));
      answer = match
        ? `${match.name} costs ${money(match.price)}. ${match.description}`
        : "I can help with products, shipping, returns, payments and your cart. Try one of the quick questions!";
    }

    setMessages((old) => [
      ...old,
      { from: "user", text: value },
      { from: "bot", text: answer }
    ]);
    setMessage("");
  }
    return (
    <div className="app">
      <div className="announcement">
        CONSIDERED FINDS FOR EVERYDAY LIVING · WELCOME TO URMART
      </div>

      <header className="navbar">
        <button className="brand" onClick={goHome}>
          <div className="brand-icon">
            <span className="brand-u">U</span>
            <span className="brand-r">R</span>
          </div>
          UrMart<span className="brand-dot">.</span>
        </button>

        <div className="nav-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage("home");
              setSelectedProduct(null);
            }}
            placeholder="Search for products..."
            aria-label="Search products"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="nav-actions">
          <button
            className={`nav-link ${wishlistOnly ? "active" : ""}`}
            onClick={() => {
              setWishlistOnly(!wishlistOnly);
              setPage("home");
              setSelectedProduct(null);
              setCartOpen(false);
            }}
          >
            ♡ <span>Wishlist</span>
            {wishlist.length > 0 && <small>{wishlist.length}</small>}
          </button>

          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
          >
            🛒 <span>Cart</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      <nav className="category-nav">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "category-active" : ""}
            onClick={() => {
              setCategory(item);
              setPage("home");
              setSelectedProduct(null);
              setCartOpen(false);
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {page === "home" &&
        !wishlistOnly &&
        !query &&
        category === "All" && (
          <section className="hero">
            <div className="hero-content">
              <span className="eyebrow">
                THOUGHTFULLY CHOSEN · EVERYDAY LIVING
              </span>

              <h1>
                Live well.
                <br />
                Choose better.
              </h1>

              <p>
                Considered essentials for your home, your routine,
                and everything in between.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Shop the collection <span>→</span>
              </button>

              <div className="hero-points">
                <span>✓ Curated products</span>
                <span>✓ Easy shopping</span>
              </div>
            </div>

            <div className="hero-art">
              <div className="hero-circle">
                <span className="hero-spark">✳</span>
                <span className="hero-emoji">🛍️</span>
                <span className="hero-float float-one">🎧</span>
                <span className="hero-float float-two">👟</span>
                <span className="hero-float float-three">⌚</span>
              </div>

              <div className="hero-note">
                A little joy, delivered.
              </div>
            </div>
          </section>
        )}

      {page === "home" && (
        <main className="main-content" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {wishlistOnly ? "YOUR COLLECTION" : "THE URMART EDIT"}
              </span>

              <h2>
                {wishlistOnly
                  ? "Your wishlist"
                  : query
                  ? "Search results"
                  : category === "All"
                  ? "Explore our collection"
                  : category + " collection"}
              </h2>

              <p>{visibleProducts.length} products to discover</p>
            </div>

            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  className="product-visual"
                  style={{ backgroundColor: product.color }}
                  onClick={() => openProduct(product)}
                  aria-label={`View ${product.name}`}
                >
                  <ProductImage product={product} />

                  <span className="discount-tag">
                    {Math.round(
                      (1 - product.price / product.oldPrice) * 100
                    )}
                    % OFF
                  </span>
                </button>

                <button
                  className={`heart-button ${
                    wishlist.includes(product.id) ? "hearted" : ""
                  }`}
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Toggle wishlist"
                >
                  {wishlist.includes(product.id) ? "♥" : "♡"}
                </button>

                <div className="product-info">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <button
                    className="product-name"
                    onClick={() => openProduct(product)}
                  >
                    {product.name}
                  </button>

                  <div className="rating">
                    ★ {product.rating} <span>(Demo rating)</span>
                  </div>

                  <div className="price-row">
                    <strong>{money(product.price)}</strong>
                    <del>{money(product.oldPrice)}</del>
                  </div>

                  <QuantityControl productId={product.id} />
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <div className="empty-state">
              <span>🔎</span>
              <h3>No products found</h3>
              <p>Try another search or explore all products.</p>

              <button className="primary-button" onClick={goHome}>
                View all products
              </button>
            </div>
          )}

          <section className="benefits">
            <div>
              <span>📦</span>
              <div>
                <b>Easy shopping</b>
                <p>Browse our demo collection</p>
              </div>
            </div>

            <div>
              <span>💬</span>
              <div>
                <b>Helpful assistant</b>
                <p>Quick answers to common questions</p>
              </div>
            </div>

            <div>
              <span>🔒</span>
              <div>
                <b>Demo checkout</b>
                <p>No real payments are collected</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {page === "detail" && selectedProduct && (
        <div
          className="detail-overlay"
          onClick={() => setPage("home")}
        >
          <section
            className="detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setPage("home")}
              aria-label="Close details"
            >
              ×
            </button>

            <div
              className="detail-visual"
              style={{ backgroundColor: selectedProduct.color }}
            >
              <ProductImage product={selectedProduct} />
            </div>

            <div className="detail-info">
              <span className="eyebrow">
                {selectedProduct.category}
              </span>

              <h2>{selectedProduct.name}</h2>

              <div className="rating">
                ★ {selectedProduct.rating} <span>Demo rating</span>
              </div>

              <div className="detail-price">
                {money(selectedProduct.price)}
              </div>

              <p>{selectedProduct.description}</p>

              <p className="detail-note">
                Demo product. Actual stock and delivery are not connected.
              </p>

              <QuantityControl productId={selectedProduct.id} />
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">YOUR SELECTION</span>
                <h2>Shopping cart ({cartCount})</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setCartOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="cart-items">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.id);
                if (!product) return null;

                return (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-image">
                      <ProductImage
                        product={product}
                        className="cart-photo"
                      />
                    </div>

                    <div className="cart-item-info">
                      <h3>{product.name}</h3>
                      <p>{money(product.price)}</p>

                      <div className="cart-quantity">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                        >
                          −
                        </button>

                        <span>{item.qty}</span>

                        <button
                          onClick={() => changeQty(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      className="remove-item"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${product.name}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="empty-cart">
                  <span>🛍️</span>
                  <h3>Your cart is waiting</h3>
                  <p>Find something you love in our collection.</p>

                  <button
                    className="primary-button"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue shopping
                  </button>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-summary">
                <div className="subtotal-row">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <p>Shipping and taxes are not included in this demo.</p>

                <button
                  className="checkout-button"
                  onClick={() => {
                    setCartOpen(false);
                    setPage("checkout");
                  }}
                >
                  Continue to checkout →
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
            {page === "checkout" && (
        <main className="checkout-page">
          <button className="back-button" onClick={goHome}>
            ← Continue shopping
          </button>

          <div className="checkout-card">
            <span className="eyebrow">ALMOST THERE</span>
            <h1>Checkout</h1>
            <p>
              This is a frontend demo. No real order or payment will be
              processed.
            </p>

            <div className="checkout-items">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.id);
                if (!product) return null;

                return (
                  <div className="checkout-item" key={item.id}>
                    <span>
                      {product.name} × {item.qty}
                    </span>
                    <strong>{money(product.price * item.qty)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="checkout-total">
              <span>Order total</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <button
              className="checkout-button"
              disabled={cart.length === 0}
              onClick={() => {
                setNotice("Demo order placed successfully! ✓");
                setCart([]);
                setPage("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.setTimeout(() => setNotice(""), 3000);
              }}
            >
              Place demo order
            </button>

            <p className="checkout-disclaimer">
              Demo only — no payment information is requested or stored.
            </p>
          </div>
        </main>
      )}

      {notice && <div className="toast-notice">{notice}</div>}

      <button
        className="chat-toggle"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label="Open shopping assistant"
      >
        {chatOpen ? "×" : "💬"}
      </button>

      {chatOpen && (
        <section className="chat-window">
          <div className="chat-header">
            <div>
              <span className="chat-status-dot" />
              <div>
                <strong>UrMart Assistant</strong>
                <small>Shopping help · Demo</small>
              </div>
            </div>

            <button onClick={() => setChatOpen(false)}>×</button>
          </div>

          <div className="chat-messages">
            {messages.map((item, index) => (
              <div
                key={`${index}-${item.from}`}
                className={`chat-message ${
                  item.from === "user" ? "user-message" : "bot-message"
                }`}
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="chat-quick-questions">
            <button onClick={() => askBot("What are your shipping times?")}>
              Shipping
            </button>
            <button onClick={() => askBot("What is your return policy?")}>
              Returns
            </button>
            <button onClick={() => askBot("Tell me about my cart")}>
              My cart
            </button>
          </div>

          <form
            className="chat-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              askBot(message);
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask us anything..."
              aria-label="Message assistant"
            />

            <button type="submit" aria-label="Send message">
              ↑
            </button>
          </form>
        </section>
      )}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <button className="brand" onClick={goHome}>
              <div className="brand-icon">
                <span className="brand-u">U</span>
                <span className="brand-r">R</span>
              </div>
              UrMart<span className="brand-dot">.</span>
            </button>

            <p>
              Considered essentials for everyday living.
              <br />
              Discover something that feels just right.
            </p>
          </div>

          <div className="footer-links">
            <strong>Explore</strong>
            <button onClick={goHome}>All products</button>
            <button
              onClick={() => {
                setCategory("Fashion");
                setPage("home");
                setWishlistOnly(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Fashion
            </button>
            <button
              onClick={() => {
                setCategory("Home");
                setPage("home");
                setWishlistOnly(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Home & living
            </button>
          </div>

          <div className="footer-links">
            <strong>Need help?</strong>
            <button onClick={() => setChatOpen(true)}>
              Shopping assistant
            </button>
            <button
              onClick={() => {
                setCartOpen(true);
                setPage("home");
              }}
            >
              Your cart
            </button>
            <button
              onClick={() => {
                setWishlistOnly(true);
                setPage("home");
                setSelectedProduct(null);
              }}
            >
              Your wishlist
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} UrMart. Demo storefront.</span>
          <span>Thoughtfully chosen, simply yours.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;