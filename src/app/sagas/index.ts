import { all } from 'redux-saga/effects';

import { watchUserLogin } from './auth';

export default function* rootSaga(): Generator {
  yield all([
    // AUTH/Login
    watchUserLogin(),
  ]);
}
