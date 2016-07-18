var Promise = require("bluebird");
var config = require('config');
var Slack = require('slack-node');
var GoogleSpreadsheet = require('google-spreadsheet');
var googleCreds = require('./google-generated-creds.json');

var users;
var userToLog;
var imToLog;
var messagesLog = [];
var sheet;
var lastTs;
var slack = Promise.promisifyAll(new Slack(config.get('Slack.config.apiToken')));
var doc = Promise.promisifyAll(new GoogleSpreadsheet(config.get('App.sheetId')));

var getMessages = function (oldest, latest) {
    slack.api("im.history", {
        channel: imToLog.id,
        latest: latest,
        oldest: oldest
    }, function (err, response) {
        messagesLog = messagesLog.concat(response.messages);
        if (response.has_more)
            getMessages(oldest, messagesLog[messagesLog.length - 1].ts);
        } else {
            saveRowsToDoc();
        }
    });
};

var saveRowsToDoc = function () {
    for (var i = messagesLog.length - 1; i >= 0; i--) {
        var message = messagesLog[i];
        
    }
};

doc.useServiceAccountAuthAsync(googleCreds)
    .then(() => doc.getInfoAsync())
    .then(function (spreadsheet) {
        sheet = spreadsheet.worksheets[0];
        return sheet.getRowsAsync({limit: 1});
    })
    .then(function (rows) {
        lastTs = rows[0]['b'].numericValue;
        return slack.apiAsync("users.list")
    })
    .then(function (response) {
        var name = config.get('App.usernameToLog');
        users = response.members;
        userToLog = users.find((member) => (member.name === name));
        return slack.apiAsync("im.list");
    })
    .then(function (response) {
        imToLog = response.ims.find((im) => (im.user === userToLog.id));
        getMessages(lastTs);
    })
    .catch(function(error){
        console.log(error);
    });
