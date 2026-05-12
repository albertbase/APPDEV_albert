import {
  RESET_USER_LOGIN,
  USER_LOGIN_COMPLETE,
  USER_LOGIN_ERROR,
  USER_LOGIN_REQUEST,
  type AuthAction,
  type AuthState,
} from '../actions';

const INITIAL_STATE: AuthState = {
  data: null,
  isAuthenticated: false,
  isLoading: false,
  isError: false,
  error: null,
};

const reducer = (
  state: AuthState = INITIAL_STATE,
  action: AuthAction,
): AuthState => {
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return {
        ...state,
        data: null,
        isAuthenticated: false,
        isLoading: true,
        isError: false,
        error: null,
      };

    case USER_LOGIN_COMPLETE:
      return {
        ...state,
        data: action.payload ?? null,
        isAuthenticated: true,
        isLoading: false,
        isError: false,
        error: null,
      };

    case USER_LOGIN_ERROR:
      return {
        ...state,
        data: null,
        isAuthenticated: false,
        isLoading: false,
        isError: true,
        error: action.error ?? 'Login failed',
      };

    case RESET_USER_LOGIN:
      return INITIAL_STATE;

    default:
      return state;
  }
};

export default reducer;
