import Immutable from 'immutable';
import { config } from '../../../config'

var i = {
    userList: Immutable.List([]),
    channelList: Immutable.List([])
};

// instantiate channel message collections as empty lists so we don't have to deal with undefined exceptions
config.channels.map(configChannel => {
    i[configChannel.name + 'Messages'] = Immutable.List([])
});

var initialState = i;

const WEBSOCKET_ON_MESSAGE = 'clutch/clutchSlackFeed/websocketOnMessage';

const RTM_START = 'clutch/clutchSlackFeed/rtmStart';
const RTM_START_SUCCESS = 'clutch/clutchSlackFeed/rtmStartSuccess';
const RTM_START_FAILURE = 'clutch/clutchSlackFeed/rtmStartFailure';

const CODE_FOR_TOKEN = 'clutch/clutchSlackFeed/codeForToken';
const CODE_FOR_TOKEN_SUCCESS = 'clutch/clutchSlackFeed/codeForTokenSuccess';
const CODE_FOR_TOKEN_FAILURE = 'clutch/clutchSlackFeed/codeForTokenFailure';

const GET_CHANNEL_LIST = 'clutch/clutchSlackFeed/getChannelList';
const GET_CHANNEL_LIST_SUCCESS = 'clutch/clutchSlackFeed/getChannelListSuccess';
const GET_CHANNEL_LIST_FAILURE = 'clutch/clutchSlackFeed/getChannelListFailure';

const GET_HISTORY_FOR_CHANNEL = 'clutch/clutchSlackFeed/getHistoryForChannel';
const GET_HISTORY_FOR_CHANNEL_SUCCESS = 'clutch/clutchSlackFeed/getHistoryForChannelSuccess';
const GET_HISTORY_FOR_CHANNEL_FAILURE = 'clutch/clutchSlackFeed/getHistoryForChannelFailure';

const GET_HISTORY_FOR_GROUP = 'clutch/clutchSlackFeed/getHistoryForGroup';
const GET_HISTORY_FOR_GROUP_SUCCESS = 'clutch/clutchSlackFeed/getHistoryForGroupSuccess';
const GET_HISTORY_FOR_GROUP_FAILURE = 'clutch/clutchSlackFeed/getHistoryForGroupFailure';

export default function Events(state = initialState, action) {
    switch (action.type) {
        // WEBSOCKET_ON_MESSAGE
        case WEBSOCKET_ON_MESSAGE:
        {
            if (action.event.type === 'message' && action.event.subtype !== 'channel_join') {
                let channelIndex = state.channelList.findIndex(obj => obj.get('id') === action.event.channel);
                let channel = state.channelList.get(channelIndex);
                let s = {};

                config.channels.map(configChannel => {
                    if (channel.get('name') == configChannel.name){
                        let idx = state[configChannel.name + 'Messages'].findIndex(obj => obj.get('ts') === action.event.ts);
                        if (idx !== -1) return state;


                        s[configChannel.name + 'Messages'] = state[configChannel.name + 'Messages'].push(Immutable.fromJS(action.event))
                    }
                });

                return Object.assign({}, state, s);
            }

            return state;
        }

        case GET_HISTORY_FOR_CHANNEL:
            return Object.assign({}, state, {
                isFetchingChannelHistory: true
            });

        case GET_HISTORY_FOR_CHANNEL_SUCCESS:
        {
            let channelIndex = state.channelList.findIndex(obj => obj.get('id') === action.channelId);
            let channel = state.channelList.get(channelIndex);
            var s = {
                isFetchingChannelHistory: false
            };

            config.channels.map(configChannel => {
                if (channel.get('name') == configChannel.name){

                    s[configChannel.name + 'Messages'] = state[configChannel.name + 'Messages'].merge(Immutable.fromJS(action.result.messages).reverse());

                }
            });

            return Object.assign({}, state, s);
        }

        case GET_HISTORY_FOR_CHANNEL_FAILURE:
            return Object.assign({}, state, {
                isFetchingGroupHistory: false
            });

        case GET_HISTORY_FOR_GROUP:
            return Object.assign({}, state, {
                isFetchingGroupHistory: true
            });

        case GET_HISTORY_FOR_GROUP_SUCCESS:
        {
            let channelIndex = state.channelList.findIndex(obj => obj.get('id') === action.channelId);
            let channel = state.channelList.get(channelIndex);
            var s = {
                isFetchingChannelHistory: false
            };

            config.channels.map(configChannel => {
                if (channel.get('name') == configChannel.name){

                    s[configChannel.name + 'Messages'] = state[configChannel.name + 'Messages'].merge(Immutable.fromJS(action.result.messages).reverse());
                }
            });

            return Object.assign({}, state, s);
        }


        case GET_HISTORY_FOR_GROUP_FAILURE:
            return Object.assign({}, state, {
                isFetchingGroupHistory: false
            });

        case RTM_START_SUCCESS:
        {
            return Object.assign({}, state, {
                userList: Immutable.fromJS(action.result.users.concat(action.result.bots)),
                channelList: Immutable.fromJS(action.result.channels.concat(action.result.groups))
            });
        }


        default:
            return state;
    }
}

export function websocketOnMessage(event) {
    return {
        type: WEBSOCKET_ON_MESSAGE,
        event: event
    }
}

export function rtmStart(token) {
    return {
        types: [RTM_START, RTM_START_SUCCESS, RTM_START_FAILURE],
        promise: (client) => client.post('/api/rtmStart', {data: {token: token}})

    }
}

export function exchangeCodeForToken(code, clientId, clientSecret) {
    return {
        types: [CODE_FOR_TOKEN, CODE_FOR_TOKEN_SUCCESS, CODE_FOR_TOKEN_FAILURE],
        promise: (client) => client.post('/api/exchangeCode', {
            data: {
                code: code,
                clientId: clientId,
                clientSecret: clientSecret
            }
        })
    }
}

export function getHistoryForChannel(token, channelId) {
    return {
        types: [GET_HISTORY_FOR_CHANNEL, GET_HISTORY_FOR_CHANNEL_SUCCESS, GET_HISTORY_FOR_CHANNEL_FAILURE],
        promise: (client) => client.post('/api/channelHistory', {data: {token: token, channel: channelId}}),
        channelId: channelId

    }
}

export function getHistoryForGroup(token, channelId) {
    return {
        types: [GET_HISTORY_FOR_GROUP, GET_HISTORY_FOR_GROUP_SUCCESS, GET_HISTORY_FOR_GROUP_FAILURE],
        promise: (client) => client.post('/api/groupHistory', {data: {token: token, channel: channelId}}),
        channelId: channelId

    }
}


