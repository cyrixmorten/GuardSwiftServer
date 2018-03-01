import * as moment from 'moment';
import * as _ from 'lodash';
import {TaskType} from "../../shared/subclass/Task";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {User} from "../../shared/subclass/User";
import {sendReport} from "../pdf/report.send.to.client";


export const API_FUNCTION_SEND_REPORTS_TO_CLIENTS = "sendReportsToClients";

/**
 * Send all reports
 *
 * params: {
 *      days: number - amount of days to look back
 *      time_back: {
 *          amount: number
 *          unit: 'minutes' | 'days'
 *      },
 *      taskTypes: TaskType[]
 * }
 *
 */
export interface IParams {
    timeBack: {
        amount: number;
        unit: 'minutes' | 'days';
    },
    taskTypes: TaskType[]
}

Parse.Cloud.define(API_FUNCTION_SEND_REPORTS_TO_CLIENTS,  (request, status) => {

    console.log(API_FUNCTION_SEND_REPORTS_TO_CLIENTS, JSON.stringify(request.params));

    let params: IParams = request.params;

    let fromDate = () => {
        // default: go back 24 hours
        let unit: moment.unitOfTime.DurationConstructor = 'days';
        let amount: number = 1;

        let timeBack = params.timeBack;
        if (timeBack && timeBack.amount && timeBack.unit) {
            amount = timeBack.amount;
            unit = timeBack.unit;
        } else {
            status.error(
                `When passing time_back both units and amount should be added\n
                    Example: {
                            timeBack: {
                                amount: 15, 
                                units: 'minutes'
                            }
                    }`
            );

            return;
        }

        return moment().subtract(amount, unit).toDate();
    };

    let toDate = () => moment().toDate();

    let taskTypes = params.taskTypes ? params.taskTypes : [TaskType.REGULAR, TaskType.RAID];

    let query = new Parse.Query(Parse.User);
    query.equalTo(User._active, true);
    query.each( (user) =>  {

            console.log('Sending reports for user: ', user.get('username'));

            return Promise.all(_.map(taskTypes, async (taskType: TaskType) => {
                // wrap try-catch to ignore errors (missing reportSettings for a user should not prevent remaining
                // reports from being sent)
                try {
                    console.log('Sending reports for taskType: ', taskType);
                    return await sendReportsToClients(user, fromDate(), toDate(), taskType);
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

    // regular/raid
    let reportQueryBuilder = new ReportQuery()
        .matchingTaskType(taskType);


    if (taskType === TaskType.ALARM) {
        reportQueryBuilder
            .lessThan('timeEnded', fromDate)
            .lessThan('updatedAt', fromDate)
            .isNotSent()
    } else {
        reportQueryBuilder
            .createdAfter(fromDate)
            .createdBefore(toDate)
    }

    await reportQueryBuilder.build().each( async (report: Report) => {
        try {
            await sendReport(report.id, reportSettings);
        } catch (e) {
            console.error('Error sending report', report.id, e);
        }
    }, { useMasterKey: true });
};


