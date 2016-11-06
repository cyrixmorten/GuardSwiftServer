var reportToDoc = require('./definitions/taskReport.js');
var reportUtils = require('./reportUtils.js');

Parse.Cloud.define("reportToPDF", function (request, response) {

    console.log('reportToPDF');
    
    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }

    exports.toPdf(request.params.reportId).then(function(res) {
        response.success(res);
    }).fail(function(err) {
        response.error(err);
    })


});


exports.toPdf = function(reportId) {
    var createdPDF = false;
    var reportObject = {};


    return reportUtils.fetchReport(reportId).then(function (report) {

        console.log('fetchReport success');

        reportObject = report;

        if (reportUtils.hasExistingPDF(report)) {
            createdPDF = false;

            return reportUtils.readExistingPDF(report);
        } else {
            createdPDF = true;

            return reportUtils.deleteExistingPDF(report)
                .then(function() {
                    // no matter the outcome of the delete, we continue creating the report
                    return reportToDoc.createDoc(report);
                })
                .then(function(docDefinition) {
                    return reportUtils.generatePDF(docDefinition);
                })
                .fail(function(error) {
                    return new Parse.Promise.error({
                        message: 'Error during PDF creation',
                        error: error
                    });
                });
        }

    }).then(function (httpResponse) {

        var promise = new Parse.Promise();

        if (createdPDF) {

            var saveFileToReport = function (report, file) {

                report.set('pdfCreatedAt', new Date());
                report.set('pdf', file);

                return report.save(null, { useMasterKey: true });
            };

            promise = reportUtils.generatePDFParseFile(httpResponse).then(function (file) {
                return saveFileToReport(reportObject, file)
            })
            .then(function() {
                return httpResponse;
            })
            .fail(function (error) {
                return new Parse.Promise.error({
                    message: 'Error saving PDF report',
                    error: error
                });
            });
        } else {
            promise.resolve(httpResponse);
        }

        return promise;

    }).then(function (httpResponse) {
        return Parse.Promise.as({
            httpResponse: httpResponse,
            pdfUrl: reportUtils.getPDFUrl(reportObject)
        });

    });
}; 




