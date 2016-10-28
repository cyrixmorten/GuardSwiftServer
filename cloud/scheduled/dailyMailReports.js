var moment = require('moment');
var _ = require('lodash');


Parse.Cloud.job("dailyMailReports", function (request, status) {
    Parse.Cloud.useMasterKey();

    var now = moment();
    var yesterday = moment().subtract(1, 'days');

    var query = new Parse.Query(Parse.User);
    query.each(
        function (company) {
            var promises = [
                sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'REGULAR'),
                sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'DISTRICTWATCH')
            ];

            //var sendSummaryReportToCompany = sendRegularReportSummaryToCompany(company, yesterday.toDate(), now.toDate());

            return Parse.Promise.when(promises);

        })
        .then(function () {
            // todo generate daily summary
            status.success('Done generating mail reports');
        }, function (error) {
            console.error(error);
            status.error(error.message);

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
        return Parse.Cloud.run('sendReport', {
            reportId: report.id
        });
    })
};

var sendRegularReportSummaryToCompany = function(company, fromDate, toDate) {
    var reportQuery = new Parse.Query('CircuitStarted');

    restrictQuery(reportQuery)(company, fromDate, toDate);

    return reportQuery.each(function (group) {
        return Parse.Cloud.run('sendSummaryReport', {
            taskGroup: group.id
        });
    })
};


