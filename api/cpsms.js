var dispatcher = require('./dispatcher');

exports.receive = function (req, res) {
    var from = req.query.from;
    var to   = req.query.number;
    var body = req.query.message;

    console.log('from: ', from);
    console.log('number: ', to);
    console.log('message: ', body);

    dispatcher.handle(from, to, body, res);

};