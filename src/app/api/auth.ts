import { Platform } from 'react-native';

import type { LoginPayload, LoginResponse } from '../actions';

interface AppConfig {
  API_BASE_URL?: string;
  LOGIN_PATHS?: string[];
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
  errors?: {
    password?: string;
    username?: string;
    email?: string;
    identifier?: string;
  };
}

interface LoginRequestError extends Error {
  status?: number;
  endpoint?: string;
}

type GlobalWithConfig = typeof globalThis & {
  __APP_CONFIG__?: AppConfig;
};

const DEFAULT_BASE_URL =
  Platform.select({
    // Android emulators cannot reach the host machine via 127.0.0.1.
    // 10.0.2.2 maps back to the computer running Metro/Symfony.
    android: 'http://10.0.2.2:8000',
    ios: 'http://127.0.0.1:8000',
    default: 'http://127.0.0.1:8000',
  }) ?? 'http://127.0.0.1:8000';

// Set this to your Symfony server URL when running on a physical device or remote backend.
// Example: 'http://192.168.1.50:8000'
// You can also inject `globalThis.__APP_CONFIG__ = { API_BASE_URL, LOGIN_PATHS }`
// from app startup if you want to avoid editing this file for each environment.
const BASE_URL = 'http://172.21.90.236:8000';
const APP_CONFIG: AppConfig = (globalThis as GlobalWithConfig).__APP_CONFIG__ ?? {};
const API_BASE_URL = APP_CONFIG.API_BASE_URL ?? BASE_URL ?? DEFAULT_BASE_URL;
const REQUEST_TIMEOUT_MS = 10000;
const LOGIN_PATHS = APP_CONFIG.LOGIN_PATHS ?? [
  '/api/login',
  '/api/login_check',
  '/api/login-check',
  '/login_check',
  '/login-check',
  '/login',
];

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const createTimeoutSignal = (
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
};

const parseErrorMessage = (data: unknown): string => {
  const payload = (data ?? {}) as ApiErrorPayload;

  return (
    payload.message ??
    payload.error ??
    payload.title ??
    payload.detail ??
    payload.errors?.password ??
    payload.errors?.username ??
    payload.errors?.email ??
    payload.errors?.identifier ??
    'Login failed'
  );
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export async function userLogin({
  username,
  password,
}: LoginPayload): Promise<LoginResponse> {
  const baseUrl = normalizeBaseUrl(API_BASE_URL);
  const { signal, cleanup } = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const loginPayload = {
    username,
    password,
    email: username,
    identifier: username,
    user_identifier: username,
    _username: username,
    _password: password,
  };
  const options: RequestInit = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    // Includes the most common Symfony field names used by json_login and custom login handlers.
    body: JSON.stringify(loginPayload),
    signal,
  };
  let lastError: LoginRequestError | null = null;
  const attemptedEndpoints: string[] = [];

  try {
    for (const path of LOGIN_PATHS) {
      const endpoint = baseUrl + path;
      attemptedEndpoints.push(endpoint);
      const response = await fetch(endpoint, options);
      const data = await parseResponseBody(response);

      if (response.ok) {
        if (data && typeof data === 'object') {
          return data as LoginResponse;
        }

        return {
          username,
          loginSuccess: true,
        };
      }

      const message = parseErrorMessage(data);
      const error = new Error(
        `Login failed (${response.status}) at ${endpoint}: ${message}`,
      ) as LoginRequestError;
      error.status = response.status;
      error.endpoint = endpoint;
      lastError = error;

      // Only try another route when the server says this path does not exist
      // or the method is not supported.
      if (response.status !== 404 && response.status !== 405) {
        throw error;
      }
    }

    throw (
      lastError ??
      new Error(
        `Unable to reach a login endpoint at ${baseUrl}. Tried: ${attemptedEndpoints.join(', ')}`,
      )
    );
  } catch (error: unknown) {
    const requestError = error as Partial<Error> & { name?: string };

    if (requestError.name === 'AbortError') {
      throw new Error(
        `Login request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Check your Symfony backend URL: ${baseUrl}`,
      );
    }

    throw new Error(
      requestError.message ??
        `Cannot reach Symfony backend at ${baseUrl}. Check API host/IP and server status.`,
    );
  } finally {
    cleanup();
  }
}
