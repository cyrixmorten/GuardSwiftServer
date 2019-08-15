import {ReportToPDF} from "../pdf/report.to.pdf";

export const API_FUNCTION_REPORT_TO_PDFMAKE_DOC = "reportToDoc";

Parse.Cloud.define(API_FUNCTION_REPORT_TO_PDFMAKE_DOC,   (request) => {
    return ReportToPDF.buildDoc(request.params.reportId, !!request.params.customerFacing);
});

