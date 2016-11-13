var reportToPdf = require('../../cloud/pdf/reportToPDF')

module.exports = function (req, res) {

    reportToPdf.toPdf(req.params.id).then(function(response) {
        // res.set('Content-Type: application/octet-stream');

        res.status(200);
        res.send(response.buffer);
    }).fail(function(error) {
        res.status(400).send(error);
    });


};