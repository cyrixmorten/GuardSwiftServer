var moment = require('moment');
var _ = require('lodash');

var reportToMail = require('../pdf/reportToMail');


Parse.Cloud.job("dailyMailReports", function (request, status) {

    console.log('dailyMailReports', JSON.stringify(request.params));

    var now = moment();
    var yesterday = moment().subtract(request.params.days || 1, 'days');

    var query = new Parse.Query(Parse.User);
    query.each(function (company) {
            var promises = [
                sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'ALARM'),
                sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'REGULAR'),
                sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'RAID')
            ];

            //var sendSummaryReportToCompany = sendRegularReportSummaryToCompany(company, yesterday.toDate(), now.toDate());

            return Parse.Promise.when(promises);

        }, { useMasterKey: true })
        .then(function () {

            // todo generate daily summary
            console.log('ALL DONE');

            status.success('Done generating mail reports');
        }, function (error) {
            console.error(error);
            status.error(error);

        });
});

var restrictQuery = function(query) {
    return function(company, fromDate, toDate) {
        query.equalTo('owner', company);
        query.greaterThan("deviceTimestamp", fromDate);
        query.lessThan("deviceTimestamp", toDate);
    }
};

var sendReportsToClients = function (company, fromDate, toDate, taskType) {

    var reportQuery = new Parse.Query("Report");

    reportQuery.equalTo('taskTypeName', taskType);

    restrictQuery(reportQuery)(company, fromDate, toDate);

    return reportQuery.each(function (report) {
        return reportToMail.sendReport(report.id);
    }, { useMasterKey: true });
};

// var sendRegularReportSummaryToCompany = function(company, fromDate, toDate) {
//     var reportQuery = new Parse.Query('CircuitStarted');
//
//     restrictQuery(reportQuery)(company, fromDate, toDate);
//
//     return reportQuery.each(function (group) {
//         return Parse.Cloud.run('sendSummaryReport', {
//             taskGroup: group.id
//         });
//     })
// };


