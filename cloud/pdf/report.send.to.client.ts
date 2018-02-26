import sgMail = require("@sendgrid/mail");

import {RequestResponse} from "request";
import {ReportSettings} from "../../shared/subclass/ReportSettings";
import {ClientReportMailBuilder} from './client.report.mail.builder';

import * as _ from "lodash";

export let sendReport = async (reportId: string, reportSettings?: ReportSettings): Promise<any> => {

    if (!reportId) {
        throw new Error('sendReport missing reportId');
    }

    let mailBuilder = await ClientReportMailBuilder.create(reportId, reportSettings);

    let mailData = await mailBuilder.getMailData();

    let status = '';

    try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        let result: [RequestResponse, {}] = await sgMail.send(mailData);

        status = _.pick(result[0], ['message', 'code']);
    } catch (e) {
        console.error(JSON.stringify(status));

        status = _.pick(e, ['message', 'code', 'response.body.errors']);
    } finally {
        let report = mailBuilder.getReport();

        report.mailStatus = {
            to: mailData.to,
            bcc: mailData.bcc,
            status: status
        };

        await report.save(null, {useMasterKey: true});
    }
};

