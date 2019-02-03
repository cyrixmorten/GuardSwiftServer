import * as _ from 'lodash';
import sgMail = require("@sendgrid/mail");
import moment = require('moment');
import { TaskType } from '../../shared/subclass/Task';
import { ReportSettings, ReportSettingsQuery } from '../../shared/subclass/ReportSettings';
import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';
import { ClientContact } from '../../shared/subclass/ClientContact';
import { ReportToPDF } from '../pdf/report.to.pdf';
import { EmailData } from "@sendgrid/helpers/classes/email-address";
import { AttachmentData } from '@sendgrid/helpers/classes/attachment';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { User } from '../../shared/subclass/User';

export class SendReports {

    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    async sendToAllUsers(fromDate: Date, toDate: Date, taskTypes: TaskType[], force: boolean = false) {
        let query = new Parse.Query(Parse.User);
        query.equalTo(User._active, true);
        return query.each((user) => {

            return this.sendAllMatchingTaskTypes(user, fromDate, toDate, taskTypes, force);

        }, {useMasterKey: true})
    }

    async sendAllMatchingTaskTypes(user: Parse.User, fromDate: Date, toDate: Date, taskTypes: TaskType[], force: boolean = false) {
        return Promise.all(_.map(taskTypes,  (taskType: TaskType) => {
            // wrap try-catch to ignore errors
            // missing reportSettings for a user should not prevent remaining reports from being sent
            try {
                return this.sendAllMatchingTaskType(user, fromDate, toDate, taskType, force);
            } catch (e) {
                console.error(`Failed to send ${taskType} reports`, e);
            }
        }));
    }

    private async sendAllMatchingTaskType(user: Parse.User, fromDate: Date, toDate: Date, taskType: TaskType, force: boolean = false) {

        console.log('Sending reports for user:', user.get('username'), 'taskType', taskType);

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
                .lessThan('updatedAt', fromDate);
        } else {
            reportQueryBuilder
                .createdAfter(fromDate)
                .createdBefore(toDate)
                .isClosed();
        }

        if (!force) {
            reportQueryBuilder.isNotSent()
        }

        reportQueryBuilder.include(...this.getReportIncludes());

        await reportQueryBuilder.build().each(async (report: Report) => {
            try {
                await this.send(report, reportSettings);
            } catch (e) {
                console.error('Error sending report', report.id, e);
            }
        }, {useMasterKey: true});
    }

    private getReportIncludes(): Array<keyof Report> {
        return [Report._owner, Report._tasksGroupStarted, `${Report._client}.${Client._contacts}` as any]
    }

    async send(report: Report, reportSettings?: ReportSettings): Promise<any> {

        if (!report.owner || !report.taskGroupStarted || !report.client || !report.client.contacts) {
            report = await new ReportQuery().matchingId(report.id)
                .include(...this.getReportIncludes()).build()
                .first({useMasterKey: true});
        }

        if (!reportSettings) {
            reportSettings = await new ReportSettingsQuery().matchingOwner(report.owner)
                .matchingTaskType(report.taskType).build().first({useMasterKey: true});
        }

        return Promise.all([
            this.sendToClients(report, reportSettings),
            this.sendToOwners(report, reportSettings),
        ]);
    }

    private async sendToClients(report: Report, reportSettings: ReportSettings): Promise<any> {
        const receivers: string[] = [];

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

        report.mailStatus = {
            to: mailData.to || [],
            statusCode: 0,
            statusMessage: ''
        };

        if (!_.isEmpty(mailData.to)) {
            const [httpResponse] = await sgMail.send(mailData);

            const {statusCode, statusMessage} = httpResponse;

            _.assign(report.mailStatus, {
                statusCode,
                statusMessage
            })
        }

        // Alarm and static reports are closed when sent
        if (_.includes([TaskType.ALARM, TaskType.STATIC], report.taskType)) {
            report.isClosed = true;
        }

        return report.save(null, {useMasterKey: true});
    }

    private async sendToOwners(report: Report, reportSettings: ReportSettings): Promise<any> {
        const receivers: string[] = [];


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