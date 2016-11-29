var dispatcher = require('./dispatcher');
var rp = require('request-promise');

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

    var to = options.to;
    var from = options.from;
    var message = options.message;
    var limit = options.limit;

    var options = {
        method: 'POST',
        uri: 'https://api.cpsms.dk/v2/send',
        headers: {
            'Authorization': 'Basic ' + new Buffer('cyrix:'+ process.env.CPSMS_API_KEY).toString('base64')
        },
        body: {
            to: to,
            from: from || 'GUARDSWIFT',
            message: limit ? message.substring(0,limit) : message
        },
        json: true
    };


    rp(options).then(function (parsedBody) {
        console.log(parsedBody);
    })
    .catch(function (err) {
        console.log('err: ', err);
    });

};
