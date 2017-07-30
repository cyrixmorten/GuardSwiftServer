var reportToDoc = require('./definitions/taskReport.js');
var reportUtils = require('./reportUtils.js');


Parse.Cloud.define("reportToDoc", function (request, response) {

    console.log('reportToDoc');

    exports.toDoc(request.params.reportId).then(function(res) {
        response.success(res);
    }).fail(function(err) {
        response.error(err);
    })

});

exports.toDoc = function(reportId) {

    if (!reportId) {
        return Parse.Promise.error('toDoc missing reportId');
    }

    return reportUtils.fetchReport(reportId)
    .then(function (report) {
        return reportToDoc.createDoc(report)
    })
    .fail(function(error) {
        return Parse.Promise.error({
            message: 'Error during Document creation',
            error: error
        });
    });
};





