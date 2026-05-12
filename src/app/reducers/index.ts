import {
  applyMiddleware,
  combineReducers,
  createStore,
} from 'redux';
import createSagaMiddleware from 'redux-saga';

import auth from './auth';

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  auth,
});

export type RootState = ReturnType<typeof rootReducer>;

const configureStore = () => {
  const store = createStore(
    rootReducer,
    undefined,
    applyMiddleware(sagaMiddleware),
  );

  return {
    store,
    runSaga: sagaMiddleware.run,
  };
};

export type AppStore = ReturnType<typeof configureStore>['store'];

export default configureStore;
