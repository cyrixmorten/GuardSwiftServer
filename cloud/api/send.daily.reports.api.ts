import * as moment from 'moment';
import * as _ from 'lodash';
import {TaskType} from "../../shared/subclass/Task";
import { SendReports } from '../jobs/send.reports';


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
    taskTypes: TaskType[],
    force: boolean;
}

Parse.Cloud.define(API_FUNCTION_SEND_REPORTS_TO_CLIENTS,  async (request, status) => {

    console.log(API_FUNCTION_SEND_REPORTS_TO_CLIENTS, JSON.stringify(request.params));

    const params: IParams = request.params;

    const force = params.force; // ignore the isSent flag if true
    const taskTypes = params.taskTypes ? _.concat([], params.taskTypes) : [TaskType.REGULAR, TaskType.RAID];
    const timeBack = params.timeBack;
    if (timeBack) {
        if (!timeBack.amount || !timeBack.unit) {
            status.error(`When passing timeBack both units and amount should be added\n
                    Example: {
                            timeBack: {
                                amount: 15, 
                                units: 'minutes'
                            }
                    }`
            );
            return;
        }

        if (!_.isNumber(timeBack.amount)) {
            status.error('timeBack amount must be a number');
            return;
        }

        if (!_.isString(timeBack.unit)) {
            status.error('timeBack unit must be a string');
            return;
        }
    }

    let fromDate = () => {
        // default: go back 24 hours
        let unit: moment.unitOfTime.DurationConstructor = timeBack ? timeBack.unit : 'days';
        let amount: number = timeBack ? timeBack.amount : 1;

        return moment().subtract(amount, unit).toDate();
    };

    let toDate = () => moment().toDate();

    try {
        await new SendReports().sendToAllUsers(fromDate(), toDate(), taskTypes, force);
        status.success('Done sending mail reports');
    } catch(e) {
        status.error(e);
    }
});






