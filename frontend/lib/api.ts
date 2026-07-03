import type {
  User,
  Event,
  Session,
  Photo,
  PublicSession,
  DashboardStats,
  DownloadStats,
  PaginatedResponse,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const stored = localStorage.getItem("photodelivery_auth");
    if (stored) {
      const auth = JSON.parse(stored);
      if (auth.accessToken) {
        headers["Authorization"] = `Bearer ${auth.accessToken}`;
      }
    }
  } catch {}
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  events: {
    list: (page = 1, limit = 20) =>
      request<PaginatedResponse<Event>>(`/events?page=${page}&limit=${limit}`),
    get: (id: string) => request<Event>(`/events/${id}`),
    create: (data: any) => request<Event>("/events", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<Event>(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/events/${id}`, { method: "DELETE" }),
  },

  sessions: {
    list: (params: any = {}) => {
      const qs = new URLSearchParams();
      if (params.event_id) qs.set("event_id", params.event_id);
      if (params.search) qs.set("search", params.search);
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      return request<PaginatedResponse<Session>>(`/sessions?${qs}`);
    },
    get: (id: string) => request<Session>(`/sessions/${id}`),
    getActive: () => request<Session | null>("/sessions/active"),
    create: (data: any) => request<Session>("/sessions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<Session>(`/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/sessions/${id}`, { method: "DELETE" }),
  },

  photos: {
    list: (params: any = {}) => {
      const qs = new URLSearchParams();
      if (params.session_id) qs.set("session_id", params.session_id);
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      return request<PaginatedResponse<Photo>>(`/photos?${qs}`);
    },
    get: (id: string) => request<Photo>(`/photos/${id}`),
    delete: (id: string) => request<void>(`/photos/${id}`, { method: "DELETE" }),
    move: (id: string, target_session_id: string) =>
      request<Photo>(`/photos/${id}/move`, { method: "POST", body: JSON.stringify({ target_session_id }) }),
  },

  dashboard: {
    stats: (event_id?: string) =>
      request<DashboardStats>(`/dashboard/stats${event_id ? `?event_id=${event_id}` : ""}`),
  },

  downloads: {
    stats: (event_id?: string) =>
      request<DownloadStats>(`/downloads/stats${event_id ? `?event_id=${event_id}` : ""}`),
  },

  public: {
    getSession: (code: string) => request<PublicSession>(`/public/s/${code}`),
  },
};

export function photoDownloadUrl(id: string) {
  return `${API_URL}/photos/${id}/download`;
}

export function sessionZipUrl(id: string) {
  return `${API_URL}/downloads/sessions/${id}/zip`;
}
