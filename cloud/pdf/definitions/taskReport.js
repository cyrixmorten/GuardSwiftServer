"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reportUtils_1 = require("../reportUtils");
const Task_1 = require("../../../shared/subclass/Task");
const _ = require("lodash");
const regularReport = require("./regularReport");
const staticReport = require("./staticReport");
let fetchReportSettings = function (report) {
    let getSettingsColumn = function () {
        let taskType = report.get('taskType');
        switch (taskType) {
            case Task_1.TaskType.ALARM:
                return 'regularReportSettings';
            case Task_1.TaskType.REGULAR:
                return 'regularReportSettings';
            case Task_1.TaskType.RAID:
                return 'regularReportSettings';
            case Task_1.TaskType.STATIC:
                return 'staticReportSettings';
            default: {
                console.error("fetchReportSettings missing taskType: " + taskType);
            }
        }
        // TODO kept for backwards compatibility < 5.0.0
        let taskTypeName = report.get('taskTypeName');
        switch (taskTypeName) {
            case 'ALARM':
                return 'regularReportSettings';
            case 'REGULAR':
                return 'regularReportSettings';
            case 'RAID':
                return 'regularReportSettings';
            case 'STATIC':
                return 'staticReportSettings';
        }
    };
    let fetchReportSettings = function () {
        let settingsCol = getSettingsColumn();
        console.log('settingsCol: ' + settingsCol);
        if (_.isEmpty(settingsCol)) {
            return Parse.Promise.error('No definition matching report');
        }
        return reportUtils_1.ReportUtils.fetchUser(report).then(function (user) {
            return user.get(settingsCol).fetch({ useMasterKey: true });
        });
    };
    return fetchReportSettings();
};
exports.createDoc = function (report) {
    let timeZone;
    return reportUtils_1.ReportUtils.fetchUser(report).then(function (user) {
        timeZone = (user.has('timeZone')) ? user.get('timeZone') : 'Europe/Copenhagen';
        return fetchReportSettings(report);
    }).then(function (settings) {
        let taskType = report.get('taskType');
        switch (taskType) {
            case Task_1.TaskType.ALARM:
                return regularReport.createDoc(report, settings, timeZone);
            case Task_1.TaskType.REGULAR:
                return regularReport.createDoc(report, settings, timeZone);
            case Task_1.TaskType.RAID:
                return regularReport.createDoc(report, settings, timeZone);
            case Task_1.TaskType.STATIC:
                return staticReport.createDoc(report, settings, timeZone);
            default: {
                console.error("createDoc missing taskType: " + taskType);
            }
        }
        // TODO kept for backwards compatibility < 5.0.0
        if (report.has('task')) {
            return regularReport.createDoc(report, settings, timeZone);
        }
        if (report.has('circuitUnit')) {
            return regularReport.createDoc(report, settings, timeZone);
        }
        if (report.has('staticTask')) {
            return staticReport.createDoc(report, settings, timeZone);
        }
    });
};
//# sourceMappingURL=taskReport.js.map