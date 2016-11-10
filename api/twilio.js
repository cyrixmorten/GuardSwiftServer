// // Twilio Credentials
var accountSid = process.env.TWILIO_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;

//require the Twilio module and create a REST client
var client = require('twilio')(accountSid, authToken);

exports.send = function(req, res) {
    var from = req.body.From;
    var to   = req.body.To;
    var body = req.body.Body;

    console.log('from: ', from);
    console.log('to: ', to);
    console.log('body: ', body);

    client.messages.create({
        to: to,
        from: '+46769446760',
        body: body,
    }, function (err, message) {
        if (err) {
            res.status(400).send(err);
            return;
        }
        console.log(message.sid);
        res.send(message);
    });
};



exports.receive = function (req, res) {
    var from = req.body.From;
    var to   = req.body.To;
    var body = req.body.Body;

    console.log('from: ', from);
    console.log('to: ', to);
    console.log('body: ', body);
};