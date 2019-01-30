import { SendReports } from '../jobs/send.reports';

export const API_FUNCTION_SEND_REPORT = "sendReport";

/**
 * Send a single report to client receivers
 */
Parse.Cloud.define(API_FUNCTION_SEND_REPORT, (request, response) => {
    new SendReports().sendToClients(request.params.reportId).then(() => {
        response.success('Report successfully sent!')
    }, (error) => {
        response.error(error)
    })
});


