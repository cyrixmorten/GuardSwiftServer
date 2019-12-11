import * as moment from "moment-timezone"
import * as _ from "lodash";
import { ClientArrivalWeekReport } from '../../pdf/statistics/client-arrival-automation/client.arrival.week.report';
import { UserQuery } from '../../../shared/subclass/User';


export const API_FUNCTION_CLIENT_ARRIVAL_WEEK_REPORT_PDFMAKE = "clientArrivalWeekReportPdfmake";

export const getClientArrivalWeekReportData = async (weekFromDate = '2019-10-14 07:00', userId = 'H7UpVsPNH7') => {
    
    const owner = await new UserQuery().matchingId(userId).build().first({useMasterKey: true});

    return new ClientArrivalWeekReport(
        owner as Parse.User, 
        moment(weekFromDate).tz(owner.timeZone).toDate())
    .getDefinition();
}

Parse.Cloud.define(API_FUNCTION_CLIENT_ARRIVAL_WEEK_REPORT_PDFMAKE, async (request) => {

    const { params } = request;

    // Dates formatted as ISO 8601
    // Example date: 2013-02-18 09:30

    return getClientArrivalWeekReportData();
});