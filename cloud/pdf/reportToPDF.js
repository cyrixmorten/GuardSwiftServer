var reportToDoc = require('./reportToDoc');
var reportUtils = require('./reportUtils.js');

Parse.Cloud.define("reportToPDF", function (request, response) {

    console.log('reportToPDF');
    
    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }

    exports.toPdf(request.params.reportId).then(function(res) {
        response.success(new Buffer(res.text).toString('base64'));
    }).fail(function(err) {
        response.error(err);
    })

});



exports.toPdf = function(reportId) {

    if (!reportId) {
        return Parse.Promise.error('toPdf missing reportId');
    }
    return reportToDoc.toDoc(reportId)
        .then(function(docDefinition) {
            return reportUtils.generatePDF(docDefinition);
        })
        .fail(function(error) {
                return new Parse.Promise.error({
                    message: 'Error during PDF creation',
                    error: error
                });
            });
}; 




