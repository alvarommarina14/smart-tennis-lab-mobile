import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'stl.accessToken';
const REFRESH_KEY = 'stl.refreshToken';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type Coach = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  coach: Coach;
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let pendingRefresh: Promise<string | null> | null = null;
let onSessionLost: (() => void) | null = null;

export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler;
}

export async function restoreSession() {
  const [storedAccess, storedRefresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  accessToken = storedAccess;
  refreshToken = storedRefresh;
  return { accessToken, refreshToken };
}

export async function saveSession(payload: AuthPayload) {
  accessToken = payload.accessToken;
  refreshToken = payload.refreshToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, payload.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, payload.refreshToken),
  ]);
}

export async function clearSession() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function refreshAccessToken(): Promise<string | null> {
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await clearSession();
        onSessionLost?.();
        return null;
      }

      const payload = (await response.json()) as AuthPayload;
      await saveSession(payload);
      return payload.accessToken;
    } catch {
      return null;
    } finally {
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}
