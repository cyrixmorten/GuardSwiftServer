var reportToDoc = require('./definitions/taskReport.js');
var reportUtils = require('./reportUtils.js');

Parse.Cloud.define("reportToPDF", function (request, response) {

    console.log('reportToPDF');
    
    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }

    var createdPDF = false;
    var reportObject = {};


    reportUtils.fetchReport(request.params.reportId).then(function (report) {

        console.log('fetchReport success');
        
        reportObject = report;

        if (reportUtils.hasExistingPDF(report)) {
            createdPDF = false;

            return reportUtils.readExistingPDF(report);
        } else {
            createdPDF = true;
            
            return reportUtils.deleteExistingPDF(report)
            .always(function () {
                // no matter the outcome of the delete, we continue creating the report
                return reportToDoc.createDoc(report);
            })
            .then(reportUtils.generatePDF)
            .fail(function(error) {
                console.error('Error during PDF creation');

                return error;
            });
        }

    }).then(function (httpResponse) {


        var httpResponsePromise = function() {
            return new Parse.Promise.as(httpResponse);
        };

        var promise = httpResponsePromise();

        if (createdPDF) {

            var saveFileToReport = function (report, file) {
                report.set('pdfCreatedAt', new Date());
                report.set('pdf', file);

                return report.save();
            };

            promise = reportUtils.generatePDFParseFile(httpResponse).then(function (file) {
                return saveFileToReport(reportObject, file).then(httpResponsePromise);
            })
            .fail(function (error) {
                console.error('Error saving PDF report');

                return error;
            });
        }

        return promise;

    }).then(function (httpResponse) {
        console.log('success');
        
        response.success({
            httpResponse: httpResponse,
            pdfUrl: reportUtils.getPDFUrl(reportObject)
        });

    }).fail(function (error) {

        console.error(JSON.stringify(error));
        
        response.error(error);

    });

});




