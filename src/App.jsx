
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const products = [
  {
    id: 1, name: "Wireless Headphones", category: "Electronics",
    price: 1999, oldPrice: 2999, rating: 4.8,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    emoji: "🎧", color: "#e6eaff",
    description: "Immersive sound and comfortable all-day listening."
  },
  {
    id: 2, name: "Smart Watch", category: "Electronics",
    price: 2499, oldPrice: 3499, rating: 4.6,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    emoji: "⌚", color: "#e1f4ed",
    description: "Track your activity and stay connected."
  },
  {
    id: 3, name: "Everyday Backpack", category: "Fashion",
    price: 1299, oldPrice: 1799, rating: 4.5,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    emoji: "🎒", color: "#fbe8dc",
    description: "A stylish, spacious backpack for everyday use."
  },
  {
    id: 4, name: "Running Sneakers", category: "Fashion",
    price: 2199, oldPrice: 2999, rating: 4.7,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    emoji: "👟", color: "#f5e7fa",
    description: "Lightweight sneakers for your daily adventures."
  },
  {
    id: 5, name: "Ceramic Coffee Mug", category: "Home",
    price: 399, oldPrice: 599, rating: 4.4,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80",
    emoji: "☕", color: "#faedce",
    description: "A minimalist mug for your favourite coffee."
  },
  {
    id: 6, name: "Desk Lamp", category: "Home",
    price: 899, oldPrice: 1299, rating: 4.6,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
    emoji: "💡", color: "#fff0cf",
    description: "Give your workspace a warm, focused glow."
  },
  {
    id: 7, name: "Skin Care Set", category: "Beauty",
    price: 799, oldPrice: 1099, rating: 4.3,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80",
    emoji: "🧴", color: "#f8dfe8",
    description: "A simple skincare routine for everyday care."
  },
  {
    id: 8, name: "Sunglasses", category: "Fashion",
    price: 699, oldPrice: 999, rating: 4.5,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
    emoji: "🕶️", color: "#e4edf4",
    description: "A versatile accessory for sunny days."
  },
  {
    id: 9, name: "Portable Speaker", category: "Electronics",
    price: 1599, oldPrice: 2299, rating: 4.7,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80",
    emoji: "🔊", color: "#e7e2fb",
    description: "Bring your favourite music wherever you go."
  },
  {
    id: 10, name: "Indoor Plant", category: "Home",
    price: 499, oldPrice: 699, rating: 4.6,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80",
    emoji: "🪴", color: "#e2f0dc",
    description: "Add a little green to your living space."
  },
  {
    id: 11, name: "Travel Bottle", category: "Lifestyle",
    price: 549, oldPrice: 799, rating: 4.4,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
    emoji: "🥤", color: "#dff1f5",
    description: "A reusable bottle for life on the go."
  },
  {
    id: 12, name: "Notebook Set", category: "Lifestyle",
    price: 299, oldPrice: 449, rating: 4.5,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&q=80",
    emoji: "📓", color: "#f8e6d8",
    description: "Keep your plans, notes and ideas together."
  }
  ,
  {
    id: 13, name: "Bluetooth Earbuds", category: "Electronics",
    price: 1299, oldPrice: 1899, rating: 4.5,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80",
    emoji: "🎧", color: "#e6eaff",
    description: "Compact wireless earbuds for music on the go."
  },
  {
    id: 14, name: "Mechanical Keyboard", category: "Electronics",
    price: 2299, oldPrice: 2999, rating: 4.7,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    emoji: "⌨️", color: "#e1e5f5",
    description: "A comfortable keyboard for work and gaming."
  },
  {
    id: 15, name: "Classic Wrist Watch", category: "Fashion",
    price: 1499, oldPrice: 2199, rating: 4.5,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
    emoji: "⌚", color: "#f5e7fa",
    description: "A timeless accessory for everyday outfits."
  },
  {
    id: 16, name: "Casual Denim Jacket", category: "Fashion",
    price: 1799, oldPrice: 2499, rating: 4.6,
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=600&q=80",
    emoji: "🧥", color: "#e5edf9",
    description: "A versatile layer for casual everyday wear."
  },
  {
    id: 17, name: "Decorative Cushion", category: "Home",
    price: 449, oldPrice: 699, rating: 4.4,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80",
    emoji: "🛋️", color: "#f8e6d8",
    description: "Add comfort and colour to your living room."
  },
  {
    id: 18, name: "Minimal Wall Clock", category: "Home",
    price: 799, oldPrice: 1199, rating: 4.3,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80",
    emoji: "🕒", color: "#faedce",
    description: "A simple accent for your home or office."
  },
  {
    id: 19, name: "Perfume Bottle", category: "Beauty",
    price: 999, oldPrice: 1499, rating: 4.5,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
    emoji: "🧴", color: "#f8dfe8",
    description: "A fragrance-inspired addition to your daily routine."
  },
  {
    id: 20, name: "Makeup Brush Set", category: "Beauty",
    price: 599, oldPrice: 899, rating: 4.4,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
    emoji: "💄", color: "#f8e3ec",
    description: "A handy brush collection for your beauty routine."
  },
  {
    id: 21, name: "Insulated Water Bottle", category: "Lifestyle",
    price: 649, oldPrice: 899, rating: 4.6,
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80",
    emoji: "🥤", color: "#dff1f5",
    description: "A reusable bottle for everyday hydration."
  },
  {
    id: 22, name: "Travel Backpack", category: "Lifestyle",
    price: 1899, oldPrice: 2599, rating: 4.7,
    image: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=600&q=80",
    emoji: "🎒", color: "#e2f0dc",
    description: "Carry your essentials for work and travel."
  },
  {
    id: 23, name: "Wireless Gaming Mouse", category: "Electronics",
    price: 1099, oldPrice: 1599, rating: 4.5,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80",
    emoji: "🖱️", color: "#e7e2fb",
    description: "A responsive mouse for productivity and gaming."
  },
  {
    id: 24, name: "Running Sports Shoes", category: "Fashion",
    price: 1999, oldPrice: 2799, rating: 4.6,
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=600&q=80",
    emoji: "👟", color: "#e4edf4",
    description: "Comfortable sports shoes for active days."
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
  const [cart, setCart] = useState(() =>
    readStorage("shop-cart", [])
  );
  const [wishlist, setWishlist] = useState(() =>
    readStorage("shop-wishlist", [])
  );
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

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category))
  ];

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

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    }
    if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    }
    if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [query, category, sort, wishlist, wishlistOnly]);

  const getQuantity = (id) =>
    cart.find((item) => item.id === id)?.qty || 0;

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty, 0
  );

  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  // All quantity buttons use this same function.
  function changeQty(id, amount) {
    setCart((old) => {
      const existing = old.find((item) => item.id === id);

      if (!existing) {
        return amount > 0
          ? [...old, { id, qty: amount }]
          : old;
      }

      return old
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty + amount }
            : item
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
        <button
          className="add-button"
          onClick={() => addToCart(productId)}
        >
          + Add to cart
        </button>
      );
    }

    return (
      <div className="product-quantity">
        <button
          onClick={() => changeQty(productId, -1)}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span>{qty} in cart</span>
        <button
          onClick={() => changeQty(productId, 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
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
    } else if (
      lower.includes("price") ||
      lower.includes("cheap") ||
      lower.includes("budget")
    ) {
      const cheapest = [...products]
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);

      answer = "Budget picks: " + cheapest
        .map((p) => `${p.name} (${money(p.price)})`)
        .join(", ");
    } else if (lower.includes("contact") || lower.includes("help")) {
      answer = "I can help you browse products, check your cart and answer common questions. Live support isn't connected.";
    } else {
      const match = products.find((p) =>
        lower.includes(p.name.toLowerCase())
      );

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
        ✨ Welcome to UrMart — discover something you love
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
                THE EVERYDAY COLLECTION
              </span>
              <h1>
                Good finds.
                <br />
                Great prices.
              </h1>
              <p>
                Discover everyday essentials and little things
                that make life better.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  document.getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore collection <span>→</span>
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
                {wishlistOnly
                  ? "YOUR COLLECTION"
                  : "HANDPICKED FOR YOU"}
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
                    )}% OFF
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
                Demo product. Actual stock and delivery
                are not connected.
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
                const product = products.find(
                  (p) => p.id === item.id
                );
                if (!product) return null;

                return (
                  <div className="cart-item" key={item.id}>
                    <div
                      className="cart-emoji"
                      style={{ backgroundColor: product.color }}
                    >
                      <ProductImage product={product} />
                    </div>

                    <div className="cart-item-info">
                      <b>{product.name}</b>
                      <strong>{money(product.price)}</strong>

                      <div className="quantity">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <button
                          className="remove-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="empty-state">
                  <span>🛒</span>
                  <h3>Your cart is empty</h3>
                  <p>Find something you love.</p>
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
                <div>
                  <span>Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>
                <div>
                  <span>Shipping</span>
                  <b>Demo only</b>
                </div>
                <div className="total-row">
                  <span>Total</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <button
                  className="primary-button checkout-button"
                  onClick={() => {
                    setCartOpen(false);
                    setPage("checkout");
                  }}
                >
                  Proceed to checkout →
                </button>

                <p className="demo-disclaimer">
                  Demo only. No real payment is accepted.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {page === "checkout" && (
        <div className="checkout-wrap">
          <section className="checkout-card">
            <span className="eyebrow">ALMOST THERE</span>
            <h2>Demo checkout</h2>
            <p>
              This is a frontend demonstration.
              No real order or payment will be processed.
            </p>

            <div className="checkout-total">
              <span>Cart total</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <button
              className="primary-button"
              disabled={cart.length === 0}
              onClick={() => {
                setCart([]);
                setPage("confirmation");
              }}
            >
              Simulate placing order
            </button>

            <button
              className="text-button"
              onClick={() => setCartOpen(true)}
            >
              Return to cart
            </button>
          </section>
        </div>
      )}

      {page === "confirmation" && (
        <div className="checkout-wrap">
          <section className="checkout-card confirmation">
            <span className="confirmation-icon">✓</span>
            <h2>Demo order completed!</h2>
            <p>
              This was a simulated checkout.
              No actual order was created or payment taken.
            </p>
            <button className="primary-button" onClick={goHome}>
              Continue shopping
            </button>
          </section>
        </div>
      )}

      <footer className="footer">
        <button className="brand footer-brand" onClick={goHome}>
        <div className="brand-icon">
  <span className="brand-u">U</span>
  <span className="brand-r">R</span>
</div>
          UrMart<span className="brand-dot">.</span>
        </button>

        <p>A little something for everyone.</p>

        <div className="footer-links">
          <button onClick={goHome}>Shop</button>
          <button onClick={() => setChatOpen(true)}>
            Customer support
          </button>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} UrMart.
          Internship demo project.
        </p>
      </footer>

      {notice && <div className="toast">{notice}</div>}

      <button
        className="chat-toggle"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label="Toggle customer support"
      >
        {chatOpen ? "×" : "💬"}
      </button>

      {chatOpen && (
        <section className="chat-panel">
          <div className="chat-header">
            <div className="bot-avatar">✦</div>
            <div>
              <b>UrMart Assistant</b>
              <span>
                <i /> Demo assistant online
              </span>
            </div>
            <button onClick={() => setChatOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((item, index) => (
              <div
                className={`message ${item.from}`}
                key={index}
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="quick-replies">
            {["Shipping", "Returns", "Payment", "Budget picks"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => askBot(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              askBot(message);
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me something..."
              aria-label="Chat message"
            />
            <button type="submit" aria-label="Send message">
              ➤
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default App;
