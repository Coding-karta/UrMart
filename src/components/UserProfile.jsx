import { useState } from "react";
import { money } from "../data/products";
import { isSupabaseConfigured, supabaseUpdateProfile } from "../lib/supabase";

export default function UserProfile({
  user,
  onLogout,
  onBackToShop,
  onReorderItem,
  onOpenChatWithQuery,
  onUpdateUser,
  onOpenSupabaseConfig
}) {
  const [activeTab, setActiveTab] = useState("orders"); // "orders", "address", "perks"
  const [editingAddress, setEditingAddress] = useState(false);
  const [address, setAddress] = useState(
    user?.address || {
      street: "42 Greenfield Avenue, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038"
    }
  );
  const [addressError, setAddressError] = useState("");

  if (!user) return null;

  async function handleSaveAddress(e) {
    e.preventDefault();
    setAddressError("");

    // Validate address fields
    const street = (address.street || "").trim();
    const city = (address.city || "").trim();
    const state = (address.state || "").trim();
    const pincode = (address.pincode || "").trim();

    if (!street || !city || !state || !pincode) {
      setAddressError("Please fill out all address fields.");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setAddressError("Please enter a valid 6-digit Indian PIN code (e.g. 560038).");
      return;
    }

    const cleanAddress = { street, city, state, pincode };
    setAddress(cleanAddress);
    setEditingAddress(false);
    setAddressSavedNotice(true);
    setTimeout(() => setAddressSavedNotice(false), 2500);

    const updatedUser = { ...user, address: cleanAddress };
    if (onUpdateUser) onUpdateUser(updatedUser);

    // Save to Supabase if active
    if (isSupabaseConfigured() && user.id && !user.isDemo) {
      try {
        await supabaseUpdateProfile(user.id, {
          addresses: [cleanAddress]
        });
      } catch (err) {
        console.warn("Could not save address to Supabase:", err);
      }
    }
  }

  const orders = user.orders || [];

  return (
    <main className="profile-page">
      <div className="profile-header-banner">
        <button className="back-button" onClick={onBackToShop}>
          ← Back to store
        </button>

        <div className="profile-user-card">
          <div className="profile-avatar-circle">
            {user.avatar || user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-user-meta">
            <div className="profile-title-row">
              <h1>{user.name}</h1>
              <span className="profile-role-badge">
                ★ {user.role || "Curator Member"}
              </span>
            </div>
            <p className="profile-email">{user.email}</p>
            <span className="profile-joined">
              Member since {user.joinedDate || "2025"}
            </span>

            <div className="profile-cloud-status">
              {isSupabaseConfigured() ? (
                <span className="profile-sb-pill synced">
                  <span className="profile-sb-dot">●</span> Synced to Supabase Cloud Database
                </span>
              ) : (
                <button
                  type="button"
                  className="profile-sb-pill unconfigured"
                  onClick={onOpenSupabaseConfig}
                >
                  ⚡ Local Mode (Connect Supabase)
                </button>
              )}
            </div>
          </div>

          <div className="profile-top-actions">
            <button
              className="logout-button"
              onClick={onLogout}
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content-wrap">
        <nav className="profile-tabs">
          <button
            className={`profile-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            📦 Order History ({orders.length})
          </button>
          <button
            className={`profile-tab-btn ${activeTab === "address" ? "active" : ""}`}
            onClick={() => setActiveTab("address")}
          >
            📍 Delivery Address
          </button>
          <button
            className={`profile-tab-btn ${activeTab === "perks" ? "active" : ""}`}
            onClick={() => setActiveTab("perks")}
          >
            ✨ Member Perks
          </button>
        </nav>

        {activeTab === "orders" && (
          <section className="profile-orders-section">
            <div className="profile-section-heading">
              <h2>Recent Orders</h2>
              <p>Track your deliveries, review receipts, and reorder favourite items.</p>
            </div>

            {orders.length === 0 ? (
              <div className="empty-profile-state">
                <span>📦</span>
                <h3>No orders placed yet</h3>
                <p>When you complete a checkout, your order will appear here with live tracking.</p>
                <button className="primary-button" onClick={onBackToShop}>
                  Explore the collection →
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <article className="order-card" key={order.orderId}>
                    <div className="order-card-header">
                      <div>
                        <span className="order-ref">Order #{order.orderId}</span>
                        <span className="order-date">Placed on {order.date}</span>
                      </div>

                      <div className="order-header-right">
                        <span
                          className={`order-status-badge ${order.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          ● {order.status}
                        </span>
                        <strong className="order-total-price">
                          {money(order.total)}
                        </strong>
                      </div>
                    </div>

                    {/* Tracking Timeline */}
                    {order.trackingTimeline && (
                      <div className="order-tracking-strip">
                        <h4>Delivery Progress:</h4>
                        <div className="tracking-steps">
                          {order.trackingTimeline.map((step, idx) => (
                            <div
                              key={idx}
                              className={`tracking-step ${step.done ? "done" : "pending"}`}
                            >
                              <div className="step-dot">{step.done ? "✓" : "○"}</div>
                              <div className="step-info">
                                <strong>{step.stage}</strong>
                                <small>{step.date}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="order-items-list">
                      {order.items.map((item, i) => (
                        <div className="order-item-row" key={i}>
                          <div className="order-item-desc">
                            <span className="order-item-name">{item.name}</span>
                            <span className="order-item-qty">Qty: {item.qty}</span>
                          </div>
                          <div className="order-item-price-actions">
                            <strong>{money(item.price * item.qty)}</strong>
                            {onReorderItem && (
                              <button
                                className="reorder-btn"
                                onClick={() => onReorderItem(item.id)}
                                title="Add to cart again"
                              >
                                + Reorder
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <span className="order-payment-tag">
                        Paid via {order.paymentMethod || "Online Payment"}
                      </span>
                      <button
                        className="track-with-ai-btn"
                        onClick={() =>
                          onOpenChatWithQuery &&
                          onOpenChatWithQuery(`Where is my order ${order.orderId}?`)
                        }
                      >
                        🤖 Ask AI Assistant about this order
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "address" && (
          <section className="profile-address-section">
            <div className="profile-section-heading">
              <h2>Saved Delivery Address</h2>
              <p>Your primary shipping location for effortless 1-click checkout.</p>
            </div>

            {addressSavedNotice && (
              <div className="toast-inline-success">
                ✓ Address updated successfully!
              </div>
            )}

            {!editingAddress ? (
              <div className="address-display-card">
                <div className="address-badge">Primary Residence</div>
                <h3>{user.name}</h3>
                <p>{address.street || "42 Greenfield Avenue, Indiranagar"}</p>
                <p>
                  {(address.city || "Bengaluru") +
                    ", " +
                    (address.state || "Karnataka") +
                    " - " +
                    (address.pincode || "560038")}
                </p>
                <p className="address-phone">Phone: {user.phone || "+91 98765 43210"}</p>

                <div className="address-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => setEditingAddress(true)}
                  >
                    ✎ Edit Address
                  </button>
                </div>
              </div>
            ) : (
              <form className="address-edit-form" onSubmit={handleSaveAddress}>
                {addressError && (
                  <div className="auth-error-banner" role="alert" style={{ marginBottom: "1rem" }}>
                    <span>⚠️</span>
                    <p>{addressError}</p>
                  </div>
                )}
                <div className="auth-field">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                    placeholder="Flat/House No, Building, Street"
                    required
                  />
                </div>

                <div className="address-grid-2">
                  <div className="auth-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label>State</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) =>
                        setAddress({ ...address, state: e.target.value })
                      }
                      placeholder="State"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Postal PIN Code</label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress({ ...address, pincode: e.target.value })
                    }
                    placeholder="e.g. 560038"
                    required
                  />
                </div>

                <div className="form-btn-row">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditingAddress(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {activeTab === "perks" && (
          <section className="profile-perks-section">
            <div className="profile-section-heading">
              <h2>UrMart Member Perks</h2>
              <p>Exclusive privileges curated for our member community.</p>
            </div>

            <div className="perks-grid">
              <div className="perk-card">
                <span className="perk-icon">🚚</span>
                <h3>Free Express Delivery</h3>
                <p>Enjoy complimentary express shipping on all orders over ₹499 without membership fees.</p>
              </div>

              <div className="perk-card">
                <span className="perk-icon">🏷️</span>
                <h3>Member Discounts</h3>
                <p>Use code <b>WELCOME10</b> for 10% off anytime, or <b>URMART20</b> on seasonal edits.</p>
              </div>

              <div className="perk-card">
                <span className="perk-icon">🤖</span>
                <h3>UrMart AI Concierge</h3>
                <p>Personalized product suggestions, decor pairing tips, and instant package tracking.</p>
              </div>

              <div className="perk-card">
                <span className="perk-icon">↩️</span>
                <h3>30-Day Hassle-Free Returns</h3>
                <p>Simple doorstep pickups and immediate refunds if any item isn't perfectly suited.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
