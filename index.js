var Promise = require("bluebird");
var config = require('config');
var Slack = require('slack-node');

var slack = null;
var users = null;
var userToLog = null;
var imToLog = null;
var messagesLog = [];
var getApiToken = new Promise(function(resolve, reject){
    var apiToken = config.get('Slack.config.apiToken');
    if (!apiToken) {
        console.log('No apiToken found in config file. Exiting...');
        process.exit();
    } else {
        slack = Promise.promisifyAll(new Slack(apiToken));
        resolve();
    }
});
var getMessages = function (latest) {
    slack.api("im.history", {
        channel: imToLog.id,
        latest: latest
    }, function (err, response) {
        messagesLog = messagesLog.concat(response.messages);
        if (response.has_more)
            getMessages(messagesLog[messagesLog.length - 1].ts);
        } else {
            console.log("done");
        }
    });
};

//TODO: Add google docs integration, https://www.npmjs.com/package/google-spreadsheet

getApiToken
    .then(() => slack.apiAsync("users.list"))
    .then(function (response) {
        var name = config.get('App.usernameToLog');
        users = response.members;
        userToLog = users.find((member) => (member.name === name));
        return slack.apiAsync("im.list");
    })
    .then(function (response) {
        imToLog = response.ims.find((im) => (im.user === userToLog.id));
        getMessages();
    })
    .catch(function(error){
        console.log(error);
    });

// slack.api("users.list", function(err, response) {
//     for (var i = 0; i < response.members.length; i++) {
//         var member = response.members[i];
//         console.log(member.id+": "+member.name);
//     }
// });

// slack.api('chat.postMessage', {
//     text:'hello from nodejs',
//     channel:'#general'
// }, function(err, response){
//     console.log(response);
// });
