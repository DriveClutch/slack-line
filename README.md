# slack-line
Slack client to display real time feed from 4 channels or groups simultaneously

This project contians a small node server for interacting with the Slack API, which also served up a react/redux application that can display 4 slack channels or groups simutaneously using their websocket API. Designed as a display dashboard for publicly showing info from various Slack integrations.

#Running:

You can run a dev build of the project with `gulp dev`. Running the default gulp task with the `gulp` command will generate minfied binaries for production.

#Setup

This project pulls the Slack client key, the secret key, and the list of channels from local environment variables. You will need to create a Slack application in [Slack's developer tools section](https://api.slack.com/applications), which will give you access to a client id and client secret. You will need to set the following environment variables:

`SLACK_CLIENT_ID` : the Slack client id of your slack app.

`SLACK_CLIENT_SECRET` : the Slack client id of your slack app.

`SLACK_CLIENT_CHANNELS` : a JSON array containing the list of channels you wish to display. It will need to conform the following format:

``` javascript
[  
   {  
      "name":"my_channel_1",
      "displayName":"My Channel 1"
   },
   {  
      "name":"my_channel_2",
      "displayName":"My Channel 2"
   },
   {  
      "name":"foo_channel",
      "displayName":"Foo Channel"
   },
   {  
      "name":"bar_channel",
      "displayName":"Bar Channel"
   }
]
```
