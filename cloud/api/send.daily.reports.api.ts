import * as moment from 'moment';
import * as _ from 'lodash';
import { SendReports } from '../jobs/send.reports';


export const API_FUNCTION_SEND_REPORTS_TO_CLIENTS = "sendReportsToClients";


Parse.Cloud.define(API_FUNCTION_SEND_REPORTS_TO_CLIENTS,  async (request) => {

    const {
        force,
        taskTypes,
        timeBack
    } = request.params;

    if (!_.isArray(taskTypes)) {
        throw 'Missing taskTypes param (must be array)';
    }

    if (!_.isObject(timeBack)) {
        throw 'Missing timeBack param';
    }

    if (timeBack) {
        if (!timeBack.amount || !timeBack.unit) {
            throw 'Missing amount or unit on timeBack param';
        }

        if (!_.isNumber(timeBack.amount)) {
            throw 'timeBack amount must be a number';
        }

        if (!_.isString(timeBack.unit)) {
            throw 'timeBack unit must be a string';
        }
    }

    let fromDate = () => {
        // default: go back 24 hours
        let unit: moment.unitOfTime.DurationConstructor = timeBack ? timeBack.unit : 'days';
        let amount: number = timeBack ? timeBack.amount : 1;

        return moment().subtract(amount, unit).toDate();
    };

    let toDate = () => moment().toDate();

    await new SendReports().sendToAllUsers(fromDate(), toDate(), taskTypes, force);
});






