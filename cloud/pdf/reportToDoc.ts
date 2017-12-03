import {ReportUtils} from "./reportUtils";

import * as reportToDoc from './definitions/taskReport';
import {ReportSettings} from "../../shared/subclass/ReportSettings";


Parse.Cloud.define("reportToDoc",  (request, response) => {

    console.log('reportToDoc');

    toDoc(request.params.reportId).then(function(res) {
        response.success(res);
    }, function(err) {
        response.error(err);
    })

});

export let toDoc = (reportId: string, reportSettings?: ReportSettings) => {

    if (!reportId) {
        return Parse.Promise.error('toDoc missing reportId');
    }

    return ReportUtils.fetchReport(reportId)
    .then(function (report) {
        if (!report) {
            throw new Error('Did not find report with id: ' + reportId)
        }
        return reportToDoc.createDoc(report, reportSettings)
    },function(error) {
        return Parse.Promise.error({
            message: error.message || 'Error during Document creation',
            error: error
        });
    });
};





