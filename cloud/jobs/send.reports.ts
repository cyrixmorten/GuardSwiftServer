import * as _ from 'lodash';
import sgMail = require("@sendgrid/mail");
import moment = require('moment');
import { TaskType } from '../../shared/subclass/Task';
import { ReportSettings, ReportSettingsQuery } from '../../shared/subclass/ReportSettings';
import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';
import { ClientContact } from '../../shared/subclass/ClientContact';
import { ReportToPDF } from '../pdf/report.to.pdf';
import { RequestResponse } from 'request';
import {EmailData} from "@sendgrid/helpers/classes/email-address";
import { AttachmentData } from '@sendgrid/helpers/classes/attachment';
import { MailData } from '@sendgrid/helpers/classes/mail';

export class SendReports {

    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

     async sendAll(user: Parse.User, fromDate: Date, toDate: Date, taskType: TaskType, force: boolean = false)  {

        let reportSettings: ReportSettings = await new ReportSettingsQuery()
            .matchingOwner(user)
            .matchingTaskType(taskType)
            .build().first({useMasterKey: true});

        if (!reportSettings) {
            throw new Error(`Missing reportSettings for user: ${user.get('username')} and taskType: ${taskType}`)
        }

        // regular/raid
        let reportQueryBuilder: ReportQuery = new ReportQuery()
            .hasClient()
            .matchingOwner(user)
            .matchingTaskType(taskType);


        if (taskType === TaskType.ALARM) {
            reportQueryBuilder
                .lessThan('timeEnded', fromDate)
                .lessThan('updatedAt', fromDate)
                .isNotSent();
        } else {
            reportQueryBuilder
                .createdAfter(fromDate)
                .createdBefore(toDate)
                .isClosed();

            if (!force) (
                reportQueryBuilder.isNotSent()
            )

        }

        await reportQueryBuilder.build().each( async (report: Report) => {
            try {
                if (_.includes([TaskType.ALARM, TaskType.STATIC], taskType)) {
                    // mark report as closed
                    report.isClosed = true;

                    await report.save(null, {useMasterKey: true});
                }

                await this.sendToClients(report.id, reportSettings);
                await this.sendToOwners(report.id, reportSettings);
            } catch (e) {
                console.error('Error sending report', report.id, e);
            }
        }, { useMasterKey: true });
    }

    async sendToClients(reportId: string, reportSettings?: ReportSettings): Promise<any> {

        if (!reportId) {
            throw new Error('sendToClients missing reportId');
        }

        let query = new ReportQuery().matchingId(reportId).build();

        query.include(Report._owner);
        query.include(`${Report._client}.${Client._contacts}`);

        let report = await query.first({useMasterKey: true});

        reportSettings = reportSettings || await new ReportSettingsQuery().matchingOwner(report.owner)
            .matchingTaskType(report.taskType).build().first({useMasterKey: true});


        let receivers: string[] = [];


        let getSubject = (): string => {
            // TODO translate
            let reportName = 'Vagtrapport';
            if (report.taskType === TaskType.STATIC) {
                reportName = 'Fastvagt'
            }

            const createdAtFormatted = moment(report.createdAt).format('DD-MM-YYYY'); //TODO hardcoded date format

            return `${report.client.name} - ${reportName} -  ${createdAtFormatted}`;
        };

        let getText = (): string => {
            return 'Rapporten er vedhæftet som PDF dokument';
        };

        let getFrom = (): EmailData => {
            return {name: "GuardSwift", email: "report@guardswift.com"};
        };

        let getTo = (): EmailData[] => {

            let to: EmailData[] = [];

            const contacts: ClientContact[] = _.filter(
                report.client.contacts, (contact: ClientContact) => {
                    return contact.receiveReports && !!contact.email;
                });

            const toNames = _.map(contacts, (contact: ClientContact) => {
                return contact.name
            });
            const toEmails = _.map(contacts, (contact: ClientContact) => {
                return contact.email
            });

            // to client receivers
            _.forEach(_.zip(toEmails, toNames), (mailTo) => {
                const [toEmail, toName] = mailTo;

                if (!_.includes(receivers, toEmail)) {

                    to.push({name: toName, email: toEmail});
                    receivers.push(toEmail);

                }
            });


            return to;
        };

        let getReplyTo = (): EmailData => {
            return {name: reportSettings.replyToName, email: reportSettings.replyToEmail}
        };


        const mailData: MailData = {
            from: getFrom(),
            to: getTo(),
            replyTo: getReplyTo(),
            subject: getSubject(),
            text: getText(),
            attachments: await this.getAttachments(report, reportSettings)
        };

        if (!_.isEmpty(mailData.to)) {
            let result: [RequestResponse, {}] = await sgMail.send(mailData);


            let httpResponse = result[0];

            report.mailStatus = {
                to: mailData.to,
                status: httpResponse.statusCode
            };

            return report.save(null, {useMasterKey: true});
        }
    }

