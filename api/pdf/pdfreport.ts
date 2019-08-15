import {ReportToPDF} from "../../cloud/pdf/report.to.pdf";

export let toPdf =  (req, res) => {

    ReportToPDF.buildPdf(req.params.id, !!req.params.customerFacing).then((pdfBuffer: Buffer) => {
        res.status(200);
        res.send(pdfBuffer);
    }, (error) => {
        res.status(400).send(error);
    });


};
