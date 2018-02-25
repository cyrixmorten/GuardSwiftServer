import sgMail = require("@sendgrid/mail");

import {RequestResponse} from "request";
import {ReportSettings} from "../../shared/subclass/ReportSettings";
import {ClientReportMailBuilder} from './client.report.mail.builder';


export let sendReport = async (reportId: string, reportSettings?: ReportSettings): Promise<any> => {

    if (!reportId) {
        throw new Error('sendReport missing reportId');
    }

    let mailBuilder = await ClientReportMailBuilder.create(reportId, reportSettings);


    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    let result: [RequestResponse, {}] = await sgMail.send(await mailBuilder.getMailData());


    let httpResponse = result[0];

    let report = mailBuilder.getReport();

    report.mailStatus = {
        to: await mailBuilder.getTo(),
        bcc: await mailBuilder.getBccs(),
        status: httpResponse.statusCode
    };

    return report.save(null, {useMasterKey: true});
};

