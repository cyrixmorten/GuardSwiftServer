var dispatcher = require('./dispatcher');
var rp = require('request-promise');
var _ = require('lodash');

var saveSMSLog = function (to, from, message, limit, error) {
    console.log('saveSMSLog', to, from);

    var SMSLog = Parse.Object.extend('SMSLog');
    var smsLog = new SMSLog();
    smsLog.set('to', to);
    smsLog.set('from', from);
    smsLog.set('message', message);
    smsLog.set('limit', limit);
    smsLog.set('error', error);

    return smsLog.save(null, {useMasterKey: true}).then(function() {
        console.log('SMSLog saved');
    }).fail(function(e) {
        console.error('Error saving SMSLog', e);
    });
};

exports.receive = function (req, res) {
    var from = req.query.from;
    var to = req.query.number;
    var body = req.query.message;

    from = '+' + from;
    to = '+' + to;

    console.log('from: ', from);
    console.log('number: ', to);
    console.log('message: ', body);

    dispatcher.handle(from, to, body, res);

};


exports.send = function (params) {

    var to = params.to || '';
    var from = params.from || '';
    var message = params.message || '';
    var limit = params.limit;

    var options = {
        method: 'POST',
        uri: 'https://api.cpsms.dk/v2/send',
        headers: {
            'Authorization': 'Basic ' + new Buffer('cyrix:' + process.env.CPSMS_API_KEY).toString('base64')
        },
        body: {
            to: _.replace(to, '+', ''),
            from: _.replace(from, '+45', '') || 'GUARDSWIFT',
            message: limit ? message.substring(0, limit) : message,
            flash: 0//params.flash ? 1 : 0
        },
        json: true
    };

    console.log('Sending SMS: ', options.body);

    var error = {};
    return rp(options).then(function (parsedBody) {
        console.log(parsedBody);
    }).catch(function (err) {
        console.log(err.message);
        error = err;
    }).always(function () {
        saveSMSLog(to, from, message, limit, error);
    });

};


