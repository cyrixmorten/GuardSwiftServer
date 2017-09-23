import {ReportUtils} from "./reportUtils";

import * as reportToDoc from './definitions/taskReport.js';


Parse.Cloud.define("reportToDoc", function (request, response) {

    console.log('reportToDoc');

    toDoc(request.params.reportId).then(function(res) {
        response.success(res);
    }, function(err) {
        response.error(err);
    })

});

export let toDoc = function(reportId) {

    if (!reportId) {
        return Parse.Promise.error('toDoc missing reportId');
    }

    return ReportUtils.fetchReport(reportId)
    .then(function (report) {
        return reportToDoc.createDoc(report)
    },function(error) {
        return Parse.Promise.error({
            message: 'Error during Document creation',
            error: error
        });
    });
};





