import {ReportUtils} from "./reportUtils";

import * as reportToPdf from './reportToPDF';
import * as moment from 'moment';
import * as _ from 'lodash';
import sgMail = require("@sendgrid/mail");


import {Person} from "../../shared/subclass/Person";
import {Report} from "../../shared/subclass/Report";
import {Client} from "../../shared/subclass/Client";
import IPromise = Parse.IPromise;
import {RequestResponse} from "request";
import {AttachmentData} from "@sendgrid/helpers/classes/attachment";
import {EmailData} from "@sendgrid/helpers/classes/email-address";
import {ReportSettings, ReportSettingsQuery} from "../../shared/subclass/ReportSettings";
import {TaskType} from "../../shared/subclass/Task";
import {ClientContact} from "../../shared/subclass/ClientContact";

let taskSettings = (report: Report) => {

    let createdAt = moment(report.get('createdAt')).format('DD-MM-YYYY');
    let clientName = report.get('client').get('name');

    let taskSettings = {
        taskType: '',
        subject: '',
        text: 'Rapporten er vedhæftet som PDF dokument',
        fileName: ''
    };

    switch (report.taskType) {
        case TaskType.ALARM: {
            taskSettings.taskType = "Alarm"; // TODO: translate
            break;
        }
        case TaskType.REGULAR: {
            taskSettings.taskType = "Gående tilsyn"; // TODO: translate
            break;
        }
        case TaskType.RAID: {
            taskSettings.taskType = "Kørende tilsyn"; // TODO: translate
            break;
        }
        case TaskType.STATIC: {
            taskSettings.taskType = "Fastvagt"; // TODO: translate
            break;
        }
    }


    if (taskSettings.taskType) {
        if (!taskSettings.subject) {
            taskSettings.subject = clientName + ' - ' + taskSettings.taskType + ' ' + createdAt;
        }
        if (!taskSettings.fileName) {
            taskSettings.fileName = clientName + '-' + taskSettings.taskType + '-' + createdAt;
        }
    }


    return taskSettings;
};

Parse.Cloud.define("sendReport", (request, response) => {
    sendReport(request.params.reportId).then(() => {
        response.success('Report successfully sent!')
    }, (error) => {
        response.error(error)
    })
});

export let sendReport = (reportId: string, reportSettings?: ReportSettings): IPromise<any> => {

    console.log('Send report: ' + reportId);

    if (!reportId) {
        return Parse.Promise.error('missing reportId');
    }

    let _report: Report;

    let mailSetup = {
        replytoName: '',
        replytoEmail: '',

        bccNames: [],
        bccEmails: [],

        toNames: [],
        toEmails: [],

        status: {},
        errors: false
    };


    return ReportUtils.fetchReport(reportId).then((report: Report) => {
        _report = report;

        let client: Client = report.client;

        let contacts: ClientContact[] = _.filter(
            client.contacts, (contact: ClientContact) => {
                return contact.receiveReports && !!contact.email;
            });


        mailSetup.toNames = _.map(contacts, (contact: ClientContact) => {
            return contact.name
        });
        mailSetup.toEmails = _.map(contacts, (contact: ClientContact) => {
            return contact.email
        });


        return reportSettings ? reportSettings : new ReportSettingsQuery().matchingOwner(report.owner).matchingTaskType(report.taskType).build().first({useMasterKey: true})
    }).then((reportSettings: ReportSettings) => {

        mailSetup.replytoName = reportSettings.replyToName;
        mailSetup.replytoEmail = reportSettings.replyToEmail;

        mailSetup.bccNames = reportSettings.bccNames;
        mailSetup.bccEmails = reportSettings.bccEmails;

        return reportToPdf.toPdf(reportId, reportSettings);

    }).then((httpResponse) => {

        let reportSettings = taskSettings(_report);

        let receivers: string[] = [];

        let getSubject = (): string => {
            return reportSettings.subject;
        };

        let getText = (): string => {
            return reportSettings.text;
        };

        let getFrom = (): EmailData => {
            return { name: "GuardSwift", email: "report@guardswift.com"};
        };

        let getTo = (): EmailData[] => {

            let to: EmailData[] = [];

            // to client receivers
            _.forEach(_.zip(mailSetup.toEmails, mailSetup.toNames),  (mailTo) => {
                let mailAddress = mailTo[0];
                let mailName = mailTo[1];

                if (!_.includes(receivers, mailAddress)) {

                    to.push({name: mailName, email: mailAddress});
                    receivers.push(mailAddress);

                    console.log('to', mailAddress);
                }
            });

            // Notify the owner that this report did not reach any clients
            if (_.isEmpty(mailSetup.toEmails)) {

                console.error('Report is missing receivers! ' + _report.id);

                let ownerEmail = _report.get('owner').get('email');
                let ownerName = _report.get('owner').get('username');

                mailSetup.toEmails = [ownerEmail];
                mailSetup.toNames = [ownerName];

                if (!_.includes(receivers, ownerEmail)) {

                    to.push({name: ownerName, email: ownerEmail});
                    receivers.push(ownerEmail);

                    console.log('to owner', ownerEmail);
                }

            }

            return to;
        };

        let getReplyTo = (): EmailData => {
            return {name: mailSetup.replytoName, email: mailSetup.replytoEmail}
        };

        let getBccs = (): EmailData[]  => {

            let bccs: EmailData[] = [];

            // always send bcc to developer
            let developerMail = 'cyrixmorten@gmail.com'; // TODO environment variable
            if (!_.includes(receivers, developerMail)) {


                bccs.push(developerMail);
                receivers.push(developerMail);

                console.log('bcc developer', developerMail);
            }

            // bcc task admins
            _.forEach(_.zip(mailSetup.bccEmails, mailSetup.bccNames),  (mailBcc) => {
                let mailAddress = mailBcc[0];
                let mailName = mailBcc[1];

                if (!_.includes(receivers, mailAddress)) {
                    let bcc = {name: mailName, email: mailAddress};

                    bccs.push(developerMail);
                    receivers.push(developerMail);

                    console.log('bcc', mailAddress);
                }
            });

            return bccs;
        };

        let getAttachments = (): AttachmentData[] => {
            return [
                {
                    filename: reportSettings.fileName + '.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment',
                    content: new Buffer(httpResponse.buffer).toString('base64')
                },
            ]
        };

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        return sgMail.sendMultiple({
            from: getFrom(),
            to: getTo(),
            bcc: getBccs(),
            replyTo: getReplyTo(),
            subject: getSubject(),
            text: getText(),
            attachments: getAttachments()
        })

    }).then((result: [RequestResponse, {}]) => {

        let httpResponse = result[0];

        mailSetup.errors = httpResponse.statusCode < 200 || httpResponse.statusCode > 300;

        _report.set('mailStatus', mailSetup);

        return _report.save(null, {useMasterKey: true});
    });
};

