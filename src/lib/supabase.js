import { createClient } from "@supabase/supabase-js";

// Helper to sanitize config values
function clean(val) {
  if (!val || typeof val !== "string") return "";
  return val.trim();
}

// Check localStorage for runtime override first, then fallback to Vite env vars
export function getSupabaseConfig() {
  let runtimeConfig = null;
  try {
    const raw = localStorage.getItem("urmart_supabase_config");
    if (raw) runtimeConfig = JSON.parse(raw);
  } catch {
    // ignore
  }

  const url = clean(runtimeConfig?.url) || clean(import.meta.env?.VITE_SUPABASE_URL);
  const anonKey = clean(runtimeConfig?.anonKey) || clean(import.meta.env?.VITE_SUPABASE_ANON_KEY);

  const isValidUrl = url.startsWith("https://") && url.includes(".supabase.co");
  const isValidKey = anonKey.length > 20 && !anonKey.includes("your-anon-key");
  const isConfigured = Boolean(isValidUrl && isValidKey);

  return {
    url,
    anonKey,
    isConfigured,
    source: runtimeConfig?.url ? "localStorage" : import.meta.env?.VITE_SUPABASE_URL ? "env" : "none"
  };
}

let supabaseInstance = null;
let currentConfig = getSupabaseConfig();

function initSupabaseClient() {
  currentConfig = getSupabaseConfig();
  if (currentConfig.isConfigured) {
    try {
      supabaseInstance = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: "urmart-supabase-auth-token"
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
}

// Initial initialization
initSupabaseClient();

export function getSupabase() {
  if (!supabaseInstance && currentConfig.isConfigured) {
    return initSupabaseClient();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().isConfigured;
}

export function saveSupabaseConfig(url, anonKey) {
  try {
    localStorage.setItem(
      "urmart_supabase_config",
      JSON.stringify({ url: clean(url), anonKey: clean(anonKey) })
    );
  } catch (err) {
    console.error("Failed to save supabase config:", err);
  }
  return initSupabaseClient();
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem("urmart_supabase_config");
  } catch {
    // ignore
  }
  supabaseInstance = null;
  return initSupabaseClient();
}

/* ========================================================
   AUTHENTICATION HELPERS
   ======================================================== */

/**
 * Sign up with email & password, plus name and phone metadata
 */
export async function supabaseSignUp({ email, password, name, phone = "" }) {
  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase is not configured yet. Please provide your Supabase URL & Anon Key.");
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone
      }
    }
  });

  if (error) throw error;

  // Try creating or updating profile row in public.profiles table
  if (data?.user) {
    try {
      await client.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.email.split("@")[0],
          phone: phone || "",
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.warn("Could not upsert profile during signup (table might not exist yet):", err);
    }
  }

  return data;
}

/**
 * Sign in with email & password
 */
export async function supabaseSignIn({ email, password }) {
  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase is not configured yet. Please provide your Supabase URL & Anon Key.");
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Fetch linked profile from database if available
  let profile = null;
  if (data?.user) {
    try {
      profile = await supabaseFetchProfile(data.user.id);
    } catch {
      // ignore
    }
  }

  return {
    user: data.user,
    session: data.session,
    profile
  };
}

/**
 * Sign out current user
 */
export async function supabaseSignOut() {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * Get active session
 */
export async function supabaseGetSession() {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session) return null;
  return data.session;
}

/**
 * Send password reset email
 */
export async function supabaseResetPassword(email) {
  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase is not configured yet.");
  }
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) throw error;
}

/* ========================================================
   DATABASE HELPERS (Profiles, Orders, Addresses)
   ======================================================== */

/**
 * Fetch profile row from public.profiles
 */
export async function supabaseFetchProfile(userId) {
  const client = getSupabase();
  if (!client || !userId) return null;

  try {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Supabase fetchProfile note:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Supabase fetchProfile catch:", err);
    return null;
  }
}

/**
 * Update profile row in public.profiles
 */
export async function supabaseUpdateProfile(userId, updates) {
  const client = getSupabase();
  if (!client || !userId) return null;

  try {
    const { data, error } = await client
      .from("profiles")
      .upsert(
        {
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase updateProfile error:", err);
    throw err;
  }
}

/**
 * Fetch all orders for a user from public.orders
 */
export async function supabaseFetchOrders(userId) {
  const client = getSupabase();
  if (!client || !userId) return [];

  try {
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchOrders note:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn("Supabase fetchOrders catch:", err);
    return [];
  }
}

/**
 * Save new order to public.orders
 */
export async function supabaseCreateOrder(order) {
  const client = getSupabase();
  if (!client) return null;

  try {
    const payload = {
      id: order.id,
      user_id: order.userId || order.user_id,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      shipping: order.shipping || 0,
      total: order.total,
      coupon_code: order.couponCode || order.coupon_code || null,
      shipping_address: order.shippingAddress || order.shipping_address,
      payment_method: order.paymentMethod || order.payment_method || "UPI",
      status: order.status || "Processing",
      created_at: order.createdAt || new Date().toISOString()
    };

    const { data, error } = await client
      .from("orders")
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Supabase createOrder note (table might not exist yet):", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Supabase createOrder error:", err);
    return null;
  }
}
