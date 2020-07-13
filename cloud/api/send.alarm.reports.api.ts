import * as moment from 'moment';
import * as _ from 'lodash';
import { SendReports } from '../jobs/send.reports';


export const API_FUNCTION_SEND_ALARM_REPORTS = "sendAlarmReports";


Parse.Cloud.job(API_FUNCTION_SEND_ALARM_REPORTS,  async (request) => {

    const { params, message: msgCallback } = request;

    const {
        timeBack,
    } = params;


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
    
    await new SendReports(msgCallback).sendAlarmReports(fromDate())
});






