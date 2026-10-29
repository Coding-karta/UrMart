import { useState, useEffect, useRef } from "react";
import { products, money, COUPONS } from "../data/products";

export default function ChatAssistant({
  isOpen,
  onClose,
  currentUser,
  cart,
  subtotal,
  cartCount,
  onAddToCart,
  onOpenCheckout,
  onOpenAuth,
  initialQuery = ""
}) {
  const [messages, setMessages] = useState(() => {
    const greeting = currentUser
      ? `Hi ${currentUser.name.split(" ")[0]}! 👋 Welcome back to UrMart. I'm your AI shopping assistant. How can I help you today?`
      : "Hi there! 👋 Welcome to UrMart. I'm your AI shopping assistant. Ask me for product recommendations, gift ideas, shipping details, or order tracking!";
    return [
      {
        id: "msg_init",
        from: "bot",
        text: greeting,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: [
          "✨ Top rated items",
          "🎁 Gifts under ₹1000",
          "🛋️ Home decor ideas",
          "🏷️ Active discount codes",
          "📦 Track my order"
        ]
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // API key loaded from env variable — never exposed to customers
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const [addedItemNotice, setAddedItemNotice] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSubmitTimeRef = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleUserSubmitRef = useRef(null);

  // Handle external query trigger (e.g. from Order history)
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleUserSubmitRef.current?.(initialQuery);
    }
  }, [initialQuery, isOpen]);

  // Clear chat history
  function handleClearChat() {
    setMessages([
      {
        id: `msg_${Date.now()}`,
        from: "bot",
        text: "Conversation cleared! ✨ What would you like to explore now?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: [
          "✨ Best sellers",
          "☕ Kitchen & Coffee",
          "🏷️ Any discount coupons?",
          "🛒 Check my cart"
        ]
      }
    ]);
  }

  // Smart Built-in NLP Engine
  function generateSmartResponse(query) {
    const q = query.toLowerCase().trim();

    // 1. Order Tracking
    if (q.includes("track") || q.includes("order") || q.includes("status") || q.includes("where is my") || q.includes("urm-")) {
      // Check if user has orders
      const userOrders = currentUser?.orders || [];
      // Look for specific order ID in query
      const idMatch = q.match(/urm-\d+/i);
      let matchedOrder = null;

      if (idMatch) {
        matchedOrder = userOrders.find(
          (o) => o.orderId.toLowerCase() === idMatch[0].toLowerCase()
        );
      } else if (userOrders.length > 0) {
        // take most recent order
        matchedOrder = userOrders[userOrders.length - 1];
      }

      if (matchedOrder) {
        return {
          text: `Here is the current tracking update for **Order #${matchedOrder.orderId}**:`,
          type: "order_tracking",
          order: matchedOrder,
          suggestions: ["Need to modify address?", "Return policy", "Browse more items"]
        };
      } else if (!currentUser) {
        return {
          text: "To track your orders in real time, please **Sign In** to your UrMart account or give me an order reference like `URM-82914`.",
          type: "action_signin",
          suggestions: ["Sign In now", "Shipping timeline", "Try demo tracking: URM-82914"]
        };
      } else {
        return {
          text: "You don't have any placed orders yet. Once you place an order at checkout, you can track delivery updates here in real time!",
          suggestions: ["Shop best sellers", "View my cart", "Discount codes"]
        };
      }
    }

    // 2. Cart Queries
    if (q.includes("cart") || q.includes("my bag") || q.includes("basket") || q.includes("checkout")) {
      if (cartCount === 0) {
        return {
          text: "Your shopping cart is currently empty! 🛍️ Can I recommend our top-rated essentials for your home or workspace?",
          suggestions: ["✨ Best sellers", "🎁 Budget picks under ₹1000", "🛋️ Home decor"]
        };
      }

      const cartProductDetails = cart.map((item) => {
        const p = products.find((prod) => prod.id === item.id);
        return { ...p, qty: item.qty };
      }).filter(Boolean);

      return {
        text: `You have **${cartCount} items** in your cart totaling **${money(subtotal)}**. Ready to checkout, or would you like to add anything else?`,
        type: "cart_summary",
        cartItems: cartProductDetails,
        subtotal: subtotal,
        suggestions: ["Proceed to Checkout", "Apply discount code", "Continue shopping"]
      };
    }

    // 3. Discount & Coupons
    if (q.includes("discount") || q.includes("coupon") || q.includes("promo") || q.includes("offer") || q.includes("deal") || q.includes("code")) {
      return {
        text: "Here are active discount vouchers you can use at checkout right now:",
        type: "coupons",
        coupons: Object.values(COUPONS),
        suggestions: ["Check my cart", "Apply to my order", "Shop under ₹1000"]
      };
    }

    // 4. Budget / Price Filtering
    if (q.includes("under") || q.includes("below") || q.includes("budget") || q.includes("cheap") || q.includes("1000") || q.includes("500") || q.includes("affordable")) {
      let maxPrice = 1000;
      if (q.includes("500")) maxPrice = 500;
      if (q.includes("1500")) maxPrice = 1500;

      const filtered = products
        .filter((p) => p.price <= maxPrice)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

      return {
        text: `Here are our highest-rated curated picks under **${money(maxPrice)}**:`,
        type: "product_cards",
        products: filtered,
        suggestions: ["More items under ₹1000", "Check my cart", "Show luxury items"]
      };
    }

    // 5. Gifts & Occasions
    if (q.includes("gift") || q.includes("birthday") || q.includes("present") || q.includes("housewarming") || q.includes("friend")) {
      const giftItems = products.filter(
        (p) =>
          p.name.includes("Gift") ||
          p.name.includes("Diffuser") ||
          p.name.includes("Vase") ||
          p.name.includes("Coffee") ||
          p.name.includes("Tumbler")
      ).slice(0, 3);

      return {
        text: "Looking for a memorable gift? These thoughtfully designed essentials are customer favourites for gifting:",
        type: "product_cards",
        products: giftItems,
        suggestions: ["Self-Care Gift Box", "Coffee Set", "Vase details"]
      };
    }

    // 6. Category Specific Searches
    const categories = ["Home Decor", "Lighting", "Kitchen", "Workspace", "Wellness", "Travel"];
    for (const cat of categories) {
      if (q.includes(cat.toLowerCase()) || (cat === "Home Decor" && (q.includes("decor") || q.includes("vase") || q.includes("cushion") || q.includes("clock")))) {
        const catProducts = products.filter((p) => p.category === cat).slice(0, 3);
        return {
          text: `Explore curated favorites from our **${cat}** collection:`,
          type: "product_cards",
          products: catProducts,
          suggestions: [`All ${cat} products`, "Sort by price", "Check my cart"]
        };
      }
    }

    // 7. Keyword matching for specific items
    if (q.includes("lamp") || q.includes("light")) {
      const items = products.filter((p) => p.name.toLowerCase().includes("lamp"));
      return {
        text: "Here are our ambient and focused lighting options:",
        type: "product_cards",
        products: items,
        suggestions: ["Amber Table Lamp", "Desk Companion Lamp", "Check my cart"]
      };
    }

    if (q.includes("coffee") || q.includes("mug")) {
      const items = products.filter((p) => p.name.toLowerCase().includes("coffee") || p.name.toLowerCase().includes("mug"));
      return {
        text: "For the perfect morning coffee ritual, take a look at these pieces:",
        type: "product_cards",
        products: items,
        suggestions: ["Pour-Over Coffee Set", "Stoneware Coffee Mug", "Kitchen collection"]
      };
    }

    if (q.includes("bag") || q.includes("backpack") || q.includes("travel") || q.includes("tote")) {
      const items = products.filter((p) => p.category === "Travel").slice(0, 3);
      return {
        text: "Here are durable, minimalist travel & commute companions:",
        type: "product_cards",
        products: items,
        suggestions: ["Everyday Travel Backpack", "Weekend Canvas Tote", "Packing Cubes"]
      };
    }

    // 8. Shipping, Delivery & Returns FAQs
    if (q.includes("shipping") || q.includes("delivery") || q.includes("how long") || q.includes("when will")) {
      return {
        text: "🚚 **Shipping & Delivery Information:**\n\n• **Standard Delivery:** 3–5 business days across India.\n• **Express Delivery:** 1–2 days in metro cities.\n• **Free Shipping:** Applicable on all orders over ₹499 (or use code `FREESHIP`).\n• All packages are sustainably packaged in eco-friendly protective materials.",
        suggestions: ["Track my order", "Return policy", "Payment options"]
      };
    }

    if (q.includes("return") || q.includes("refund") || q.includes("exchange")) {
      return {
        text: "↩️ **30-Day Hassle-Free Returns:**\n\n• We offer a 30-day window for unused items in original packaging.\n• Complimentary doorstep pickup scheduled at your convenience.\n• Instant refunds credited back to your original payment method or UrMart Store Credit within 24–48 hours.",
        suggestions: ["How to start a return?", "Track my order", "Help with my cart"]
      };
    }

    if (q.includes("payment") || q.includes("pay") || q.includes("upi") || q.includes("card") || q.includes("cod")) {
      return {
        text: "💳 **Supported Payment Options:**\n\n• **UPI:** Google Pay, PhonePe, Paytm, BHIM.\n• **Cards:** All Visa, MasterCard, RuPay, and American Express credit & debit cards.\n• **Net Banking:** 50+ supported banking partners.\n• **Cash on Delivery (COD):** Available for orders up to ₹5,000.",
        suggestions: ["Discount coupons", "Check my cart", "Shipping times"]
      };
    }

    // 9. Best Sellers / Top Rated
    if (q.includes("best") || q.includes("top") || q.includes("popular") || q.includes("recommend") || q.includes("trending")) {
      const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);
      return {
        text: "Here are UrMart's highest customer-rated essentials:",
        type: "product_cards",
        products: topRated,
        suggestions: ["Amber Table Lamp", "Sculpted Ceramic Vase", "Check my cart"]
      };
    }

    // 10. Default Fallback with Context
    return {
      text: `I'd love to help! I can search our catalog for specific products, check your cart (${cartCount} items), share discount codes, or assist with shipping and order tracking. What are you looking for?`,
      suggestions: [
        "✨ Top rated items",
        "🎁 Gifts under ₹1000",
        "🏷️ Available coupons",
        "📦 Track my order"
      ]
    };
  }

  // Live Gemini API caller (Secure: API key sent via header, never in URL query string)
  async function callGeminiAPI(userPrompt, apiKey) {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) throw new Error("No Gemini API key provided");

    const sanitizedPrompt = (userPrompt || "").slice(0, 300).trim();

    const systemPrompt = `You are UrMart AI, a friendly shopping assistant. Categories: Home Decor, Lighting, Kitchen, Workspace, Wellness, Travel. User: ${currentUser ? currentUser.name : "Guest"}. Cart: ${cartCount} items (${money(subtotal)}). Coupons: WELCOME10, URMART20, FREESHIP. Be concise and helpful.`;

    // gemini-3.5-flash-lite — fastest, lowest latency model on free tier
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

    // Abort after 10 seconds so it never hangs forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": cleanKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser: ${sanitizedPrompt}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 256,   // keep replies short & fast
            temperature: 0.7
          }
        })
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Gemini API error: ${errMsg}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  // Handle message submission with rate-limiting & input sanitization
  async function handleUserSubmit(text) {
    const rawQuery = (text || input || "").trim();
    if (!rawQuery || isTyping) return;

    // Enforce 1200ms anti-spam cooldown
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 1200) {
      return;
    }
    lastSubmitTimeRef.current = now;

    // Truncate to maximum 500 characters
    const query = rawQuery.slice(0, 500);

    const userMessage = {
      id: `usr_${Date.now()}`,
      from: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // If Gemini API Key is configured, attempt live Gemini call
    if (geminiApiKey.trim()) {
      try {
        const geminiResponse = await callGeminiAPI(query, geminiApiKey);
        if (geminiResponse) {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot_${Date.now()}`,
              from: "bot",
              text: geminiResponse,
              engine: "gemini",
              engineLabel: "⚡ Gemini 3.5 Flash Lite",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              suggestions: ["✨ Best sellers", "🎁 Gifts under ₹1000", "🛒 My Cart"]
            }
          ]);
          return;
        }
      } catch (err) {
        console.error("Gemini API error:", err.message);
        // Show the actual error in chat so user knows what went wrong
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_err_${Date.now()}`,
            from: "bot",
            text: `⚠️ **Gemini AI unavailable:** ${err.message}\n\nFalling back to built-in catalog engine.`,
            engine: "error",
            engineLabel: "UrMart Curated Engine (Gemini error)",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            suggestions: ["✨ Best sellers", "🏷️ Discount codes", "📦 Track my order"]
          }
        ]);
        return;
      }
    }

    // Built-in Smart Catalog Engine
    setTimeout(() => {
      const botReply = generateSmartResponse(query);
      setIsTyping(false);

      const hadKeyError = Boolean(geminiApiKey.trim());

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          from: "bot",
          text: botReply.text,
          type: botReply.type,
          products: botReply.products,
          order: botReply.order,
          cartItems: botReply.cartItems,
          subtotal: botReply.subtotal,
          coupons: botReply.coupons,
          suggestions: botReply.suggestions,
          engine: "catalog",
          engineLabel: hadKeyError
            ? "UrMart Curated Engine (Gemini fallback)"
            : "UrMart Curated Engine",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }, 450);
  }

  useEffect(() => {
    handleUserSubmitRef.current = handleUserSubmit;
  });

  // Handle in-chat Add to Cart
  function handleChatAddToCart(productId) {
    onAddToCart(productId);
    const prod = products.find((p) => p.id === productId);
    setAddedItemNotice(prod ? prod.name : "Item");
    setTimeout(() => setAddedItemNotice(null), 2200);
  }

  if (!isOpen) return null;

  return (
    <section className="chat-window enhanced-chat" aria-label="UrMart Shopping Assistant">
      {/* HEADER */}
      <div className="chat-header">
        <div className="chat-header-main">
          <div className="chat-avatar-pulse">
            <span className="chat-bot-icon">✨</span>
            <span className="chat-status-dot" />
          </div>
          <div>
            <div className="chat-bot-title">
              <strong>UrMart AI Assistant</strong>
              <span className="chat-ai-pill">Smart Concierge</span>
            </div>
            <small>
              {currentUser ? `Serving ${currentUser.name.split(" ")[0]}` : "Online · Instant shopping help"}
            </small>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            type="button"
            className="chat-action-icon-btn"
            onClick={handleClearChat}
            title="Clear Chat History"
            aria-label="Clear chat"
          >
            🗑️
          </button>
          <button
            type="button"
            className="chat-close-btn"
            onClick={onClose}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>
      </div>

      {/* TOAST NOTICE INSIDE CHAT */}
      {addedItemNotice && (
        <div className="chat-toast-notice">
          ✓ Added <b>{addedItemNotice}</b> to your cart!
        </div>
      )}

      {/* MESSAGES SCROLL AREA */}
      <div className="chat-messages">
        {messages.map((item) => (
          <div
            key={item.id}
            className={`chat-message-row ${item.from === "user" ? "user-row" : "bot-row"}`}
          >
            {item.from === "bot" && (
              <div className="bot-avatar-badge">UR</div>
            )}

            <div className={`chat-message ${item.from === "user" ? "user-message" : "bot-message"}`}>
              {/* Message text */}
              <div className="message-text-content">
                {item.text}
              </div>

              {/* RENDER IN-CHAT PRODUCT CARDS */}
              {item.type === "product_cards" && item.products && (
                <div className="in-chat-products-grid">
                  {item.products.map((p) => (
                    <div className="in-chat-product-card" key={p.id}>
                      <div className="chat-product-thumb" style={{ backgroundColor: p.color }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="chat-product-emoji">{p.emoji}</span>
                      </div>
                      <div className="chat-product-details">
                        <span className="chat-product-cat">{p.category}</span>
                        <h4>{p.name}</h4>
                        <div className="chat-product-pricing">
                          <strong>{money(p.price)}</strong>
                          <del>{money(p.oldPrice)}</del>
                          <span className="chat-product-rating">★ {p.rating}</span>
                        </div>
                        <button
                          className="chat-add-btn"
                          onClick={() => handleChatAddToCart(p.id)}
                        >
                          + Add to cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER IN-CHAT ORDER TRACKING */}
              {item.type === "order_tracking" && item.order && (
                <div className="in-chat-order-card">
                  <div className="chat-order-header">
                    <div>
                      <span className="chat-order-id">#{item.order.orderId}</span>
                      <small>Placed {item.order.date}</small>
                    </div>
                    <span className="chat-order-status">
                      ● {item.order.status}
                    </span>
                  </div>

                  <div className="chat-tracking-stepper">
                    {item.order.trackingTimeline?.map((step, idx) => (
                      <div
                        key={idx}
                        className={`chat-tracking-step ${step.done ? "step-done" : "step-pending"}`}
                      >
                        <span className="step-circle">{step.done ? "✓" : "○"}</span>
                        <div>
                          <strong>{step.stage}</strong>
                          <small>{step.date}</small>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="chat-order-items-snippet">
                    <span>
                      Items: {item.order.items.map((i) => i.name).join(", ")}
                    </span>
                    <strong>Total: {money(item.order.total)}</strong>
                  </div>
                </div>
              )}

              {/* RENDER IN-CHAT CART SUMMARY */}
              {item.type === "cart_summary" && item.cartItems && (
                <div className="in-chat-cart-card">
                  <div className="in-chat-cart-items">
                    {item.cartItems.map((c) => (
                      <div className="in-chat-cart-row" key={c.id}>
                        <span>{c.name} (x{c.qty})</span>
                        <strong>{money(c.price * c.qty)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="in-chat-cart-total-row">
                    <span>Subtotal:</span>
                    <strong>{money(item.subtotal)}</strong>
                  </div>
                  <button
                    className="chat-checkout-action-btn"
                    onClick={() => {
                      onOpenCheckout();
                      onClose();
                    }}
                  >
                    Proceed to Checkout ({cartCount} items) →
                  </button>
                </div>
              )}

              {/* RENDER IN-CHAT COUPONS */}
              {item.type === "coupons" && item.coupons && (
                <div className="in-chat-coupons-wrap">
                  {item.coupons.map((c) => (
                    <div className="in-chat-coupon-pill" key={c.code}>
                      <div className="coupon-code-tag">{c.code}</div>
                      <div className="coupon-desc">{c.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTION SIGN IN BUTTON */}
              {item.type === "action_signin" && (
                <button
                  className="chat-signin-action-btn"
                  onClick={() => {
                    onOpenAuth();
                  }}
                >
                  Sign In to View Orders →
                </button>
              )}

              {item.engineLabel && (
                <div style={{ fontSize: "0.68rem", opacity: 0.75, marginTop: "0.3rem", fontStyle: "italic" }}>
                  {item.engineLabel}
                </div>
              )}
              <span className="message-timestamp">{item.time}</span>
            </div>
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="chat-message-row bot-row">
            <div className="bot-avatar-badge">UR</div>
            <div className="chat-message bot-message typing-indicator-msg">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      {messages.length > 0 && messages[messages.length - 1].suggestions && (
        <div className="chat-quick-questions">
          {messages[messages.length - 1].suggestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleUserSubmit(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* INPUT FORM */}
      <form
        className="chat-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          handleUserSubmit();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask for recommendations, gift ideas, shipping..."
          aria-label="Ask assistant"
          disabled={isTyping}
        />

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          ↑
        </button>
      </form>
    </section>
  );
}
