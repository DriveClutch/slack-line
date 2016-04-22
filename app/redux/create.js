import { createStore as _createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { routerMiddleware, routeReducer } from 'react-router-redux'
import { browserHistory } from 'react-router'
import createMiddleware from 'clutch-ui-common/middleware/clientMiddleware';
import transitionMiddleware from 'clutch-ui-common/middleware/transitionMiddleware';
import reducers from 'app/reducers';

const reduxRouterMiddleware = routerMiddleware(browserHistory);

export default function createStore(client) {
    const middleware = [createMiddleware(client), reduxRouterMiddleware];

    let finalCreateStore = applyMiddleware(...middleware)(_createStore);
    let r = Object.assign({}, reducers, {
        routing: routeReducer
    });
    const store = finalCreateStore(combineReducers(r));

    return store;
}