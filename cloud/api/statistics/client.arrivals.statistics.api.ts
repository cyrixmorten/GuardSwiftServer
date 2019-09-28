import * as moment from "moment-timezone"
import * as _ from "lodash";
import { ClientArrivalAutomationStatistics } from '../../statistics/clients.arrival.automation.statistics';

export const API_JOB_CLIENT_ARRIVAL_STATISTICS = "clientArrivalStatistics";

Parse.Cloud.define(API_JOB_CLIENT_ARRIVAL_STATISTICS, async (request) => {

    const { params } = request;

    // https://momentjs.com/timezone/
    let timeZone = 'Europe/Copenhagen';

    // Dates formatted as ISO 8601
    // Example date: 2013-02-18 09:30
    let fromDate = '2019-09-10 09:00';
    let toDate = '2019-09-20 12:00';

    return new ClientArrivalAutomationStatistics(
        Parse.User.createWithoutData('H7UpVsPNH7'),
        moment(fromDate).toDate(),
        moment(toDate).toDate(),
    ).generate();
});