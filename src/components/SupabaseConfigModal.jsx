import { useState } from "react";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  testSupabaseConnection
} from "../lib/supabase";

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url || "");
  const [anonKey, setAnonKey] = useState(current.anonKey || "");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const sqlSchemaSnippet = `-- Run this in Supabase Dashboard -> SQL Editor:
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  phone text default '',
  avatar text default '',
  addresses jsonb default '[]'::jsonb,
  wishlist jsonb default '[]'::jsonb,
  cart jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0 check (subtotal >= 0),
  discount numeric not null default 0 check (discount >= 0),
  shipping numeric not null default 0 check (shipping >= 0),
  total numeric not null default 0 check (total >= 0),
  coupon_code text,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_method text not null default 'UPI (Simulated Demo)',
  status text not null default 'Confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Least privilege SQL grants
grant usage on schema public to anon, authenticated;
revoke all on table public.profiles from anon;
revoke all on table public.orders from anon;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.orders to authenticated;
grant all on table public.profiles to service_role;
grant all on table public.orders to service_role;`;

  async function handleSave(e) {
    e.preventDefault();
    setNotice("");
    if (!url.trim() || !anonKey.trim()) {
      setNotice("Please provide both Supabase Project URL and Anon API Key.");
      return;
    }

    setIsTesting(true);
    const probe = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);

    if (probe.ok) {
      saveSupabaseConfig(url, anonKey);
      setNotice(probe.message);
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } else {
      setNotice(`❌ Connection failed: ${probe.message}`);
    }
  }

  function handleClear() {
    clearSupabaseConfig();
    setUrl("");
    setAnonKey("");
    setNotice("Supabase credentials cleared. Switched back to local storage.");
    if (onConfigSaved) onConfigSaved();
  }

  function handleCopySQL() {
    navigator.clipboard?.writeText(sqlSchemaSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="supabase-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supabase-modal-title"
      >
        <button
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close Supabase configuration"
        >
          ×
        </button>

        <div className="supabase-modal-header">
          <div className="supabase-brand-pill">
            <span className="supabase-bolt">⚡</span>
            <span>Supabase Cloud Integration</span>
          </div>

          <h2 id="supabase-modal-title">Connect Cloud Database & Auth</h2>
          <p>
            Connect your Supabase project for real cross-device login, user profiles, and order
            history stored in PostgreSQL.
          </p>

          <div className="supabase-status-banner">
            <span className={`status-dot ${isSupabaseConfigured() ? "connected" : "idle"}`} />
            <span>
              {isSupabaseConfigured()
                ? "Status: Active & Connected to Supabase"
                : "Status: Not configured yet (Running in local storage fallback)"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="supabase-config-form">
          <div className="form-group">
            <label htmlFor="sb-url">Supabase Project URL</label>
            <input
              id="sb-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              required
            />
            <small>Found in Supabase Dashboard → Project Settings → API</small>
          </div>

          <div className="form-group">
            <label htmlFor="sb-key">Anon / Public API Key</label>
            <input
              id="sb-key"
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
            />
            <small>Public anon key (safe for client-side React applications)</small>
          </div>

          {notice && (
            <div className={`supabase-alert ${notice.startsWith("✓") ? "success" : "error"}`}>
              {notice}
            </div>
          )}

          <div className="supabase-action-row">
            <button
              type="submit"
              className="primary-button supabase-submit-btn"
              disabled={isTesting}
            >
              {isTesting ? "Connecting..." : "Save & Activate Supabase"}
            </button>

            {isSupabaseConfigured() && (
              <button
                type="button"
                className="secondary-outline-button clear-btn"
                onClick={handleClear}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        <div className="supabase-sql-helper">
          <div className="sql-helper-title">
            <span>Database Tables & RLS Policies (PostgreSQL)</span>
            <button
              type="button"
              className="copy-sql-btn"
              onClick={handleCopySQL}
            >
              {copied ? "✓ Copied to clipboard!" : "Copy SQL Script"}
            </button>
          </div>
          <p className="sql-helper-desc">
            Paste this SQL script in your <b>Supabase Dashboard → SQL Editor → New Query</b> to set up
            the <code>profiles</code> and <code>orders</code> tables with secure Row-Level Security.
          </p>
        </div>

        <div className="supabase-vercel-tip">
          <strong>Tip for Vercel Deployment:</strong>
          <p>
            When deploying on Vercel, you can also paste these into your Vercel Project Settings →{" "}
            <b>Environment Variables</b>:
            <br />
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
