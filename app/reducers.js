
// We need to import each module here. They wil. get passed in to redux's combine combineReducers
// each module contains the reducer(s) and actions for a specific unit of functionality
import SlackFeedReducer from './modules/SlackFeed/ducks/SlackFeed.reducer';
import AuthReducer from './modules/auth/ducks/auth.reducer';

var reducers = Object.assign({}, {}, {
    SlackFeed: SlackFeedReducer,
    auth: AuthReducer
});

export default reducers;