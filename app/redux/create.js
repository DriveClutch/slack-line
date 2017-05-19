import { createStore as _createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { routerMiddleware, routerReducer } from 'react-router-redux'
import { browserHistory } from 'react-router'
import createMiddleware from '@clutch/clutch-ui-common/middleware/clientMiddleware';
import transitionMiddleware from '@clutch/clutch-ui-common/middleware/transitionMiddleware';
import reducers from 'app/reducers';

const reduxRouterMiddleware = routerMiddleware(browserHistory);

export default function createStore(client) {
    const middleware = [createMiddleware(client), reduxRouterMiddleware];

    let finalCreateStore = applyMiddleware(...middleware)(_createStore);
    let r = Object.assign({}, reducers, {
        routing: routerReducer
    });
    const store = finalCreateStore(combineReducers(r));

    return store;
}