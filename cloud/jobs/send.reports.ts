import * as _ from 'lodash';
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
import { ReportHelper } from '../utils/ReportHelper';
import sgMail = require("@sendgrid/mail");
import moment = require('moment');
import { Dictionary } from 'lodash';

export class SendReports {

    // if called with message then this class has been constructed via a Cloud Code job
    constructor(private messageCallback: (response: any) => void = _.noop) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    async sendToAllUsers(fromDate: Date, toDate: Date, taskTypes: TaskType[], force: boolean = false) {
        let query = new Parse.Query(Parse.User);
        query.equalTo(User._active, true);
        return query.each((user: Parse.User) => {

            this.messageCallback(`Sending reports for user: ${user.getUsername()}`);

            try {
                return this.sendAllMatchingTaskTypes(user, fromDate, toDate, taskTypes, force);
            } catch (e) {
                this.messageCallback(`Error while sending to user: ${user.getUsername()}\n\n${e.message}`);

                console.error(e);
            }


        }, {useMasterKey: true})
    }

    async send(report: Report, reportSettings?: ReportSettings): Promise<any> {

        // TODO parse-server >= 2.0.2 use report.fetchWithInclude
        if (!report.owner || !report.taskGroupStarted || !report.client) {
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

    private async sendAllMatchingTaskTypes(user: Parse.User, fromDate: Date, toDate: Date, taskTypes: TaskType[], force: boolean = false) {
        return Promise.all(_.map(taskTypes,  async (taskType: TaskType) => {
            // wrap try-catch to ignore errors
            // missing reportSettings for a user should not prevent remaining reports from being sent
            try {
                await this.sendAllMatchingTaskType(user, fromDate, toDate, taskType, force);
            } catch (e) {
                console.error(e);
                throw new Error(`Failed to send ${taskType} reports for user ${user.getUsername()}`);
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
                .createdBefore(toDate);
        }

        if (!force) {
            reportQueryBuilder.isSent(false);
        }

        reportQueryBuilder.include(...this.getReportIncludes());

        const reports = await reportQueryBuilder.build().limit(Number.MAX_SAFE_INTEGER).find({useMasterKey: true});

        if (taskType === TaskType.ALARM) {
            return Promise.all(_.map(reports, (report) => this.send(report, reportSettings)))
        }

        const groupedByTaskGroup: Dictionary<Report[]> = _.groupBy(reports, (report: Report) => report.taskGroupStarted.name);

        await this.sendReportsForTaskGroup(groupedByTaskGroup, reportSettings);
    }

    private async sendReportsForTaskGroup(groupedByTaskGroup: Dictionary<Report[]>, reportSettings?: ReportSettings) {
        const sortedGroupNames = _.keys(groupedByTaskGroup).sort().reverse();

        for (const groupName of sortedGroupNames) {
            await this.sendReports(groupedByTaskGroup[groupName], reportSettings);
        }
    }

    private async sendReports(reports: Report[], reportSettings?: ReportSettings) {
        const sortedReports = _.sortBy(reports, (report: Report) => report.client.idAndName).reverse();

        for (const report of sortedReports) {
            console.log(report.client.idAndName);
            await this.send(report, reportSettings);
        }
    }


    private getReportIncludes(): Array<keyof Report> {
        return [Report._owner, Report._taskGroupStarted, Report._client, `${Report._client}.${Client._contacts}` as any]
    }

    private async sendToClients(report: Report, reportSettings: ReportSettings): Promise<any> {
        const receivers: string[] = [];

        const client: Client = report.client;

        let getSubject = (): string => {
            // TODO translate
            let reportName = 'Vagtrapport';
            if (report.taskType === TaskType.STATIC) {
                reportName = 'Fastvagt'
            }

            const createdAtFormatted = moment(report.createdAt).format('DD-MM-YYYY'); //TODO hardcoded date format

            return `${client.name} - ${reportName} -  ${createdAtFormatted}`;
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
                client.contacts, (contact: ClientContact) => {
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
            attachments: await this.getCustomerReportAttachments(report, reportSettings)
        };

        // mark as sent no matter what so we do not keep attempting to send it
        report.isSent = true;

        if (!_.isEmpty(mailData.to)) {
            try {
                const [httpResponse] = await sgMail.send(mailData);

                const {statusCode, statusMessage} = httpResponse;
    
                report.mailStatus = {
                    statusCode,
                    statusMessage
                }
            } catch(e) {
                report.mailStatus = {
                    statusCode: 500,
                    statusMessage: JSON.stringify(e)
                }
            }

            report.mailStatus = Object.assign(report.mailStatus, {
                to: mailData.to,
                date: new Date()
            });
        }

        // Alarm and static reports are closed when sent
        if (_.includes([TaskType.ALARM, TaskType.STATIC], report.taskType)) {
            ReportHelper.closeReport(report);
        }

        return report.save(null, {useMasterKey: true});
    }

    private async sendToOwners(report: Report, reportSettings: ReportSettings): Promise<any> {
        const receivers: string[] = [];

        const client: Client = report.client;

        let getSubject = (): string => {
            const taskGroupName = report.taskGroupStarted.name;
            const clientName = _.trim(client.idAndName);
            const reportName = (report.taskType === TaskType.STATIC) ? 'Fastvagt' : 'Vagtrapport'; // TODO translate
            const createdAtFormatted = moment(report.createdAt).format('DD-MM-YYYY'); //TODO hardcoded date format

            return `${taskGroupName} - ${clientName} - ${reportName} -  ${createdAtFormatted}`;
        };

        let getHTML = (): string => {
            const contacts: ClientContact[] = _.filter(
                client.contacts, (contact: ClientContact) => {
                    return contact.receiveReports && !!contact.email;
                });

            if (_.isEmpty(contacts)) {
                // TODO: translate
                return '<p>Der er ingen kontaktpersoner der modtager rapporter for denne kunde</p>'
            }

            // TODO: translate
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
            attachments: await this.getOwnerReportAttachments(report, reportSettings)
        };

        if (!_.isEmpty(mailData.to)) {
            try {
                const [httpResponse] = await sgMail.send(mailData);

                const {statusCode, statusMessage} = httpResponse;
    
                report.mailStatus = {
                    statusCode,
                    statusMessage
                }
            } catch(e) {
                report.mailStatus = {
                    statusCode: 500,
                    statusMessage: JSON.stringify(e)
                }
            }

            report.mailStatus = Object.assign(report.mailStatus, {
                to: mailData.to,
                date: new Date()
            });
        }

        return report.save(null, {useMasterKey: true});
    }

    private async getCustomerReportAttachments(report: Report, reportSettings: ReportSettings): Promise<AttachmentData[]> {
        return [
            await this.getPDFAttachment(report, reportSettings, true)
        ];
    }

    private async getOwnerReportAttachments(report: Report, reportSettings: ReportSettings): Promise<AttachmentData[]> {
        const ownerReport = await this.getPDFAttachment(report, reportSettings, false);
        ownerReport.filename = `INTERN_${this.reportFileName(report)}`;

        const clientReport = await this.getPDFAttachment(report, reportSettings, true);
        clientReport.filename = `EXTERN_${this.reportFileName(report)}`;

        return [
            ownerReport,
            clientReport
        ]
    }

    private reportFileName(report: Report) {
        const createdAtFormatted = moment(report.createdAt).format('DD-MM-YYYY'); //TODO hardcoded date format

        return `${report.client.name}_${createdAtFormatted}.pdf`;
    }

    private async getPDFAttachment(report: Report, reportSettings: ReportSettings, customerFacing: boolean): Promise<AttachmentData> {        
        const pdfBuffer = await ReportToPDF.buildPdf(report.id, customerFacing, reportSettings);

        return {
                filename: this.reportFileName(report),
                type: 'application/pdf',
                disposition: 'attachment',
                content: new Buffer(pdfBuffer).toString('base64')
        }
    };
}