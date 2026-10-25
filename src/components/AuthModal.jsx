import { useState } from "react";
import { INITIAL_DEMO_USERS } from "../data/products";
import {
  isSupabaseConfigured,
  supabaseSignIn,
  supabaseSignUp,
  supabaseResetPassword,
  supabaseFetchOrders
} from "../lib/supabase";

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = "login", // "login" or "signup"
  isFullPage = false,
  onOpenSupabaseConfig
}) {
  const [mode, setMode] = useState(initialMode); // "login" or "signup"

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Error & loading states
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen && !isFullPage) return null;

  // Password strength calculator
  function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "#e06c75" };
    if (score === 2) return { score: 2, label: "Fair", color: "#e5c07b" };
    if (score === 3) return { score: 3, label: "Good", color: "#98c379" };
    return { score: 4, label: "Strong", color: "#777d5a" };
  }

  const pwdStrength = getPasswordStrength(signupPassword);

  // Quick Demo Guest Login (preview only, no password stored, clearly separated)
  function handleDemoLogin(demoUserIndex = 0) {
    const demoUser = INITIAL_DEMO_USERS[demoUserIndex] || INITIAL_DEMO_USERS[0];
    onLoginSuccess({
      ...demoUser,
      isDemo: true,
      source: "demo"
    });
    if (onClose) onClose();
  }

  // Handle standard Login via Supabase Auth
  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessNotice("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Supabase Auth is the sole authentication mechanism for real accounts
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured yet. Please connect your Supabase project via '⚡ Connect Supabase Cloud' to sign in with real credentials, or continue as a Demo Guest below."
      );
      return;
    }

    setIsLoading(true);

    try {
      const { user, profile } = await supabaseSignIn({
        email: loginEmail.trim(),
        password: loginPassword
      });

      const orders = (await supabaseFetchOrders(user.id)) || [];

      // Build clean user session object
      const parts = (profile?.name || user.user_metadata?.name || user.email.split("@")[0]).split(" ");
      const avatar =
        profile?.avatar ||
        (parts.length > 1
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0].slice(0, 2).toUpperCase());

      const appUser = {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || user.email.split("@")[0],
        email: user.email,
        phone: profile?.phone || user.user_metadata?.phone || "",
        role: "Curator Member",
        avatar,
        joinedDate: new Date(user.created_at || Date.now()).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric"
        }),
        orders,
        address: profile?.addresses?.[0] || profile?.address || {
          street: "",
          city: "",
          state: "",
          pincode: ""
        },
        source: "supabase"
      };

      setIsLoading(false);
      onLoginSuccess(appUser);
      if (onClose) onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Invalid login credentials. Please verify your email and password.");
    }
  }

  // Handle Sign Up Submit
  async function handleSignupSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessNotice("");

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (signupName.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (signupPassword !== signupConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to UrMart's Terms & Conditions.");
      return;
    }

    // Real account registration requires Supabase
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setError(
        "Supabase is not configured yet. Please connect your Supabase project via '⚡ Connect Supabase Cloud' to register a real account, or try Demo Guest Mode."
      );
      return;
    }

    try {
      const { user, session } = await supabaseSignUp({
        email: signupEmail.trim(),
        password: signupPassword,
        name: signupName.trim()
      });

      setIsLoading(false);

      // If email confirmation is disabled or session exists, log in immediately
      if (session && user) {
        const parts = signupName.trim().split(" ");
        const avatar =
          parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();

        const appUser = {
          id: user.id,
          name: signupName.trim(),
          email: user.email,
          phone: "",
          role: "Curator Member",
          avatar,
          joinedDate: new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
          }),
          orders: [],
          address: { street: "", city: "", state: "", pincode: "" },
          source: "supabase"
        };
        onLoginSuccess(appUser);
        if (onClose) onClose();
      } else {
        // Email confirmation is required by Supabase settings
        setSuccessNotice(
          "✓ Registration successful in Supabase! Check your inbox to confirm your email, or sign in now."
        );
        setMode("login");
        setLoginEmail(signupEmail.trim());
      }
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || "";
      if (msg.toLowerCase().includes("rate limit")) {
        setError(
          "Supabase email rate limit reached. In your Supabase Dashboard, go to Authentication → Providers → Email, toggle OFF 'Confirm email', and click Save to enable instant signups!"
        );
      } else {
        setError(msg || "Failed to create Supabase account.");
      }
    }
  }

  // Handle Forgot Password submit
  async function handleForgotSubmit(e) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    if (!isSupabaseConfigured()) {
      setError("Password reset requires a connected Supabase project.");
      return;
    }

    try {
      await supabaseResetPassword(forgotEmail.trim());
      setForgotSent(true);
      setTimeout(() => {
        setForgotSent(false);
        setForgotOpen(false);
        setForgotEmail("");
        setSuccessNotice("Password reset email sent from Supabase!");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    }
  }

  const content = (
    <div className={`auth-container ${isFullPage ? "full-page-auth" : "modal-auth"}`}>
      {!isFullPage && (
        <button
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          ×
        </button>
      )}

      <div className="auth-header">
        <div className="auth-brand-badge">
          <div className="brand-icon small-icon">
            <span className="brand-u">U</span>
            <span className="brand-r">R</span>
          </div>
          <span>UrMart Club</span>
        </div>

        <h2>{mode === "login" ? "Welcome back" : "Create an account"}</h2>
        <p>
          {mode === "login"
            ? "Sign in to access your curated wishlist, saved carts, and fast checkout."
            : "Join UrMart for member discounts, order tracking, and design insights."}
        </p>

        {/* Supabase Cloud Status Indicator */}
        <div className="auth-supabase-indicator">
          {isSupabaseConfigured() ? (
            <span className="sb-pill-active" title="Synced with Supabase Cloud Auth & PostgreSQL">
              <span className="sb-dot-green">●</span> Supabase Cloud Auth Active
            </span>
          ) : (
            <button
              type="button"
              className="sb-pill-connect"
              onClick={onOpenSupabaseConfig}
              title="Click to connect Supabase URL & Key"
            >
              <span>⚡ Connect Supabase Cloud</span>
            </button>
          )}
        </div>

        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
              setSuccessNotice("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
              setSuccessNotice("");
            }}
          >
            Create Account
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {successNotice && (
        <div className="auth-success-banner" role="status">
          <span>✓</span>
          <p>{successNotice}</p>
        </div>
      )}

      {mode === "login" ? (
        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <div className="auth-input-wrap">
              <span className="input-icon">✉</span>
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="field-label-row">
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="auth-input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <div className="auth-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In to UrMart →"}
          </button>

          <p className="auth-switch-prompt">
            Don't have an account yet?{" "}
            <button
              type="button"
              className="text-link-btn"
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccessNotice("");
              }}
            >
              Sign up here
            </button>
          </p>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleSignupSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Full Name</label>
            <div className="auth-input-wrap">
              <span className="input-icon">👤</span>
              <input
                id="signup-name"
                type="text"
                placeholder="e.g. Maya Sharma"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email Address</label>
            <div className="auth-input-wrap">
              <span className="input-icon">✉</span>
              <input
                id="signup-email"
                type="email"
                placeholder="maya@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Create Password</label>
            <div className="auth-input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="signup-password"
                type={showSignupPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                aria-label={showSignupPassword ? "Hide password" : "Show password"}
              >
                {showSignupPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>

            {/* Password strength bar */}
            {signupPassword && (
              <div className="pwd-strength-container">
                <div className="pwd-strength-bar">
                  <div
                    className="pwd-strength-fill"
                    style={{
                      width: `${(pwdStrength.score / 4) * 100}%`,
                      backgroundColor: pwdStrength.color
                    }}
                  />
                </div>
                <span
                  className="pwd-strength-label"
                  style={{ color: pwdStrength.color }}
                >
                  {pwdStrength.label}
                </span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <div className="auth-input-wrap">
              <span className="input-icon">✓</span>
              <input
                id="signup-confirm"
                type={showSignupPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="auth-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <span>
                I agree to UrMart's <b>Terms of Service</b> and <b>Privacy Policy</b>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account →"}
          </button>

          <p className="auth-switch-prompt">
            Already have an account?{" "}
            <button
              type="button"
              className="text-link-btn"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessNotice("");
              }}
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {/* Clearly separated Demo Guest Mode for testing without passwords */}
      <div className="auth-demo-section" style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border-color, #e0d8cc)" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #777)", textAlign: "center", marginBottom: "0.5rem" }}>
          — Or explore storefront as a Demo Guest (Read-Only Preview) —
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-btn"
            style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
            onClick={() => handleDemoLogin(0)}
          >
            👤 Guest: Sarah (Indiranagar)
          </button>
          <button
            type="button"
            className="secondary-btn"
            style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
            onClick={() => handleDemoLogin(1)}
          >
            👤 Guest: Alex (Bandra)
          </button>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {forgotOpen && (
        <div className="forgot-modal-backdrop" onClick={() => setForgotOpen(false)}>
          <div
            className="forgot-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Reset Your Password</h3>
            <p>
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleForgotSubmit}>
              <div className="auth-field">
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <div className="forgot-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setForgotOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {forgotSent ? "Sent ✓" : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullPage) {
    return (
      <main className="auth-page-wrapper">
        <div className="auth-page-visual">
          <div className="auth-visual-content">
            <span className="eyebrow">URMART MEMBERSHIP</span>
            <h1>
              Everyday living,
              <br />
              elevated for you.
            </h1>
            <p>
              Join thousands of design-conscious shoppers enjoying personalized recommendations, order tracking, and mindful home essentials.
            </p>
            <div className="auth-visual-badges">
              <span>✨ Exclusive member discounts</span>
              <span>📦 Live order status & history</span>
              <span>🤖 24/7 UrMart AI Shopping Assistant</span>
            </div>
          </div>
        </div>
        <div className="auth-page-card-area">{content}</div>
      </main>
    );
  }

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
