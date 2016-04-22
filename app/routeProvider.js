import React from 'react'
import { Provider } from 'react-redux'
import { Router, Route, browserHistory, IndexRedirect, IndexRoute, Redirect } from 'react-router'
import { replace } from 'react-router-redux'
import { config } from './config'

import App from './modules/app.js';
import SlackFeed from './modules/SlackFeed/containers/SlackFeedWrapper.container';
import Login from './modules/auth/containers/login.container';

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function requireAuth(nextState, replace) {
    window.moc_last_loc = nextState.location.pathname;
    var token = localStorage.getItem('SLACK_TOKEN');
    var param = getParameterByName('code');
    if (param){
        window.SLACK_AUTH_CODE = param;
        replace('/home')
    } else if (token) {
        window.SLACK_TOKEN = token;
        replace('/home')
    } else {
        window.location = 'https://slack.com/oauth/authorize?client_id=' + window.clientId + '&scope=client'
    }
}

function checkToken() {
    var token = localStorage.getItem('SLACK_TOKEN');
    var param = getParameterByName('code');
    if (token) {
        window.SLACK_TOKEN = token;
    } else if (param) {
        window.SLACK_AUTH_CODE = param;
    } else {
        replace('/')
    }
}




function routerOnUpdate(){
    //var event = document.createEvent('Event');
    //event.initEvent('build', true, true);
}

export default function createRouteProvider(store) {


    return <Provider store={store}>
        <Router history={browserHistory} onUpdate={routerOnUpdate}>
            <Route path="/" component={App} onEnter={requireAuth}>
                <IndexRoute component={Login}></IndexRoute>
            </Route>
            <Route path="/home" component={SlackFeed} onEnter={checkToken}>
            </Route>
            <Redirect from="*" to="/" />
        </Router>
    </Provider>
}