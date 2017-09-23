import {ReportUtils} from "../reportUtils";
import {TaskType} from "../../../shared/subclass/Task";

import * as _ from 'lodash'

import * as regularReport from './regularReport'
import * as staticReport from './staticReport'



let fetchReportSettings = function (report) {

    let getSettingsColumn = function () {
        let taskType: TaskType = report.get('taskType');
        switch (taskType) {
            case TaskType.ALARM:
                return 'regularReportSettings';
            case TaskType.REGULAR:
                return 'regularReportSettings';
            case TaskType.RAID:
                return 'regularReportSettings';
            case TaskType.STATIC:
                return 'staticReportSettings';
            default: {
                console.error("fetchReportSettings missing taskType: " + taskType)
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

        return ReportUtils.fetchUser(report).then(function (user) {
            return user.get(settingsCol).fetch({useMasterKey: true});
        });
    };


    return fetchReportSettings()
};

export let createDoc = function (report) {

    let timeZone;

    return ReportUtils.fetchUser(report).then(function (user) {

        timeZone = (user.has('timeZone')) ? user.get('timeZone') : 'Europe/Copenhagen';

        return fetchReportSettings(report);
    }).then(function (settings) {

        let taskType: TaskType = report.get('taskType');
        switch (taskType) {
            case TaskType.ALARM:
                return regularReport.createDoc(report, settings, timeZone);
            case TaskType.REGULAR:
                return regularReport.createDoc(report, settings, timeZone);
            case TaskType.RAID:
                return regularReport.createDoc(report, settings, timeZone);
            case TaskType.STATIC:
                return staticReport.createDoc(report, settings, timeZone);
            default: {
                console.error("createDoc missing taskType: " + taskType)
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