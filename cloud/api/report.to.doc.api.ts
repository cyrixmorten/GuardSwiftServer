import {ReportToPDF} from "../pdf/report.to.pdf";

export const API_FUNCTION_REPORT_TO_PDFMAKE_DOC = "reportToDoc";

Parse.Cloud.define(API_FUNCTION_REPORT_TO_PDFMAKE_DOC,   (request, response) => {
    ReportToPDF.fetchReportAndGeneratePDFDoc(request.params.reportId).then((res) => {
        response.success(res);
    }, (err) => {
        response.error(err);
    })
});

