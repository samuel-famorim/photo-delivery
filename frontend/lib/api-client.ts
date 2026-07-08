import { getToken, refreshAccessToken, clearAuth } from "@/lib/auth";

/** Single source for the API base URL. Empty = same origin (Docker/Nginx). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Full base including /api/v1 prefix — use for constructing fetch URLs. */
function apiBase(): string {
  if (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === "") {
    // Same-origin: Nginx proxies /api/ → backend
    return "";
  }
  return API_BASE_URL;
}

const API_PREFIX = "/api/v1";

function buildUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = apiBase();
  return `${base}${API_PREFIX}${path}`;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/** Refresh token with deduplication (only one concurrent refresh). */
async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = refreshAccessToken(API_BASE_URL).finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  /** If true, skip auth token check. For public endpoints like /public/s/{code}. */
  public?: boolean;
}

/**
 * Centralized fetch with:
 * - Automatic auth header injection
 * - 401 detection → refresh token → retry
 * - Request timeout (default 30s)
 * - Network error retry (default 2, exponential backoff)
 * - Redirect to /login on auth failure
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, retries = 2, public: isPublic, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const token = getToken();

  // Public routes (e.g. /public/s/{code}) don't require auth
  if (!isPublic && !token) {
    clearTimeout(timeoutId);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Not authenticated");
  }

  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(buildUrl(path), {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 401 — try refresh once (only for authenticated routes)
      if (res.status === 401 && !isPublic) {
        const newToken = await refreshToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          const retryRes = await fetch(buildUrl(path), {
            ...fetchOptions,
            headers,
          });
          if (retryRes.ok) {
            if (retryRes.status === 204) return undefined as T;
            return retryRes.json();
          }
          const errData = await retryRes.json().catch(() => ({}));
          throw new Error(errData.detail || `HTTP ${retryRes.status}`);
        }
        // Refresh failed — redirect to login
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Session expired");
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      if (res.status === 204) return undefined as T;
      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // Don't retry on abort, auth errors, or HTTP errors (only network errors)
      if (err.name === "AbortError") {
        throw new Error("Request timed out. Check your connection.");
      }
      if (err.message === "Not authenticated" || err.message === "Session expired") {
        throw err;
      }
      // Only retry on network errors (TypeError from fetch)
      if (attempt < retries && err instanceof TypeError) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Request failed");
}

/** Build a download URL with token as query param. */
export function getDownloadUrl(path: string): string {
  const token = getToken();
  const base = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  if (!token) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

/** Extract a user-friendly error message from any error type. */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Ocorreu um erro inesperado";
}

/** Resolve a logo/image URL: if relative, prepend the API base URL. */
export function resolveLogoUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE_URL}/${url.replace(/^\//, "")}`;
}
