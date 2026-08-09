/**
 * Cliente HTTP mínimo contra el backend de Smart Tennis Lab.
 *
 * Deliberadamente delgado: la app no depende de este cliente para funcionar durante un partido
 * —los taps se guardan primero en SQLite—, así que acá solo hace falta lo justo para hablar con
 * la API cuando hay señal.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  // Falla temprano y con un mensaje claro en vez de tirar "Network request failed" en runtime.
  console.warn(
    'EXPO_PUBLIC_API_URL no está definida. Copiá .env.example a .env y apuntá a tu backend.'
  );
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Token de acceso; se agrega como Bearer si viene. */
  accessToken?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; detail?: string };
    return payload.message ?? payload.detail ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
