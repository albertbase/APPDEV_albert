import { call, put, takeLatest } from 'redux-saga/effects';

import {
  USER_LOGIN,
  USER_LOGIN_COMPLETE,
  USER_LOGIN_ERROR,
  USER_LOGIN_REQUEST,
  type LoginResponse,
  type UserLoginAction,
} from '../actions';
import { userLogin as userLoginApi } from '../api/auth';

export function* userLoginAsync(action: UserLoginAction): Generator {
  try {
    yield put({ type: USER_LOGIN_REQUEST });

    const data = (yield call(userLoginApi, action.payload)) as LoginResponse;

    yield put({
      type: USER_LOGIN_COMPLETE,
      payload: data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';

    yield put({
      type: USER_LOGIN_ERROR,
      error: message,
    });
  }
}

export function* watchUserLogin(): Generator {
  yield takeLatest(USER_LOGIN, userLoginAsync);
}
