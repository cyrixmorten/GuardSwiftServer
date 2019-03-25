import { SendReports } from '../jobs/send.reports';
import { Report } from '../../shared/subclass/Report';

export const API_FUNCTION_SEND_REPORT = "sendReport";

/**
 * Send a single report to client receivers
 */
Parse.Cloud.define(API_FUNCTION_SEND_REPORT, async (request) => {

    const {reportId} = request.params;

    if (!reportId) {
        throw 'Missing reportId param';
    }

    await new SendReports().send(Report.createWithoutData(reportId));
});


