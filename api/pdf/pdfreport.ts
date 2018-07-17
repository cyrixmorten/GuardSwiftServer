import {ReportToPDF} from "../../cloud/pdf/report.to.pdf";

export let toPdf =  (req, res) => {

    ReportToPDF.fetchReportAndGeneratePDF(req.params.id).then((pdfBuffer: Buffer) => {
        res.status(200);
        res.send(pdfBuffer);
    }, (error) => {
        res.status(400).send(error);
    });


};
