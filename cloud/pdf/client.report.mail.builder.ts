import * as moment from 'moment';
import * as _ from 'lodash';


import {Report, ReportQuery} from "../../shared/subclass/Report";
import {Client} from "../../shared/subclass/Client";
import {AttachmentData} from "@sendgrid/helpers/classes/attachment";
import {EmailData} from "@sendgrid/helpers/classes/email-address";
import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {TaskType} from "../../shared/subclass/Task";
import {ClientContact} from "../../shared/subclass/ClientContact";
import {ReportToPDF} from "./report.to.pdf";
import {MailDataBuilder} from "./mail.data.builder";

export class ClientReportMailBuilder extends MailDataBuilder {


    private receivers: EmailData[] = [];
    private createdAt: string = "";


    constructor(private report: Report, private reportSettings: ReportSettings) {
        super();

        //TODO hardcoded date format
        this.createdAt = moment(this.report.createdAt).format('DD-MM-YYYY');
    }

    static async create(reportId: string, reportSettings?: ReportSettings) {
        let query = new ReportQuery().matchingId(reportId).build();

        query.include(Report._owner);
        query.include(`${Report._client}.${Client._contacts}`);

        let report = await query.first({useMasterKey: true});

        reportSettings = reportSettings || await new ReportSettingsQuery().matchingOwner(report.owner)
            .matchingTaskType(report.taskType).build().first({useMasterKey: true});

        return new ClientReportMailBuilder(report, reportSettings);
    }

    private addUniqueReceiver(list: EmailData[], emailData: EmailData) {
        if (!_.includes(this.receivers, emailData)) {
            list.push(emailData);
            this.receivers.push(emailData);

        }
    }

    getReport(): Report {
        return this.report;
    }

    async getFrom(): Promise<EmailData> {
        return {name: "GuardSwift", email: "report@guardswift.com"};
    }

    async getTo(): Promise<EmailData[]> {
        let contacts: ClientContact[] = _.filter(
            this.report.client.contacts, (contact: ClientContact) => {
                return contact.receiveReports && !!contact.email;
            });


        let toNames = _.map(contacts, (contact: ClientContact) => {
            return contact.name
        });
        let toEmails = _.map(contacts, (contact: ClientContact) => {
            return contact.email
        });

        let to: EmailData[] = [];

        // to client receivers
        _.forEach(_.zip(toEmails, toNames), (mailTo) => {
            let mailAddress = mailTo[0];
            let mailName = mailTo[1];

            this.addUniqueReceiver(to, {name: mailName, email: mailAddress})
        });

        // Notify the owner that this report did not reach any clients
        if (_.isEmpty(toEmails)) {

            console.error('Report is missing receivers! ' + this.report.id);

            let ownerEmail = this.report.owner.getEmail();
            let ownerName = this.report.owner.getUsername();

            this.addUniqueReceiver(to, {name: ownerName, email: ownerEmail});

        }

        return to;
    }

    async getBccs(): Promise<EmailData[]> {
        let bccs: EmailData[] = [];

        // always send bcc to developer
        this.addUniqueReceiver(bccs, 'cyrixmorten@gmail.com'); // TODO environment variable

        // bcc task admins
        _.forEach(_.zip(this.reportSettings.bccEmails, this.reportSettings.bccNames), (mailBcc) => {
            let mailAddress = mailBcc[0];
            let mailName = mailBcc[1];

            this.addUniqueReceiver(bccs, {name: mailName, email: mailAddress});
        });

        return bccs;
    }

    async getReplyTo(): Promise<EmailData> {
        return {name: this.reportSettings.replyToName, email: this.reportSettings.replyToEmail}
    }

    async getSubject(): Promise<string> {
        // TODO translate
        let reportName = 'Vagtrapport';
        if (this.report.taskType === TaskType.STATIC) {
            reportName = 'Fastvagt'
        }

        return `${this.report.client.name} - ${reportName} -  ${this.createdAt}`;
    }

    async getText(): Promise<string> {
        return 'Rapporten er vedhæftet som PDF dokument';
    }

    async getAttachments(): Promise<AttachmentData[]> {

        let owner = await this.report.owner.fetch({useMasterKey: true});
        let pdfDoc = await ReportToPDF.reportBuilder(owner.timeZone, this.report, this.reportSettings).generate();
        let pdfHttpResponse = await ReportToPDF.generatePDF(pdfDoc);

        return [
            {
                filename: `${this.report.client.name}_${this.createdAt}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment',
                content: new Buffer(pdfHttpResponse.buffer).toString('base64')
            },
        ]
    }


}
