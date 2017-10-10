"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
let reportToMail = require('../pdf/reportToMail');
Parse.Cloud.define("dailyMailReports", (request, status) => {
    console.log('dailyMailReports', JSON.stringify(request.params));
    let now = moment();
    let yesterday = moment().subtract(request.params.days || 1, 'days');
    let query = new Parse.Query(Parse.User);
    query.each((company) => {
        let promises = [
            sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'ALARM'),
            sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'REGULAR'),
            sendReportsToClients(company, yesterday.toDate(), now.toDate(), 'RAID')
        ];
        //let sendSummaryReportToCompany = sendRegularReportSummaryToCompany(company, yesterday.toDate(), now.toDate());
        return Parse.Promise.when(promises);
    }, { useMasterKey: true })
        .then(() => {
        // todo generate daily summary
        console.log('ALL DONE');
        status.success('Done generating mail reports');
    }, (error) => {
        console.error(error);
        status.error(error);
    });
});
let restrictQuery = (query) => {
    return (company, fromDate, toDate) => {
        query.equalTo('owner', company);
        query.greaterThan("deviceTimestamp", fromDate);
        query.lessThan("deviceTimestamp", toDate);
    };
};
let sendReportsToClients = (company, fromDate, toDate, taskType) => {
    let reportQuery = new Parse.Query("Report");
    reportQuery.equalTo('taskTypeName', taskType);
    restrictQuery(reportQuery)(company, fromDate, toDate);
    return reportQuery.each((report) => {
        return reportToMail.sendReport(report.id);
    }, { useMasterKey: true });
};
//# sourceMappingURL=dailyMailReports.js.map