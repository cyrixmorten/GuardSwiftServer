var dispatcher = require('./dispatcher');
var rp = require('request-promise');
var _ = require('lodash');

exports.receive = function (req, res) {
    var from = req.query.from;
    var to   = req.query.number;
    var body = req.query.message;

    from = '+' + from;
    to = '+' + to;

    console.log('from: ', from);
    console.log('number: ', to);
    console.log('message: ', body);

    dispatcher.handle(from, to, body, res);

};


exports.send = function (options) {

    console.log('options: ', options);

    var to = options.to || '';
    var from = options.from || '';
    var message = options.message || '';
    var limit = options.limit;

    var options = {
        method: 'POST',
        uri: 'https://api.cpsms.dk/v2/send',
        headers: {
            'Authorization': 'Basic ' + new Buffer('cyrix:'+ process.env.CPSMS_API_KEY).toString('base64')
        },
        body: {
            to: _.replace(to, '+', ''),
            from: _.replace(from, '+45', '') || 'GUARDSWIFT',
            message: limit ? message.substring(0,limit) : message
        },
        json: true
    };

    console.log('options.body: ', options.body);

    rp(options).then(function (parsedBody) {
        console.log(parsedBody);
    })
    .catch(function (err) {
        console.log(err.message);
    });

};
