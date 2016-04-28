import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux'
import classNames from 'classnames';
import Immutable from 'immutable';
import moment from 'moment';
import emoji from 'node-emoji';
import { rtmStart, websocketOnMessage, exchangeCodeForToken, getHistoryForChannel, getHistoryForGroup } from '../ducks/slackFeed.reducer';
import '!style!css!sass!../css/slackFeed.scss';
import { config } from '../../../config';

class SlackFeedWrapper extends Component {
    componentDidMount(){
        if (window.SLACK_AUTH_CODE){
            this.props.dispatch(exchangeCodeForToken(window.SLACK_AUTH_CODE, window.clientId)).then(response => {
                if (response && !response.error){
                    window.SLACK_TOKEN = response.result.access_token;
                    localStorage.setItem('SLACK_TOKEN', response.result.access_token);
                    return this.props.dispatch(rtmStart(response.result.access_token));
                }
            }).then(response => {
                if (response && !response.error) {
                    window.wsUrl = response.result.url;

                    if (response && !response.error){
                        var socket = new WebSocket(window.wsUrl);
                        socket.onmessage = (event) => {
                            this.props.dispatch(websocketOnMessage(JSON.parse(event.data)))
                        }
                    }
                }
            })
        }

        if (window.SLACK_TOKEN){
            this.props.dispatch(rtmStart(window.SLACK_TOKEN)).then(response => {
                if (response && !response.error) {
                    window.wsUrl = response.result.url;
                    return this.fetchChannelHistories(Immutable.fromJS(response.result.channels.concat(response.result.groups)));
                }
            }).then(response => {
                if (response && !response.error){
                    var socket = new WebSocket(window.wsUrl);
                    socket.onmessage = (event) => {
                        this.props.dispatch(websocketOnMessage(JSON.parse(event.data)));
                        window.setTimeout(() => {
                            //console.log('forcing update');
                            //this.forceUpdate();
                            config.channels.map(configChannel => {
                                document.getElementById(configChannel.name + 'Messages').scrollIntoView(true);
                            });
                        })
                    }
                }
            });
        }
    }

    fetchChannelHistories(channels){
        var promises = [];
        config.channels.map(channel => {
            var c = channels.find(obj => obj.get('name') === channel.name);
            if (c){
                if (c.get('is_group')){
                    promises.push(this.props.dispatch(getHistoryForGroup(window.SLACK_TOKEN, c.get('id'))))
                } else {
                    promises.push(this.props.dispatch(getHistoryForChannel(window.SLACK_TOKEN, c.get('id'))))
                }
            }

        });

        return Promise.all(promises);
    }

