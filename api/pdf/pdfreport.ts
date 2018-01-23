import {ReportBuilder} from "../../cloud/pdf/report.builder";

export let toPdf =  (req, res) => {

    ReportBuilder.buildPdf(req.params.id).then((pdfBuffer: Buffer) => {
        // res.set('Content-Type: application/octet-stream');

        res.status(200);
        res.send(pdfBuffer);
    }, (error) => {
        res.status(400).send(error);
    });


};