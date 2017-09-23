import * as reportToPdf from '../../cloud/pdf/reportToPDF';

export let toPdf =  (req, res) => {

    reportToPdf.toPdf(req.params.id).then(function(response) {
        // res.set('Content-Type: application/octet-stream');

        res.status(200);
        res.send(response.buffer);
    }, function(error) {
        res.status(400).send(error);
    });


};