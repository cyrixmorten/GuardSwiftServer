"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reportToDoc = require("./reportToDoc");
const reportUtils_1 = require("./reportUtils");
Parse.Cloud.define("reportToPDF", function (request, response) {
    console.log('reportToPDF');
    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }
    exports.toPdf(request.params.reportId).then(function (res) {
        response.success(new Buffer(res.text).toString('base64'));
    }, function (err) {
        response.error(err);
    });
});
exports.toPdf = function (reportId) {
    if (!reportId) {
        return Parse.Promise.error('toPdf missing reportId');
    }
    return reportToDoc.toDoc(reportId)
        .then(function (docDefinition) {
        return reportUtils_1.ReportUtils.generatePDF(docDefinition);
    }, function (error) {
        return Parse.Promise.error({
            message: 'Error during PDF creation',
            error: error
        });
    });
};
//# sourceMappingURL=reportToPDF.js.map