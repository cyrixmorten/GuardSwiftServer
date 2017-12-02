import * as reportToDoc from './reportToDoc';
import {ReportUtils} from "./reportUtils";

Parse.Cloud.define("reportToPDF",  (request, response) => {

    console.log('reportToPDF');

    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }

    toPdf(request.params.reportId).then( (res) => {
        response.success(new Buffer(res.text).toString('base64'));
    },  (err) => {
        response.error(err);
    })

});


export let toPdf =  (reportId) => {

    if (!reportId) {
        return Parse.Promise.error('toPdf missing reportId');
    }
    return reportToDoc.toDoc(reportId)
        .then( (docDefinition) => {
            return ReportUtils.generatePDF(docDefinition);
        },  (error) => {
            return Parse.Promise.error({
                message: 'Error during PDF creation',
                error: error
            });
        });
}; 




