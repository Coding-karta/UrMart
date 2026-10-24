import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  products,
  money,
  COUPONS,
  LIFESTYLE_BANNERS,
  FEATURED_COLLECTIONS
} from "./data/products";
import AuthModal from "./components/AuthModal";
import UserProfile from "./components/UserProfile";
import ChatAssistant from "./components/ChatAssistant";
import SupabaseConfigModal from "./components/SupabaseConfigModal";
import {
  getSupabase,
  isSupabaseConfigured,
  supabaseSignOut,
  supabaseCreateOrder,
  supabaseFetchOrders,
  supabaseFetchProfile
} from "./lib/supabase";

const CURRENT_YEAR = new Date().getFullYear();

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

function QuantityControl({ productId, qty, onAddToCart, onChangeQty }) {
  if (qty === 0) {
    return (
      <button className="add-button" onClick={() => onAddToCart(productId)}>
        + Add to cart
      </button>
    );
  }

  return (
    <div className="product-quantity">
      <button onClick={() => onChangeQty(productId, -1)} aria-label="Decrease quantity">−</button>
      <span>{qty} in cart</span>
      <button onClick={() => onChangeQty(productId, 1)} aria-label="Increase quantity">+</button>
    </div>
  );
}

function App() {
  // Theme state: dark / light mode
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("urmart-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {
      // fallback
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Cart & Wishlist state
  const [cart, setCart] = useState(() => readStorage("shop-cart", []));
  const [wishlist, setWishlist] = useState(() => readStorage("shop-wishlist", []));

  // User Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    return readStorage("urmart-current-user", null);
  });

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // App navigation & filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState("home"); // "home" | "detail" | "checkout" | "profile" | "auth"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [notice, setNotice] = useState("");

  // AI Chat Assistant state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState("");

  // Checkout form & promo code state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Supabase Cloud state
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [isSbActive, setIsSbActive] = useState(() => isSupabaseConfigured());

  // Apply theme to html document root & persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("urmart-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // Sync cart & wishlist
  useEffect(() => {
    localStorage.setItem("shop-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("shop-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("urmart-current-user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("urmart-current-user");
    }
  }, [currentUser]);

  async function syncSupabaseUser(user) {
    try {
      const profile = await supabaseFetchProfile(user.id);
      const orders = await supabaseFetchOrders(user.id);
      const name = profile?.name || user.user_metadata?.name || user.email.split("@")[0];
      const parts = name.split(" ");
      const avatar =
        profile?.avatar ||
        (parts.length > 1
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0].slice(0, 2).toUpperCase());

      const appUser = {
        id: user.id,
        name,
        email: user.email,
        phone: profile?.phone || user.user_metadata?.phone || "",
        role: "Curator Member",
        avatar,
        joinedDate: new Date(user.created_at || Date.now()).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric"
        }),
        orders: orders || [],
        address: profile?.addresses?.[0] || profile?.address || {
          street: "",
          city: "",
          state: "",
          pincode: ""
        },
        source: "supabase"
      };
      setCurrentUser(appUser);
    } catch (err) {
      console.warn("Failed to sync Supabase user:", err);
    }
  }

  // Sync Supabase Auth session on mount and listen to changes
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSupabaseUser(session.user);
      }
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        syncSupabaseUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuOpen && !e.target.closest(".nav-user-dropdown-wrap")) {
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const visibleProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesText = `${p.name} ${p.category} ${p.description}`
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

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent > 0) {
      return Math.round((subtotal * appliedCoupon.discountPercent) / 100);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const finalTotal = Math.max(0, subtotal - discountAmount);

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
    setUserMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle Authentication success
  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setNotice(`Welcome, ${user.name}! ✓`);
    window.setTimeout(() => setNotice(""), 3000);
    if (page === "auth") {
      setPage("home");
    }
  }

  async function handleLogout() {
    if (isSupabaseConfigured()) {
      try {
        await supabaseSignOut();
      } catch (err) {
        console.warn("Supabase signout notice:", err);
      }
    }
    setCurrentUser(null);
    setUserMenuOpen(false);
    setNotice("Signed out successfully.");
    window.setTimeout(() => setNotice(""), 2500);
    if (page === "profile") {
      setPage("home");
    }
  }

  // Coupon code apply
  function handleApplyCoupon(e) {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (COUPONS[code]) {
      setAppliedCoupon(COUPONS[code]);
      setNotice(`Coupon "${code}" applied! ✓`);
      window.setTimeout(() => setNotice(""), 2500);
    } else {
      setCouponError("Invalid coupon. Try WELCOME10 or URMART20");
    }
  }

  // Handle placing order at Checkout
  function handlePlaceOrder() {
    if (cart.length === 0) return;

    const orderId = `URM-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = {
      orderId,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      status: "Confirmed",
      items: cart.map((item) => {
        const prod = products.find((p) => p.id === item.id);
        return {
          id: item.id,
          name: prod ? prod.name : "Product",
          qty: item.qty,
          price: prod ? prod.price : 0
        };
      }),
      total: finalTotal,
      paymentMethod:
        paymentMethod === "upi"
          ? "UPI Payment"
          : paymentMethod === "card"
          ? "Credit/Debit Card"
          : "Cash on Delivery",
      trackingTimeline: [
        { stage: "Order Confirmed", date: "Just now", done: true },
        { stage: "Dispatched from Hub", date: "Expected tomorrow", done: false },
        { stage: "Out for Delivery", date: "In 2 days", done: false },
        { stage: "Delivered", date: "Estimated 3–4 days", done: false }
      ]
    };

    // Save order to current user if logged in
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        orders: [newOrder, ...(currentUser.orders || [])]
      };
      setCurrentUser(updatedUser);

      // Save order to Supabase PostgreSQL database if configured
      if (isSupabaseConfigured() && currentUser.id) {
        supabaseCreateOrder({
          id: orderId,
          userId: currentUser.id,
          items: newOrder.items,
          subtotal: subtotal,
          discount: appliedCoupon ? appliedCoupon.discount : 0,
          shipping: subtotal >= 499 || appliedCoupon?.freeShipping ? 0 : 80,
          total: finalTotal + (subtotal >= 499 || appliedCoupon?.freeShipping ? 0 : 80),
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          shippingAddress: currentUser.address || {},
          paymentMethod: newOrder.paymentMethod,
          status: "Confirmed",
          createdAt: new Date().toISOString()
        }).catch((err) => {
          console.warn("Could not save order to Supabase orders table:", err);
        });
      }

      try {
        const stored = localStorage.getItem("urmart-registered-users");
        if (stored) {
          const users = JSON.parse(stored);
          const updatedList = users.map((u) =>
            u.id === currentUser.id ? updatedUser : u
          );
          localStorage.setItem(
            "urmart-registered-users",
            JSON.stringify(updatedList)
          );
        }
      } catch {
        // ignore
      }
    }

    setLastPlacedOrder(newOrder);
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode("");
    setNotice("Order placed successfully! ✓");
    window.setTimeout(() => setNotice(""), 3000);
  }

  // Open AI Chatbot with custom query (e.g. from Profile or Detail)
  function handleOpenChatWithQuery(initialText) {
    setChatInitialQuery(initialText);
    setChatOpen(true);
  }

  // Newsletter form submission
  function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNotice("Thank you for subscribing to The UrMart Journal! ✓");
    window.setTimeout(() => setNotice(""), 3000);
    setNewsletterEmail("");
  }

  return (
    <div className="app">
      {/* LUXURY ANNOUNCEMENT BAR */}
      <aside className="announcement">
        <div className="announcement-content">
          <span className="announcement-pill">VOLUME IV</span>
          <span>CONSIDERED OBJECTS FOR MINDFUL LIVING · COMPLIMENTARY EXPRESS SHIPPING OVER ₹499</span>
          <span className="announcement-promo">
            USE CODE <b>WELCOME10</b> FOR 10% OFF
          </span>
        </div>
      </aside>

      {/* EDITORIAL NAVBAR */}
      <header className="navbar">
        <button className="brand" onClick={goHome}>
          <div className="brand-icon">
            <span className="brand-u">U</span>
            <span className="brand-r">R</span>
          </div>
          <span className="brand-text">
            UrMart<span className="brand-dot">.</span>
          </span>
        </button>

        {/* SEARCH BAR */}
        <div className="nav-search">
          <span className="search-symbol">⌕</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage("home");
              setSelectedProduct(null);
            }}
            placeholder="Search ceramics, ambient lamps, French linen, leather..."
            aria-label="Search products"
          />

          {query && (
            <button
              className="clear-search-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* NAV ACTIONS */}
        <div className="nav-actions">
          {/* SUPABASE CLOUD STATUS / CONNECT BUTTON */}
          <button
            type="button"
            className="supabase-nav-btn"
            onClick={() => setSupabaseModalOpen(true)}
            title={
              isSbActive
                ? "Supabase: Connected to Cloud Auth & PostgreSQL"
                : "Supabase: Click to connect Cloud Auth & PostgreSQL"
            }
            aria-label="Configure Supabase Database and Authentication"
          >
            <span className="supabase-bolt">⚡</span>
            <span className="supabase-nav-text">Supabase</span>
            <span className={`supabase-nav-dot ${isSbActive ? "online" : "offline"}`} />
          </button>

          {/* DARK / LIGHT MODE SWITCH BUTTON */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="theme-toggle-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="theme-toggle-text">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          {/* Wishlist Link */}
          <button
            className={`nav-link ${wishlistOnly ? "active" : ""}`}
            onClick={() => {
              setWishlistOnly(!wishlistOnly);
              setPage("home");
              setSelectedProduct(null);
              setCartOpen(false);
            }}
            title="View Wishlist"
          >
            <span className="nav-action-icon">♡</span>
            <span>Wishlist</span>
            {wishlist.length > 0 && <small>{wishlist.length}</small>}
          </button>

          {/* Cart Button */}
          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
            title="Shopping Cart"
          >
            <span className="nav-action-icon">🛍️</span>
            <span>Cart</span>
            <b>{cartCount}</b>
          </button>

          {/* USER AUTH / PROFILE MENU */}
          {currentUser ? (
            <div className="nav-user-dropdown-wrap">
              <button
                type="button"
                className="user-badge-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <div className="nav-avatar-pill">
                  {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="nav-user-name">
                  {currentUser.name.split(" ")[0]}
                </span>
                <span className="nav-chevron">▾</span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <strong>{currentUser.name}</strong>
                    <small>{currentUser.email}</small>
                    <span className="dropdown-role-tag">★ {currentUser.role || "Curator Member"}</span>
                  </div>

                  <div className="dropdown-links">
                    <button
                      onClick={() => {
                        setPage("profile");
                        setUserMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      📦 My Profile & Orders ({currentUser.orders?.length || 0})
                    </button>
                    <button
                      onClick={() => {
                        setWishlistOnly(true);
                        setPage("home");
                        setUserMenuOpen(false);
                      }}
                    >
                      ♡ My Wishlist ({wishlist.length})
                    </button>
                    <button
                      onClick={() => {
                        setChatOpen(true);
                        setUserMenuOpen(false);
                      }}
                    >
                      🤖 UrMart AI Assistant
                    </button>
                  </div>

                  <div className="dropdown-footer">
                    <button className="dropdown-logout-btn" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="signin-nav-btn"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              <span className="signin-icon">👤</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* CATEGORY NAV */}
      {page === "home" && (
        <nav className="category-nav">
          <div className="category-nav-inner">
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
                {item === "All" && <span className="cat-counter">({products.length})</span>}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* AUTH FULL PAGE VIEW */}
      {page === "auth" && (
        <AuthModal
          isFullPage={true}
          isOpen={true}
          initialMode={authMode}
          onLoginSuccess={handleLoginSuccess}
          onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
        />
      )}

      {/* USER PROFILE PAGE VIEW */}
      {page === "profile" && (
        <UserProfile
          user={currentUser}
          onLogout={handleLogout}
          onBackToShop={goHome}
          onReorderItem={(id) => addToCart(id)}
          onOpenChatWithQuery={handleOpenChatWithQuery}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
        />
      )}

      {/* EDITORIAL LIFESTYLE HERO BANNER */}
      {page === "home" &&
        !wishlistOnly &&
        !query &&
        category === "All" && (
          <>
            <section className="hero-editorial">
              <div className="hero-banner-bg">
                <img
                  src={LIFESTYLE_BANNERS.hero.image}
                  alt="Curated Sanctuary Living"
                  className="hero-banner-img"
                />
                <div className="hero-overlay" />
              </div>

              <div className="hero-editorial-content">
                <div className="hero-eyebrow-pill">
                  <span className="hero-spark">✳</span>
                  <span>{LIFESTYLE_BANNERS.hero.eyebrow}</span>
                </div>

                <h1>
                  Considered Living,
                  <br />
                  <em>Effortless Beauty.</em>
                </h1>

                <p>{LIFESTYLE_BANNERS.hero.description}</p>

                <div className="hero-cta-group">
                  <button
                    className="primary-button hero-cta-primary"
                    onClick={() =>
                      document
                        .getElementById("products")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Explore The Collection <span>↓</span>
                  </button>

                  <button
                    className="secondary-outline-button hero-cta-ai"
                    onClick={() => setChatOpen(true)}
                  >
                    ✨ Style With AI Concierge
                  </button>
                </div>

                <div className="hero-stats-row">
                  <div className="hero-stat-item">
                    <strong>32+</strong>
                    <span>Curated Essentials</span>
                  </div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat-item">
                    <strong>100%</strong>
                    <span>Recyclable Packaging</span>
                  </div>
                  <div className="hero-stat-sep" />
                  <div className="hero-stat-item">
                    <strong>4.9 ★</strong>
                    <span>Client Satisfaction</span>
                  </div>
                </div>
              </div>
            </section>

            {/* CURATED MOODBOARD / SPACES SECTION */}
            <section className="curated-moodboard-section">
              <div className="moodboard-header">
                <div>
                  <span className="eyebrow">CURATED SPACES</span>
                  <h2>Explore by Living Mood</h2>
                </div>
                <p>Thoughtfully paired materials for daily quietude and rituals.</p>
              </div>

              <div className="moodboard-grid">
                {FEATURED_COLLECTIONS.map((col, idx) => (
                  <div
                    className="moodboard-card"
                    key={idx}
                    onClick={() => {
                      setCategory(col.category);
                      setWishlistOnly(false);
                      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <div className="moodboard-img-wrap">
                      <img src={col.image} alt={col.title} loading="lazy" />
                    </div>
                    <div className="moodboard-overlay">
                      <span className="moodboard-cat">{col.category}</span>
                      <h3>{col.title}</h3>
                      <p>{col.subtitle}</p>
                      <span className="moodboard-arrow">Discover Collection →</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PRESS & QUOTES TICKER BAR */}
            <div className="press-ticker-bar">
              <div className="press-ticker-inner">
                <span>“UrMart brings quiet luxury into everyday objects.” — Architectural Digest</span>
                <span className="ticker-dot">•</span>
                <span>“Tactile, grounding, and effortlessly chic.” — Kinfolk</span>
                <span className="ticker-dot">•</span>
                <span>“Redefining intentional home aesthetics with conscious craft.” — Elle Decor</span>
                <span className="ticker-dot">•</span>
                <span>“Every object feels like an heirloom.” — Vogue Living</span>
              </div>
            </div>
          </>
        )}

      {/* MAIN PRODUCTS GRID */}
      {page === "home" && (
        <main className="main-content" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {wishlistOnly ? "YOUR SELECTION" : "THE URMART ARCHIVE"}
              </span>

              <h2>
                {wishlistOnly
                  ? "Your Wishlist"
                  : query
                  ? `Search: "${query}"`
                  : category === "All"
                  ? "Complete Collection"
                  : `${category} Collection`}
              </h2>

              <p>{visibleProducts.length} curated objects to discover</p>
            </div>

            <div className="section-controls">
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Featured Picks</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-visual-wrap">
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
                </div>

                <div className="product-info">
                  <div className="product-meta-row">
                    <span className="product-category">
                      {product.category}
                    </span>
                    <span className="rating-pill">
                      ★ {product.rating}
                    </span>
                  </div>

                  <button
                    className="product-name"
                    onClick={() => openProduct(product)}
                  >
                    {product.name}
                  </button>

                  <p className="product-snippet">{product.description}</p>

                  <div className="price-row">
                    <strong>{money(product.price)}</strong>
                    <del>{money(product.oldPrice)}</del>
                  </div>

                  <QuantityControl
                    productId={product.id}
                    qty={getQuantity(product.id)}
                    onAddToCart={addToCart}
                    onChangeQty={changeQty}
                  />
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <div className="empty-state">
              <span>🔎</span>
              <h3>No objects match your criteria</h3>
              <p>Try refining your search terms or explore all curated categories.</p>

              <button className="primary-button" onClick={goHome}>
                View All 32+ Objects
              </button>
            </div>
          )}

          {/* MID-PAGE LIFESTYLE EDITORIAL BANNER */}
          {page === "home" && !wishlistOnly && !query && category === "All" && (
            <section className="editorial-banner-section">
              <div className="editorial-banner-image-wrap">
                <img
                  src={LIFESTYLE_BANNERS.editorial.image}
                  alt="The Artisan Archive Dining Table"
                  loading="lazy"
                />
                <div className="editorial-banner-overlay" />
              </div>
              <div className="editorial-banner-card">
                <span className="eyebrow">{LIFESTYLE_BANNERS.editorial.eyebrow}</span>
                <h2>{LIFESTYLE_BANNERS.editorial.title}</h2>
                <p>{LIFESTYLE_BANNERS.editorial.description}</p>
                <blockquote className="editorial-quote">
                  {LIFESTYLE_BANNERS.editorial.quote}
                  <cite>{LIFESTYLE_BANNERS.editorial.author}</cite>
                </blockquote>
                <div className="editorial-actions">
                  <button
                    className="primary-button"
                    onClick={() => {
                      setCategory("Kitchen");
                      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Shop The Tableware Edit →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* BRAND PILLARS / VALUES */}
          <section className="benefits">
            <div className="benefit-card">
              <span className="benefit-icon">🌿</span>
              <div>
                <b>Artisan Provenance</b>
                <p>Ethically crafted by multi-generational studios</p>
              </div>
            </div>

            <div className="benefit-card">
              <span className="benefit-icon">📦</span>
              <div>
                <b>Mindful Packaging</b>
                <p>100% plastic-free, carbon-neutral delivery</p>
              </div>
            </div>

            <div className="benefit-card">
              <span className="benefit-icon">🤖</span>
              <div>
                <b>UrMart AI Concierge</b>
                <p>Personalized home styling & real-time updates</p>
              </div>
            </div>

            <div className="benefit-card">
              <span className="benefit-icon">↩️</span>
              <div>
                <b>30-Day Doorstep Returns</b>
                <p>Complimentary pickup, hassle-free refunds</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* DETAIL MODAL OVERLAY */}
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
                ★ {selectedProduct.rating} <span>Customer Favorite (Verified Purchase)</span>
              </div>

              <div className="detail-price">
                {money(selectedProduct.price)}
                <del className="detail-old-price">{money(selectedProduct.oldPrice)}</del>
              </div>

              <p>{selectedProduct.description}</p>

              <div className="detail-features-list">
                <span>✓ Hand-finished with non-toxic, food-safe or natural finishes</span>
                <span>✓ Sourced from certified ethical workshops</span>
                <span>✓ Dispatches within 24 hours in biodegradable packaging</span>
              </div>

              <div className="detail-action-row">
                <QuantityControl
                  productId={selectedProduct.id}
                  qty={getQuantity(selectedProduct.id)}
                  onAddToCart={addToCart}
                  onChangeQty={changeQty}
                />
                <button
                  className="ask-ai-detail-btn"
                  onClick={() => {
                    handleOpenChatWithQuery(`Tell me more about the ${selectedProduct.name} and styling tips.`);
                  }}
                >
                  ✨ Ask AI Styling Advice
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* CART DRAWER */}
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
                <span className="eyebrow">YOUR BAG</span>
                <h2>Shopping Bag ({cartCount})</h2>
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
                  <h3>Your shopping bag is empty</h3>
                  <p>Discover something timeless from our 32+ curated objects.</p>

                  <button
                    className="primary-button"
                    onClick={() => setCartOpen(false)}
                  >
                    Explore The Collection
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

                <p className="cart-shipping-note">
                  {subtotal >= 499
                    ? "🎉 You qualify for FREE Express Delivery!"
                    : `Add ${money(499 - subtotal)} more for free express delivery.`}
                </p>

                <button
                  className="checkout-button"
                  onClick={() => {
                    setCartOpen(false);
                    setPage("checkout");
                  }}
                >
                  Continue to Checkout →
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* CHECKOUT PAGE */}
      {page === "checkout" && (
        <main className="checkout-page">
          <button className="back-button" onClick={goHome}>
            ← Continue Shopping
          </button>

          {lastPlacedOrder ? (
            <div className="checkout-success-card">
              <span className="success-emoji">🎉</span>
              <span className="eyebrow">ORDER CONFIRMED</span>
              <h1>Thank you for your order!</h1>
              <p>
                Order <b>#{lastPlacedOrder.orderId}</b> has been received and is being prepared with care.
              </p>

              <div className="order-success-meta">
                <div>
                  <strong>Total Paid</strong>
                  <span>{money(lastPlacedOrder.total)}</span>
                </div>
                <div>
                  <strong>Payment Method</strong>
                  <span>{lastPlacedOrder.paymentMethod}</span>
                </div>
                <div>
                  <strong>Estimated Delivery</strong>
                  <span>3–4 Business Days</span>
                </div>
              </div>

              <div className="order-success-actions">
                {currentUser && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      setPage("profile");
                      setLastPlacedOrder(null);
                    }}
                  >
                    View in Order History →
                  </button>
                )}

                <button
                  className="secondary-btn"
                  onClick={() => {
                    handleOpenChatWithQuery(`Where is my order ${lastPlacedOrder.orderId}?`);
                  }}
                >
                  🤖 Track with AI Assistant
                </button>

                <button
                  className="text-link-btn"
                  onClick={() => {
                    setLastPlacedOrder(null);
                    goHome();
                  }}
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          ) : (
            <div className="checkout-card">
              <span className="eyebrow">FINAL STEP</span>
              <h1>Secure Checkout</h1>

              {!currentUser && (
                <div className="checkout-auth-banner">
                  <span>💡 Have an account?</span>
                  <button
                    type="button"
                    className="checkout-signin-link"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthOpen(true);
                    }}
                  >
                    Sign in to save this order to your profile →
                  </button>
                </div>
              )}

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

              {/* COUPON CODE FORM */}
              <form className="checkout-coupon-form" onSubmit={handleApplyCoupon}>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Discount code (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit">Apply</button>
                </div>
                {couponError && <p className="coupon-error">{couponError}</p>}
                {appliedCoupon && (
                  <div className="coupon-applied-tag">
                    <span>✓ Applied: {appliedCoupon.code} ({appliedCoupon.description})</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)}>×</button>
                  </div>
                )}
              </form>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="payment-method-section">
                <h3>Select Payment Method</h3>
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>⚡ UPI (Google Pay, PhonePe, Paytm, Cred)</span>
                  </label>

                  <label className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>💳 Credit / Debit Card (All major cards)</span>
                  </label>

                  <label className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>📦 Cash on Delivery</span>
                  </label>
                </div>
              </div>

              {/* TOTALS BREAKDOWN */}
              <div className="checkout-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="breakdown-row discount-row">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>- {money(discountAmount)}</span>
                  </div>
                )}
                <div className="breakdown-row">
                  <span>Shipping</span>
                  <span>{subtotal >= 499 || appliedCoupon?.freeShipping ? "FREE" : money(80)}</span>
                </div>
                <div className="checkout-total">
                  <span>Total Amount</span>
                  <strong>{money(finalTotal + (subtotal >= 499 || appliedCoupon?.freeShipping ? 0 : 80))}</strong>
                </div>
              </div>

              <button
                className="checkout-button"
                disabled={cart.length === 0}
                onClick={handlePlaceOrder}
              >
                Place Order ({money(finalTotal + (subtotal >= 499 || appliedCoupon?.freeShipping ? 0 : 80))}) →
              </button>

              <p className="checkout-disclaimer">
                🔒 256-bit SSL encrypted. 30-day effortless doorstep returns.
              </p>
            </div>
          )}
        </main>
      )}

      {/* TOAST NOTICE */}
      {notice && <div className="toast-notice">{notice}</div>}

      {/* AUTH MODAL DIALOG */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
        onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
      />

      {/* SUPABASE CONFIGURATION MODAL */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onConfigSaved={() => {
          const active = isSupabaseConfigured();
          setIsSbActive(active);
          setNotice(
            active
              ? "✓ Supabase connected! Cloud database and auth are now active."
              : "Switched to local mode."
          );
          window.setTimeout(() => setNotice(""), 3500);
        }}
      />

      {/* CHAT TOGGLE BUTTON */}
      <button
        className="chat-toggle"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label="Open UrMart AI Shopping Assistant"
      >
        {chatOpen ? "×" : "✨"}
      </button>

      {/* SUPERCHARGED AI CHATBOT */}
      <ChatAssistant
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentUser={currentUser}
        cart={cart}
        subtotal={subtotal}
        cartCount={cartCount}
        onAddToCart={addToCart}
        onOpenCheckout={() => {
          setCartOpen(false);
          setPage("checkout");
        }}
        onOpenAuth={() => {
          setAuthMode("login");
          setAuthOpen(true);
        }}
        initialQuery={chatInitialQuery}
      />

      {/* LUXURY EDITORIAL FOOTER */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <button className="brand" onClick={goHome}>
              <div className="brand-icon">
                <span className="brand-u">U</span>
                <span className="brand-r">R</span>
              </div>
              <span className="brand-text">
                UrMart<span className="brand-dot">.</span>
              </span>
            </button>

            <p>
              Objects created for quiet reflection and everyday ritual.
              <br />
              Ethically sourced materials, timeless aesthetics, and mindful spaces.
            </p>

            <div className="footer-certifications">
              <span>🌿 100% Organic Fibers</span>
              <span>🌍 Climate Neutral Certified</span>
            </div>
          </div>

          <div className="footer-links">
            <strong>The Collections</strong>
            <button onClick={goHome}>All 32+ Objects</button>
            <button
              onClick={() => {
                setCategory("Home Decor");
                setPage("home");
                setWishlistOnly(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Ceramics & Decor
            </button>
            <button
              onClick={() => {
                setCategory("Lighting");
                setPage("home");
                setWishlistOnly(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Ambient Lighting
            </button>
            <button
              onClick={() => {
                setCategory("Kitchen");
                setPage("home");
                setWishlistOnly(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Artisan Tableware
            </button>
            <button
              onClick={() => {
                setCategory("Wellness");
                setPage("home");
                setWishlistOnly(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Sensory Wellness
            </button>
          </div>

          <div className="footer-links">
            <strong>Client Care</strong>
            {currentUser ? (
              <button
                onClick={() => {
                  setPage("profile");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                My Account & Orders
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                Sign In / Register
              </button>
            )}
            <button onClick={() => setChatOpen(true)}>
              UrMart AI Concierge
            </button>
            <button
              onClick={() => {
                setCartOpen(true);
              }}
            >
              Shopping Bag ({cartCount})
            </button>
            <button
              onClick={() => {
                setWishlistOnly(true);
                setPage("home");
                setSelectedProduct(null);
              }}
            >
              Saved Wishlist ({wishlist.length})
            </button>
          </div>

          <div className="footer-newsletter-col">
            <strong>The UrMart Journal</strong>
            <p>
              Receive stories on intentional architecture, slow living, and private collection releases.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit" aria-label="Subscribe to newsletter">
                →
              </button>
            </form>
            <small>We respect your privacy. Unsubscribe anytime.</small>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {CURRENT_YEAR} UrMart Studio Ltd. All rights reserved.</span>
            <span>Kyoto · Copenhagen · Bengaluru</span>
          </div>

          <div className="footer-bottom-right">
            <span>Privacy Policy</span>
            <span className="dot-sep">•</span>
            <span>Terms of Service</span>
            <span className="dot-sep">•</span>
            <span>Sustainability Report</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;