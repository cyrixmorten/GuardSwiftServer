
exports.send = function(req, res) {
    var from = req.params.from;
    var to   = req.params.number;
    var body = req.params.body;

    console.log('from: ', from);
    console.log('number: ', to);
    console.log('message: ', body);

    res.send('CPSMS sent!')
};



exports.receive = function (req, res) {
    var from = req.query.from;
    var to   = req.query.number;
    var body = req.query.message;

    console.log('from: ', from);
    console.log('number: ', to);
    console.log('message: ', body);

    res.send('CPSMS received!')
};