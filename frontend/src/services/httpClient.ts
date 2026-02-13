class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type TokenGetter = () => string | null;

class HttpClient {
  private readonly baseUrl: string;
  private tokenGetter: TokenGetter = () => null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenGetter(getter: TokenGetter): void {
    this.tokenGetter = getter;
  }

  async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');

    const token = this.tokenGetter();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const fallbackMessage = `Request failed with status ${response.status}`;
      const errorPayload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      throw new ApiError(errorPayload?.message ?? fallbackMessage, response.status);
    }

    return (await response.json()) as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const httpClient = new HttpClient(API_BASE_URL);
export { ApiError };
