var moment = require('moment');
var _ = require('lodash');

var reportUtils = require('./reportUtils');
var reportToPdf = require('./reportToPDF');

var taskSettings = function(report) {

    var createdAt = moment(report.get('createdAt')).format('DD-MM-YYYY');
    var clientName = report.get('client').get('name');

    var taskSettings = {
        settingsPointerName: '',
        taskType: '',
        subject: '',
        text: 'Rapporten er vedhæftet som PDF dokument',
        fileName: ''
    };

    if (report.has('circuitStarted')) {
        taskSettings.settingsPointerName = 'regularReportSettings';
        taskSettings.taskType = "Tilsyn";
        taskSettings.subject = clientName + ' - ' + taskSettings.taskType + ' ' + createdAt;
        taskSettings.fileName = clientName + '-' + taskSettings.taskType + '-' + createdAt;
    }

    if (report.has('staticTask')) {
        taskSettings.settingsPointerName = 'staticReportSettings';
        taskSettings.taskType = "Fastvagt";
        taskSettings.subject = clientName + ' - ' + taskSettings.taskType + ' ' + createdAt;
        taskSettings.fileName = clientName + '-' + taskSettings.taskType + '-' + createdAt;
    }

    if (report.has('districtWatchStarted')) {
        var districtName = report.get('districtWatchStarted').get('name');
        
        taskSettings.settingsPointerName = 'districtReportSettings';
        taskSettings.taskType = "Områdevagt";
        taskSettings.subject = districtName + ' - ' + taskSettings.taskType + ' ' + createdAt;
        taskSettings.fileName = districtName + '-' + taskSettings.taskType + '-' + createdAt;
    }
    


    return taskSettings;
};

Parse.Cloud.define("sendReport", function (request, response) {

    if (!request.params.reportId) {
        response.error('missing reportId');
        return;
    }

    var _report = {};

    var mailSetup = {
        replytoName: '',
        replytoEmail: '',

        bccNames: [],
        bccEmails: [],

        toNames: [],
        toEmails: [],

        status: {},
        errors: false
    };


    reportUtils.fetchReport(request.params.reportId).then(function (report) {
        _report = report;

        var contacts = _.filter(
            report.get('client').get('contacts'), function (contact) {
                return contact.get('receiveReports')
                    && contact.get('email');
            });


        mailSetup.toNames = _.map(contacts, function (contact) {
            return contact.get('name')
        });
        mailSetup.toEmails = _.map(contacts, function (contact) {
            return contact.get('email')
        });


        if (!taskSettings(report).settingsPointerName) {
            response.error('Unable to get taskSettings');
            return;
        }

        console.log('fetching: ' + taskSettings(report).settingsPointerName);

        return report.get('owner').get(taskSettings(report).settingsPointerName).fetch({ useMasterKey: true });
    }).then(function(reportSettings) {

        mailSetup.replytoName = reportSettings.get('replytoName') || '';
        mailSetup.replytoEmail = reportSettings.get('replytoEmail') || '';

        mailSetup.bccNames = reportSettings.get('bccNames') || [];
        mailSetup.bccEmails = reportSettings.get('bccEmails') || [];

        return reportToPdf.toPdf(request.params.reportId);

    }).then(function (result) {

        var reportSettings = taskSettings(_report);

        var helper = require('sendgrid').mail;
        var mail = new helper.Mail();

        // Tracking
        var tracking_settings = new helper.TrackingSettings();
        var click_tracking = new helper.ClickTracking(false, false);
        tracking_settings.setClickTracking(click_tracking);
        var open_tracking = new helper.OpenTracking(true);
        tracking_settings.setOpenTracking(open_tracking);
        mail.addTrackingSettings(tracking_settings);

        var sender = new helper.Email('report@guardswift.com', 'GuardSwift');
        var replyto = new helper.Email(mailSetup.replytoEmail || 'noreply@guardswift.com');

        mail.setFrom(sender);
        mail.setReplyTo(replyto);
        mail.setSubject(reportSettings.subject);

        var content = new helper.Content("text/plain", reportSettings.text);
        mail.addContent(content);

        var personalization = new helper.Personalization();

        var receivers = [];
        
        // to client receivers
        _.forEach(_.zip(mailSetup.toEmails, mailSetup.toNames), function(mailTo) {
            var mailAddress = mailTo[0];
            var mailName = mailTo[1];

            if (!_.includes(receivers, mailAddress)) {
                var to = new helper.Email(mailAddress, mailName);
                personalization.addTo(to);

                receivers.push(mailAddress);

                console.log('to', mailAddress);
            }
        });

        if (_.isEmpty(mailSetup.toEmails)) {
            // Notify the owner that this report did not reach any clients

            console.error('Report is missing receivers! ' + _report.id);

            var ownerEmail = _report.get('owner').get('email');
            var ownerName = _report.get('owner').get('username');

            mailSetup.toEmails = [ownerEmail];
            mailSetup.toNames = [ownerName];

            if (!_.includes(receivers, ownerEmail)) {

                var owner = new helper.Email(ownerEmail, ownerName);
                personalization.addTo(owner);

                receivers.push(ownerEmail);

                console.log('to owner', ownerEmail);
            }

        }

        // always send bcc to developer
        var developerMail = 'cyrixmorten@gmail.com';
        if (!_.includes(receivers, developerMail)) {
            var bccDeveloper = new helper.Email(developerMail);
            personalization.addBcc(bccDeveloper);

            receivers.push(developerMail);

            console.log('bcc developer', developerMail);
        }

        // bcc task admins
        _.forEach(_.zip(mailSetup.bccEmails, mailSetup.bccNames), function(mailBcc) {
            var mailAddress = mailBcc[0];
            var mailName = mailBcc[1];

            if (!_.includes(receivers, mailAddress)) {
                var bcc = new helper.Email(mailAddress, mailName);
                personalization.addBcc(bcc);

                receivers.push(mailAddress);

                console.log('bcc', mailAddress);
            }
        });

        mail.addPersonalization(personalization);

        var attachment = new helper.Attachment();
        attachment.setContent(new Buffer(result.httpResponse.buffer).toString('base64'));
        attachment.setType('application/pdf');
        attachment.setFilename(reportSettings.fileName + '.pdf');
        attachment.setDisposition('attachment');
        mail.addAttachment(attachment);



        console.log('Sending to ', receivers);

        var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
        });

        var sendPromise = new Parse.Promise();

        sg.API(request, function(err, response) {
            if (err) {
                return sendPromise.reject(err);
            } 
            
            return sendPromise.resolve(response);
        });

        return sendPromise;

    }).then(function (httpResponse) {

        mailSetup.errors = false;
        mailSetup.status = httpResponse;

        _report.set('mailStatus', mailSetup);

        return _report.save(null, { useMasterKey: true });
    }).then(function () {

        response.success('Mail successfully sent');

    }).fail(function (error) {

        console.error(error);

        mailSetup.errors = true;
        mailSetup.status = error;

        _report.set('mailStatus', mailSetup);

        _report.save(null, { useMasterKey: true }).always(function() {
            response.error(mailSetup);
        });

    });


});

