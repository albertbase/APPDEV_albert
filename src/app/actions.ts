export const USER_LOGIN = 'USER_LOGIN' as const;
export const USER_LOGIN_REQUEST = 'USER_LOGIN_REQUEST' as const;
export const USER_LOGIN_COMPLETE = 'USER_LOGIN_COMPLETE' as const;
export const USER_LOGIN_ERROR = 'USER_LOGIN_ERROR' as const;
export const RESET_USER_LOGIN = 'RESET_USER_LOGIN' as const;

export interface LoginPayload {
  username: string;
  password: string;
}

export type LoginResponse = Record<string, unknown> & {
  username?: string;
  loginSuccess?: boolean;
  offlineMode?: boolean;
};

export interface AuthState {
  data: LoginResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export type UserLoginAction = {
  type: typeof USER_LOGIN;
  payload: LoginPayload;
};

export type UserLoginRequestAction = {
  type: typeof USER_LOGIN_REQUEST;
};

export type UserLoginCompleteAction = {
  type: typeof USER_LOGIN_COMPLETE;
  payload: LoginResponse | null;
};

export type UserLoginErrorAction = {
  type: typeof USER_LOGIN_ERROR;
  error: string;
};

export type ResetUserLoginAction = {
  type: typeof RESET_USER_LOGIN;
};

export type AuthAction =
  | UserLoginAction
  | UserLoginRequestAction
  | UserLoginCompleteAction
  | UserLoginErrorAction
  | ResetUserLoginAction;

export const authLogin = (payload: LoginPayload): UserLoginAction => ({
  type: USER_LOGIN,
  payload,
});

export const authLogout = (): ResetUserLoginAction => ({
  type: RESET_USER_LOGIN,
});
