var _ = require('lodash');
var Parse = require('parse/node');

Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

/**
 * Handle incoming messages from either SMS, Email or REST
 *
 * For now all messages are assumed to be alarms
 *
 * @param from
 * @param to
 * @param body
 * @param res
 */
exports.handle = function (from, to, body, res) {
    return Parse.Cloud.run('alarm', {
        sender: from,
        receiver: to,
        alarm: body
    })
    .then(function(response) {
        res.send(response);
    }).fail(function(error) {
        res.status(400).send(error);
    });
};


