import * as moment from 'moment';
import * as _ from 'lodash';
import {TaskType} from "../../shared/subclass/Task";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {User} from "../../shared/subclass/User";
import {sendReport} from "../pdf/report.send.to.client";


Parse.Cloud.define("dailyMailReports",  (request, status) => {

    console.log('dailyMailReports', JSON.stringify(request.params));

    let now = moment();
    let yesterday = moment().subtract(request.params.days || 1, 'days');

    let taskTypes = [TaskType.ALARM, TaskType.REGULAR, TaskType.RAID];

    let query = new Parse.Query(Parse.User);
    query.equalTo(User._active, true);
    query.each( (user) =>  {

            console.log('Sending daily reports for user: ', user.get('username'));

            return Promise.all(_.map(taskTypes, async (taskType: TaskType) => {
                // wrap try-catch to ignore errors (missing reportSettings for a user should not prevent remaining
                // reports from being sent)
                try {
                    console.log('Sending daily reports for taskType: ', taskType);
                    return await sendReportsToClients(user, yesterday.toDate(), now.toDate(), taskType);
                } catch (e) {
                    console.error(`Failed to send ${taskType} reports`, e);
                }
            }));

        }, { useMasterKey: true })
        .then( () => {
            status.success('Done generating mail reports');
        },  (error) => {
            console.error(error);
            status.error(error);

        });
});



let sendReportsToClients = async (user: Parse.User, fromDate: Date, toDate: Date, taskType: TaskType) => {

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
};



