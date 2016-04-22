import '!style!css!sass!clutch-ui-common/styleguide/site-full.scss'
//import '!style!css!sass!font-awesome/scss/font-awesome.scss'
import React from 'react'
import { render } from 'react-dom'
import ApiClient from 'clutch-ui-common/helpers/ApiClient';
import createStore  from './redux/create'
import { Provider } from 'react-redux'
import App from './modules/app'
import createRouteProvider from './routeProvider'

const client = new ApiClient();
const store = createStore(client);
let rootElement = document.getElementById('root');


render(
    createRouteProvider(store),
    rootElement
);
