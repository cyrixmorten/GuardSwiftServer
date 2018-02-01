import * as moment from 'moment';
import * as _ from 'lodash';
import {TaskType} from "../../shared/subclass/Task";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {sendReport} from "../pdf/report.send.to.client";


export class SendReports {


    async sendRegularReports(user: Parse.User, fromDate: Date, toDate: Date, taskType: TaskType) {
        let reportSettings: ReportSettings = await new ReportSettingsQuery().matchingOwner(user).matchingTaskType(taskType).build().first({useMasterKey: true});


        if (!reportSettings) {
            throw new Error(`Missing reportSettings for user: ${user.get('username')} and taskType: ${taskType}`)
        }

        let reportQuery = new ReportQuery()
            .matchingTaskType(taskType)
            .createdAfter(fromDate)
            .createdBefore(toDate)
            .build();

        await reportQuery.each( async (report: Report) => {
            try {
                await sendReport(report.id, reportSettings);
            } catch (e) {
                console.error('Error sending report', report.id, e);
            }
        }, { useMasterKey: true });
    }

}



