import {ReportUtils} from "../reportUtils";
import {TaskType} from "../../../shared/subclass/Task";
import * as _ from 'lodash'

import * as regularReport from './regularReport'
import * as staticReport from './staticReport'
import {Report} from "../../../shared/subclass/Report";
import {ReportSettings, ReportSettingsQuery} from "../../../shared/subclass/ReportSettings";

export let createDoc =  (report: Report, reportSettings?: ReportSettings) => {

    return ReportUtils.fetchUser(report).then( (user) => {

        return (user.has('timeZone')) ? user.get('timeZone') : 'Europe/Copenhagen';

    }).then(async (timeZone) => {

        let taskType: TaskType = report.taskType;

        reportSettings = reportSettings ? reportSettings : await new ReportSettingsQuery().matchingOwner(report.owner).matchingTaskType(taskType).build().first({useMasterKey: true});

        switch (taskType) {
            case TaskType.ALARM:
                return regularReport.createDoc(report, reportSettings, timeZone);
            case TaskType.REGULAR:
                return regularReport.createDoc(report, reportSettings, timeZone);
            case TaskType.RAID:
                return regularReport.createDoc(report, reportSettings, timeZone);
            case TaskType.STATIC:
                return staticReport.createDoc(report, reportSettings, timeZone);
            default: {
                console.error("createDoc missing taskType: " + taskType)
            }
        }


    });


};