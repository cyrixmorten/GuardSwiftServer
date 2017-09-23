import * as reportToDoc from './reportToDoc';
import {ReportUtils} from "./reportUtils";

Parse.Cloud.define("reportToPDF", function (request, response) {

    console.log('reportToPDF');

    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }

    toPdf(request.params.reportId).then(function (res) {
        response.success(new Buffer(res.text).toString('base64'));
    }, function (err) {
        response.error(err);
    })

});


export let toPdf = function (reportId) {

    if (!reportId) {
        return Parse.Promise.error('toPdf missing reportId');
    }
    return reportToDoc.toDoc(reportId)
        .then(function (docDefinition) {
            return ReportUtils.generatePDF(docDefinition);
        }, function (error) {
            return Parse.Promise.error({
                message: 'Error during PDF creation',
                error: error
            });
        });
}; 




