import { applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import auth from '../reducers/auth.js';

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
    auth,
});

export default () => {
    let store = createStore(rootReducer, applyMiddleware(sagaMiddleware));
    let runSaga = sagaMiddleware.run ;

    return { store, runSaga };
};