    async sendToOwners(reportId: string, reportSettings?: ReportSettings): Promise<any> {

        if (!reportId) {
            throw new Error('sendToOwners missing reportId');
        }

        let query = new ReportQuery().matchingId(reportId).build();

        query.include(Report._owner);
        query.include(Report._tasksGroupStarted);
        query.include(`${Report._client}.${Client._contacts}`);

        let report = await query.first({useMasterKey: true});

        reportSettings = reportSettings || await new ReportSettingsQuery().matchingOwner(report.owner)
            .matchingTaskType(report.taskType).build().first({useMasterKey: true});


        let receivers: string[] = [];


        let getSubject = (): string => {
            const taskGroupName = report.taskGroupStarted.name;
            const clientName = _.trim(`${report.client.clientId} ${report.client.name}`);
            const reportName = (report.taskType === TaskType.STATIC) ? 'Fastvagt' : 'Vagtrapport'; // TODO translate
            const createdAtFormatted = moment(report.createdAt).format('DD-MM-YYYY'); //TODO hardcoded date format

            return `${taskGroupName} - ${clientName} - ${reportName} -  ${createdAtFormatted}`;
        };

        let getHTML = (): string => {
            const contacts: ClientContact[] = _.filter(
                report.client.contacts, (contact: ClientContact) => {
                    return contact.receiveReports && !!contact.email;
                });

            if (_.isEmpty(contacts)) {
                return '<p>Der er ingen kontaktpersoner der modtager rapporter for denne kunde</p>'
            }

            let text = 'Denne rapport er blevet sendt til følgende kontaktpersoner:';
            text += '<p>';
            _.forEach(contacts, (contact: ClientContact) => {
                text += `${contact.name} ${contact.email}`;
                text += '<br/>'
            });
            text += '</p>';


            return text;
        };

        let getFrom = (): EmailData => {
            return {name: "GuardSwift", email: "report@guardswift.com"};
        };

        let getTo = (): EmailData[] => {

            let to: EmailData[] = [];

            _.forEach(_.zip(reportSettings.bccEmails, reportSettings.bccNames), (mailOwner) => {
                const [toEmail, toName] = mailOwner;

                if (!_.includes(receivers, toEmail)) {
                    to.push({name: toName, email: toEmail});
                    receivers.push(toEmail);

                }
            });

            return to;
        };

        let getReplyTo = (): EmailData => {
            return {name: reportSettings.replyToName, email: reportSettings.replyToEmail}
        };

        let getBcc = (): EmailData[] => {

            let bccs: EmailData[] = [];

            let developerMail = 'cyrixmorten@gmail.com'; // TODO environment variable
            if (!_.includes(receivers, developerMail)) {
                bccs.push(developerMail);
                receivers.push(developerMail);
            }

            return bccs;
        };

        const mailData: MailData = {
            from: getFrom(),
            to: getTo(),
            bcc: getBcc(),
            replyTo: getReplyTo(),
            subject: getSubject(),
            html: getHTML(),
            attachments: await this.getAttachments(report, reportSettings)
        };

        return sgMail.send(mailData);
    }

    private async getAttachments(report: Report, reportSettings?: ReportSettings): Promise<AttachmentData[]> {
        const createdAtFormatted = moment(report.createdAt).format('DD-MM-YYYY'); //TODO hardcoded date format

        let pdfBuffer = await ReportToPDF.buildPdf(report.id, reportSettings);

        return [
            {
                filename: `${report.client.name}_${createdAtFormatted}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment',
                content: new Buffer(pdfBuffer).toString('base64')
            },
        ]
    };
}