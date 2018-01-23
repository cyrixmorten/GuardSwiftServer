import * as moment from 'moment';
import * as _ from 'lodash';
import sgMail = require("@sendgrid/mail");


import {Report, ReportQuery} from "../../shared/subclass/Report";
import {Client} from "../../shared/subclass/Client";
import {RequestResponse} from "request";
import {AttachmentData} from "@sendgrid/helpers/classes/attachment";
import {EmailData} from "@sendgrid/helpers/classes/email-address";
import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {TaskType} from "../../shared/subclass/Task";
import {ClientContact} from "../../shared/subclass/ClientContact";
import {ReportBuilder} from "./report.builder";


export let sendReport = async (reportId: string, reportSettings?: ReportSettings): Promise<any> => {

    if (!reportId) {
        throw new Error('sendReport missing reportId');
    }

    let query = new ReportQuery().matchingId(reportId).build();

    query.include(Report._owner);
    query.include(`${Report._client}.${Client._contacts}`);

    let report = await query.first({useMasterKey: true});

    reportSettings = reportSettings || await new ReportSettingsQuery().matchingOwner(report.owner)
        .matchingTaskType(report.taskType).build().first({useMasterKey: true});

    let contacts: ClientContact[] = _.filter(
        report.client.contacts, (contact: ClientContact) => {
            return contact.receiveReports && !!contact.email;
        });


    let toNames = _.map(contacts, (contact: ClientContact) => {
        return contact.name
    });
    let toEmails = _.map(contacts, (contact: ClientContact) => {
        return contact.email
    });

    let pdfBuffer = await ReportBuilder.buildPdf(reportId, reportSettings);

    let receivers: string[] = [];

    //TODO hardcoded date format
    let createdAt = moment(report.createdAt).format('DD-MM-YYYY');
    let clientName = report.client.name;

    let getSubject = (): string => {
        // TODO translate
        let reportName = 'Vagtrapport';
        if (report.taskType === TaskType.STATIC) {
            reportName = 'Fastvagt'
        }

        return `${report.client.name} - ${reportName} -  ${createdAt}`;
    };

    let getText = (): string => {
        return 'Rapporten er vedhæftet som PDF dokument';
    };

    let getFrom = (): EmailData => {
        return {name: "GuardSwift", email: "report@guardswift.com"};
    };

    let getTo = (): EmailData[] => {

        let to: EmailData[] = [];

        // to client receivers
        _.forEach(_.zip(toEmails, toNames), (mailTo) => {
            let mailAddress = mailTo[0];
            let mailName = mailTo[1];

            if (!_.includes(receivers, mailAddress)) {

                to.push({name: mailName, email: mailAddress});
                receivers.push(mailAddress);

            }
        });

        // Notify the owner that this report did not reach any clients
        if (_.isEmpty(toEmails)) {

            console.error('Report is missing receivers! ' + report.id);

            let ownerEmail = report.owner.getEmail();
            let ownerName = report.owner.getUsername();

            toEmails = [ownerEmail];
            toNames = [ownerName];

            if (!_.includes(receivers, ownerEmail)) {

                to.push({name: ownerName, email: ownerEmail});
                receivers.push(ownerEmail);

            }

        }

        return to;
    };

    let getReplyTo = (): EmailData => {
        return {name: reportSettings.replyToName, email: reportSettings.replyToEmail}
    };

    let getBccs = (): EmailData[] => {

        let bccs: EmailData[] = [];

        // always send bcc to developer
        let developerMail = 'cyrixmorten@gmail.com'; // TODO environment variable
        if (!_.includes(receivers, developerMail)) {


            bccs.push(developerMail);
            receivers.push(developerMail);

        }

        // bcc task admins
        _.forEach(_.zip(reportSettings.bccEmails, reportSettings.bccNames), (mailBcc) => {
            let mailAddress = mailBcc[0];
            let mailName = mailBcc[1];

            if (!_.includes(receivers, mailAddress)) {
                let bcc = {name: mailName, email: mailAddress};

                bccs.push(bcc);
                receivers.push(mailAddress);

            }
        });

        return bccs;
    };

    let getAttachments = (): AttachmentData[] => {
        return [
            {
                filename: `${clientName}_${createdAt}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment',
                content: new Buffer(pdfBuffer).toString('base64')
            },
        ]
    };

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    let result: [RequestResponse, {}] = await sgMail.send({
        from: getFrom(),
        to: getTo(),
        bcc: getBccs(),
        replyTo: getReplyTo(),
        subject: getSubject(),
        text: getText(),
        attachments: getAttachments()
    });


    let httpResponse = result[0];

    report.set('mailStatus', {
        to: getTo(),
        bcc: getBccs(),
        status: httpResponse.statusCode
    });

    return report.save(null, {useMasterKey: true});
};

