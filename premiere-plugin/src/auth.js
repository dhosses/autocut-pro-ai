/**
 * Supabase auth via direct REST API — no SDK needed in UXP environment.
 */

const SUPABASE_URL = "https://tzpmvnujmarfepfxvgiw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cG12bnVqbWFyZmVwZnh2Z2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODUyNDksImV4cCI6MjA5MjU2MTI0OX0.gbv3_4GPh9qVikma_yEXNPiCH-LbkHN6g7SIccJebMg";

const Auth = (() => {
  let _session = null;

  function _storageKey() { return "autocut_session"; }

  function _save(session) {
    _session = session;
    try { localStorage.setItem(_storageKey(), JSON.stringify(session)); } catch (_) {}
  }

  function _load() {
    if (_session) return _session;
    try {
      const raw = localStorage.getItem(_storageKey());
      if (raw) _session = JSON.parse(raw);
    } catch (_) {}
    return _session;
  }

  async function signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
    _save(data);
    return data;
  }

  async function signOut() {
    const session = _load();
    if (session?.access_token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session.access_token}`,
        },
      }).catch(() => {});
    }
    _session = null;
    try { localStorage.removeItem(_storageKey()); } catch (_) {}
  }

  async function getToken() {
    const session = _load();
    if (!session?.access_token) return null;

    // Refresh if within 5 minutes of expiry
    const expiresAt = session.expires_at * 1000;
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (res.ok) {
          const refreshed = await res.json();
          _save(refreshed);
          return refreshed.access_token;
        }
      } catch (_) {}
      // Refresh failed — force re-login
      _session = null;
      try { localStorage.removeItem(_storageKey()); } catch (_) {}
      return null;
    }

    return session.access_token;
  }

  function getUser() {
    const session = _load();
    return session?.user || null;
  }

  function isLoggedIn() {
    return !!_load()?.access_token;
  }

  return { signIn, signOut, getToken, getUser, isLoggedIn };
})();
