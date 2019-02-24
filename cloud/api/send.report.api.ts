import { SendReports } from '../jobs/send.reports';
import { Report } from '../../shared/subclass/Report';

export const API_FUNCTION_SEND_REPORT = "sendReport";

/**
 * Send a single report to client receivers
 */
Parse.Cloud.define(API_FUNCTION_SEND_REPORT, (request, response) => {

    const reportId = request.params.reportId;

    if (!reportId) {
        response.error('Missing reportId param');
    }

    new SendReports().send(Report.createWithoutData(reportId)).then(() => {
        response.success('Report successfully sent!')
    }, (error) => {
        response.error(error)
    })
});