    buildMessage(message){
        var user = this.props.userList.get(this.props.userList.findIndex(obj => obj.get('id') === message.get('user') || obj.get('id') === message.get('bot_id')));

        if (message.get('subtype') === 'channel_join' || message.get('subtype') === 'group_join'){
            return '';
        }

        return <div className="message flex" key={message.get('ts')}>
            <div className="user-image flex-0-0-auto">
                <img src={this.getUserProfileImage(user, message)} alt="user profile image"/>
            </div>
            <div className="message-content flex-1-1-auto">
                <div className="flex align-center name-row">
                    <h5>{message.get('username') || user.get('name')}</h5>
                    <span>{moment(parseInt(message.get('ts').split('.')[0] + '000')).calendar()}</span>
                </div>
                <div className="message-text">
                    <p>{this.parseMessageBody.bind(this)(this.removeURLs.bind(this)(emoji.emojify(message.get('text'))))}</p>
                </div>
                <div className={classNames({hide: !message.get('attachments')})}>
                    {
                        (message.get('attachments') || Immutable.List([])).map((attachment, index) =>
                            <div key={index}>
                                <p>{this.parsePretext(attachment.get('pretext'))}</p>
                                <div style={{borderLeft: '3px solid #' + attachment.get('color'), paddingLeft: '10px'}} className={classNames({hide: !attachment.get('fields') || !attachment.get('fields').size})}>
                                    {
                                        (attachment.get('fields') || Immutable.List([])).map((field, index) =>
                                            <div className="message-field" key={index}>
                                                <h5>{field.get('title')}</h5>
                                                <p>{field.get('value')}</p>
                                            </div>
                                        )
                                    }
                                </div>
                                <div style={{borderLeft: '3px solid #' + attachment.get('color'), paddingLeft: '10px'}} className={classNames({hide: !attachment.get('text')})}>
                                    <p className="line-clamp">{attachment.get('text')}</p>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    }

    parseMessageBody(bodyText){
        if (!bodyText){
            return '';
        }

        var multiParse = false;

        var returnText = bodyText.replace(/(&gt;)/g, '');
        var mailtoIndexStart = bodyText.indexOf('<mailto');
        var mailtoIndexEnd;
        if (mailtoIndexStart > -1){
            multiParse = true;
            let split = returnText.substr(mailtoIndexStart, bodyText.indexOf('>', mailtoIndexStart) - mailtoIndexStart + 1);
            var emailSplit = split.split('|')[1];

            var email = emailSplit ? emailSplit.substr(0, emailSplit.length - 1) : split.substr(8, split.length - 1);
            returnText = returnText.split(split).join(email).trim();
        }

        var userTagIndexStart = bodyText.indexOf('<@');
        var userTagIndexEnd;
        if (userTagIndexStart > -1){
            multiParse = true;
            let split = returnText.substr(userTagIndexStart, bodyText.indexOf('>', userTagIndexStart) - userTagIndexStart + 1);
            let user = this.props.userList.find(obj => obj.get('id') === split.substr(2, split.length - 3));

            returnText = returnText.split(split).join('@' + (user.get('real_name').split(' ').join(''))).trim();
        }

        while (returnText.substr(returnText.length - 1).trim() === ','){
            returnText = returnText.substr(0, returnText.length - 1).trim()
        }

        return multiParse ? this.parseMessageBody(returnText) : returnText;
    }

    parsePretext(pretext){
        if (!pretext){
            return '';
        }
        return pretext.substring(0, pretext.indexOf('[<') === -1 ? pretext.indexOf('(<') : pretext.indexOf('[<'));
    }

    getUserProfileImage(user, message){
        if (message.get('icons')){
            return message.get('icons').get('image_24') || message.get('icons').get('image_32') || message.get('icons').get('image_48') || message.get('icons').get('image_64')
        } else {
            return user.get('profile') ? user.get('profile').get('image_24') : user.get('icons').get('image_36')
        }
    }

    removeURLs(string){
        var returnString = string;
        var start = returnString.indexOf('<http');
        var end;

        var multiParse = false;

        if (start > -1){
            multiParse = true;
            let split = returnString.substr(start, returnString.indexOf('>', start) - start + 1);
            returnString = returnString.split(split).join()
        }

        return multiParse ? this.removeURLs(returnString) : returnString;
    }

    render(){

        return <div className="outer-feed-wrapper">
            <div className="flex flex-wrap" style={{height: '100%'}}>
                {
                    config.channels.map(configChannel =>
                        <div className="feed flex flex-column" key={configChannel.name}>
                            <div className="underline-title-row"><h4>{configChannel.displayName || configChannel.name}</h4></div>
                            <div className="feed-messages scroll-container flex-1-1-auto">
                                <div>
                                    {
                                        this.props[configChannel.name + 'Messages'].map(message =>
                                            this.buildMessage.bind(this)(message)
                                        )
                                    }
                                    <div id={configChannel.name + 'Messages'}></div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    }
}

function select(state, ownProps) {

    var o = {
        userList: state.SlackFeed.userList
    };

    config.channels.map(configChannel => {
        o[configChannel.name + 'Messages'] = state.SlackFeed[configChannel.name + 'Messages']
    });

    return o
}

export default connect(select)(SlackFeedWrapper);