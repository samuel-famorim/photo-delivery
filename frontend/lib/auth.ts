// SECURITY NOTE: Tokens stored in localStorage for simplicity.
// For production, migrate to httpOnly cookies managed by the backend
// (Set-Cookie with HttpOnly; Secure; SameSite=Strict; Path=/).

const AUTH_KEY = "photodelivery_auth";

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  user?: { id: string; email: string; name: string; role: string };
}

export function getAuth(): AuthState | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/** Decode a JWT safely, handling URL-safe base64. */
function decodeJWT(token: string): { exp?: number; sub?: string } | null {
  try {
    const base64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const auth = getAuth();
  if (!auth?.accessToken) return false;
  const payload = decodeJWT(auth.accessToken);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

/** Returns the access token or null. Single source — import only from here. */
export function getToken(): string | null {
  return getAuth()?.accessToken || null;
}

/** Returns the refresh token or null. */
export function getRefreshToken(): string | null {
  return getAuth()?.refreshToken || null;
}

/** Attempt to refresh the access token. Returns new token or null. */
export async function refreshAccessToken(apiBaseUrl: string): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    const auth = getAuth();
    if (auth && data.access_token) {
      auth.accessToken = data.access_token;
      if (data.refresh_token) auth.refreshToken = data.refresh_token;
      setAuth(auth);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}
