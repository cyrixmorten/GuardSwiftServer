
import {sendReport} from "../pdf/report.send.to.client";

export const API_FUNCTION_SEND_REPORT = "sendReport";

/**
 * Send a single report to client receivers
 */
Parse.Cloud.define(API_FUNCTION_SEND_REPORT, (request, response) => {
    sendReport(request.params.reportId).then(() => {
        response.success('Report successfully sent!')
    }, (error) => {
        response.error(error)
    })
});
