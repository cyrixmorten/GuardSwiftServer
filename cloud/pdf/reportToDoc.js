"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reportUtils_1 = require("./reportUtils");
const reportToDoc = require("./definitions/taskReport.js");
Parse.Cloud.define("reportToDoc", function (request, response) {
    console.log('reportToDoc');
    exports.toDoc(request.params.reportId).then(function (res) {
        response.success(res);
    }, function (err) {
        response.error(err);
    });
});
exports.toDoc = function (reportId) {
    if (!reportId) {
        return Parse.Promise.error('toDoc missing reportId');
    }
    return reportUtils_1.ReportUtils.fetchReport(reportId)
        .then(function (report) {
        return reportToDoc.createDoc(report);
    }, function (error) {
        return Parse.Promise.error({
            message: 'Error during Document creation',
            error: error
        });
    });
};
//# sourceMappingURL=reportToDoc.js.map