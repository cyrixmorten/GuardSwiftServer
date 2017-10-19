import {ReportUtils} from "./reportUtils";

import * as reportToPdf from './reportToPDF';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as sendgrid from 'sendgrid';


import {Person} from "../../shared/subclass/Person";
import {Report} from "../../shared/subclass/Report";
import {Client} from "../../shared/subclass/Client";

let taskSettings =  (report) => {

    let createdAt = moment(report.get('createdAt')).format('DD-MM-YYYY');
    let clientName = report.get('client').get('name');

    let taskSettings = {
        settingsPointerName: '',
        taskType: '',
        subject: '',
        text: 'Rapporten er vedhæftet som PDF dokument',
        fileName: ''
    };

    let taskType = report.get('taskType');
    switch (taskType) {
        case 'Alarm': {
            taskSettings.settingsPointerName = 'regularReportSettings';
            taskSettings.taskType = "Alarm"; // TODO: translate
            break;
        }
        case 'Regular': {
            taskSettings.settingsPointerName = 'regularReportSettings';
            taskSettings.taskType = "Gående tilsyn"; // TODO: translate
            break;
        }
        case 'Raid': {
            taskSettings.settingsPointerName = 'regularReportSettings';
            taskSettings.taskType = "Kørende tilsyn"; // TODO: translate
            break;
        }
        case 'Static': {
            taskSettings.settingsPointerName = 'staticReportSettings';
            taskSettings.taskType = "Fastvagt"; // TODO: translate
            break;
        }
    }

    // TODO kept for backwards compatibility < 5.0.0 >>
    if (!taskSettings.taskType) {
        if (report.get('taskTypeName') === 'ALARM') {
            taskSettings.settingsPointerName = 'regularReportSettings';
            taskSettings.taskType = "Alarm"; // TODO: translate
        }

        if (report.get('taskTypeName') === 'RAID') {
            taskSettings.settingsPointerName = 'regularReportSettings';
            taskSettings.taskType = "Kørende tilsyn"; // TODO: translate
        }

        if (report.has('circuitStarted')) {
            taskSettings.settingsPointerName = 'regularReportSettings';
            taskSettings.taskType = "Tilsyn"; // TODO: translate
        }

        if (report.has('staticTask')) {
            taskSettings.settingsPointerName = 'staticReportSettings';
            taskSettings.taskType = "Fastvagt"; // TODO: translate
        }
    }
    // << TODO kept for backwards compatibility < 5.0.0

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

Parse.Cloud.define("sendReport",  (request, response)  => {
    sendReport(request.params.reportId).then( () => {
        response.success('Report successfully sent!')
    },  (error) => {
        response.error(error)
    })
});

export let sendReport =  (reportId) => {

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


    return ReportUtils.fetchReport(reportId).then( (report: Report) => {
        _report = report;

        let client: Client = report.client;

        let contacts = _.filter(
            client.get('contacts'),  (contact: Person) => {
                return contact.get('receiveReports')
                    && contact.get('email');
            });


        mailSetup.toNames = _.map(contacts,  (contact) => {
            return contact.get('name')
        });
        mailSetup.toEmails = _.map(contacts,  (contact) => {
            return contact.get('email')
        });


        if (!taskSettings(report).settingsPointerName) {
            throw new Error('Unable to get taskSettings');
        }

        console.log('fetching: ' + taskSettings(report).settingsPointerName);

        return report.get('owner').get(taskSettings(report).settingsPointerName).fetch({useMasterKey: true});
    }).then( (reportSettings) => {

        mailSetup.replytoName = reportSettings.get('replytoName') || '';
        mailSetup.replytoEmail = reportSettings.get('replytoEmail') || '';

        mailSetup.bccNames = reportSettings.get('bccNames') || [];
        mailSetup.bccEmails = reportSettings.get('bccEmails') || [];

        return reportToPdf.toPdf(reportId);

    }).then( (httpResponse) => {

        let reportSettings = taskSettings(_report);

        let helper = sendgrid.mail;
        let mail = new helper.Mail();

        // Tracking
        let tracking_settings = new helper.TrackingSettings();
        let click_tracking = new helper.ClickTracking(false, false);
        tracking_settings.setClickTracking(click_tracking);
        let open_tracking = new helper.OpenTracking(true, 'gs');
        tracking_settings.setOpenTracking(open_tracking);
        mail.addTrackingSettings(tracking_settings);

        let sender = new helper.Email('report@guardswift.com', 'GuardSwift');
        let replyto = new helper.Email(mailSetup.replytoEmail || 'noreply@guardswift.com');

        mail.setFrom(sender);
        mail.setReplyTo(replyto);
        mail.setSubject(reportSettings.subject);

        let content = new helper.Content("text/plain", reportSettings.text);
        mail.addContent(content);

        let personalization = new helper.Personalization();

        let receivers = [];

        // to client receivers
        _.forEach(_.zip(mailSetup.toEmails, mailSetup.toNames),  (mailTo) => {
            let mailAddress = mailTo[0];
            let mailName = mailTo[1];

            if (!_.includes(receivers, mailAddress)) {
                let to = new helper.Email(mailAddress, mailName);
                personalization.addTo(to);

                receivers.push(mailAddress);

                console.log('to', mailAddress);
            }
        });

        if (_.isEmpty(mailSetup.toEmails)) {
            // Notify the owner that this report did not reach any clients

            console.error('Report is missing receivers! ' + _report.id);

            let ownerEmail = _report.get('owner').get('email');
            let ownerName = _report.get('owner').get('username');

            mailSetup.toEmails = [ownerEmail];
            mailSetup.toNames = [ownerName];

            if (!_.includes(receivers, ownerEmail)) {

                let owner = new helper.Email(ownerEmail, ownerName);
                personalization.addTo(owner);

                receivers.push(ownerEmail);

                console.log('to owner', ownerEmail);
            }

        }

        // always send bcc to developer
        let developerMail = 'cyrixmorten@gmail.com';
        if (!_.includes(receivers, developerMail)) {
            let bccDeveloper = new helper.Email(developerMail);
            personalization.addBcc(bccDeveloper);

            receivers.push(developerMail);

            console.log('bcc developer', developerMail);
        }

        // bcc task admins
        _.forEach(_.zip(mailSetup.bccEmails, mailSetup.bccNames),  (mailBcc) => {
            let mailAddress = mailBcc[0];
            let mailName = mailBcc[1];

            if (!_.includes(receivers, mailAddress)) {
                let bcc = new helper.Email(mailAddress, mailName);
                personalization.addBcc(bcc);

                receivers.push(mailAddress);

                console.log('bcc', mailAddress);
            }
        });

        mail.addPersonalization(personalization);

        let attachment = new helper.Attachment();
        attachment.setContent(new Buffer(httpResponse.buffer).toString('base64'));
        attachment.setType('application/pdf');
        attachment.setFilename(reportSettings.fileName + '.pdf');
        attachment.setDisposition('attachment');
        mail.addAttachment(attachment);


        console.log('Sending to ', receivers);

        let sg = sendgrid(process.env.SENDGRID_API_KEY);
        let request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
        });

        return sg.API(request);

    }).then( (httpResponse) => {

        mailSetup.errors = false;
        mailSetup.status = httpResponse;

        _report.set('mailStatus', mailSetup);

        return _report.save(null, {useMasterKey: true});
    },  (error) => {

        console.error(error);

        mailSetup.errors = true;
        mailSetup.status = error;

        _report.set('mailStatus', mailSetup);

        return _report.save(null, {useMasterKey: true}).then( () => {
            return Parse.Promise.error(mailSetup);
        });

    });
};

