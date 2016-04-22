var express = require('express');
var app = express();
var request = require('request');
var path = require('path');
var bodyParser = require('body-parser');

app.use(express.static(path.resolve('./')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

// set template engine so we can bootstrap the app with private environment vars
app.set('view engine', 'ejs');

app.post('/api/rtmStart', function (req, res) {
    request('https://slack.com/api/rtm.start?token=' + req.body.token + '&no_unreads=true', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.json(JSON.parse(response.body));
        } else {
            res.status(400).send({
                message: 'Failed to start RTM service',
                error: error
            })
        }
    })
});

app.post('/api/exchangeCode', function (req, res) {
    request('https://slack.com/api/oauth.access?client_id=' + req.body.clientId + '&client_secret=' + req.body.clientSecret + '&code=' + req.body.code, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.json(JSON.parse(response.body));
        } else {
            res.status(400).send({
                message: 'Failed to exchangeCode',
                error: error
            })
        }
    })
});

app.post('/api/channelList', function (req, res) {
    request('https://slack.com/api/channels.list?token=' + req.body.token, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.json(JSON.parse(response.body));
        } else {
            res.status(400).send({
                message: 'Failed to fetch channel list',
                error: error
            })
        }
    })
});

app.post('/api/channelHistory', function (req, res) {
    request('https://slack.com/api/channels.history?token=' + req.body.token + '&channel=' + req.body.channel + '&count=10', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.json(JSON.parse(response.body));
        } else {
            res.status(400).send({
                message: 'Failed to fetch channel list',
                error: error
            })
        }
    })
});

app.post('/api/groupHistory', function (req, res) {
    request('https://slack.com/api/groups.history?token=' + req.body.token + '&channel=' + req.body.channel + '&count=10', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.json(JSON.parse(response.body));
        } else {
            res.status(400).send({
                message: 'Failed to fetch channel list',
                error: error
            })
        }
    })
});

app.get('/', function(req, res){
    res.render(path.join(__dirname + '/index.ejs'), {
        slackClientId: process.env.SLACK_CLIENT_ID,
        slackClientSecret: process.env.SLACK_CLIENT_SECRET,
        slackClientChannels: process.env.SLACK_CLIENT_CHANNELS || 'xxx'
    });
});

app.use(function(req, res){
    if (req.url.substr(0, 4) === '/api'){
        return res.status(404).send();
    }

    res.redirect('/');
})

app.listen(3333, function () {
    console.log('Example app listening on port 3333!');
});