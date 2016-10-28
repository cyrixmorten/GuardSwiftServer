var moment = require('moment');
var _ = require('lodash');

var Mailer = require("../lib/sendgrid-mailer.js");
var mailer = new Mailer("cyrixmorten", "spinK27N2");

var reportUtils = require('./reportUtils.js');

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
    Parse.Cloud.useMasterKey();

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

    reportUtils.fetcReport(request.params.reportId).then(function (report) {
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

        return report.get('owner').get(taskSettings(report).settingsPointerName).fetch();
    }).then(function(reportSettings) {

        mailSetup.replytoName = reportSettings.get('replytoName') || '';
        mailSetup.replytoEmail = reportSettings.get('replytoEmail') || '';

        mailSetup.bccNames = reportSettings.get('bccNames') || [];
        mailSetup.bccEmails = reportSettings.get('bccEmails') || [];

        return Parse.Cloud.run('reportToPDF', {
            reportId: request.params.reportId
        })

    }).then(function (result) {

        console.log(JSON.stringify(result));

        var mail = mailer.mail()
            .property('from', 'report@guardswift.com')
            .property('fromname', 'GuardSwift')

            .property('replyto', mailSetup.replytoEmail || 'noreply@guardswift.com');

        _.each(mailSetup.toNames, function (toName) {
            _report.addUnique('toName', toName);
            mail.property('toname[]', toName)
        });

        _.each(mailSetup.toEmails, function (toEmail) {
            _report.addUnique('to', toEmail);
            mail.property('to[]', toEmail)
        });

        _.each(mailSetup.bccNames, function (bccName) {
            _report.addUnique('bccNames', bccName);
            mail.property('bccname[]', bccName)
        });

        _.each(mailSetup.bccEmails, function (bccEmail) {
            _report.addUnique('bcc', bccEmail);
            mail.property('bcc[]', bccEmail)
        });

        // always send bcc to me
        mail.property('bcc[]', 'cyrixmorten@gmail.com');


        var reportSettings = taskSettings(_report);

        console.log('isempty: ' + _.isEmpty(mailSetup.toEmails));

        if (_.isEmpty(mailSetup.toEmails)) {

            console.error('Report is missing receivers! ' + _report.id);

            mailSetup.toNames = [_report.get('owner').get('username')];
            mailSetup.toEmails = [_report.get('owner').get('email')];

            mail.property('toname[]', mailSetup.toNames[0]);
            mail.property('to[]', mailSetup.toEmails[0]);

        }

        mail.property('subject', reportSettings.subject);
        mail.property('text', reportSettings.text);


        return mail
            .attach(reportSettings.fileName + '.pdf', 'application/pdf', new Buffer(result.httpResponse.buffer))
            .send()

    }).then(function (httpResponse) {

        mailSetup.errors = false;
        mailSetup.status = httpResponse;

        _report.set('mailStatus', mailSetup);

        return _report.save();
    }).then(function () {

        response.success('Mail sent');

    }).fail(function (error) {

        console.error(error);

        mailSetup.errors = true;
        mailSetup.status = error;

        _report.set('mailStatus', mailSetup);

        _report.save().always(function() {
            response.error(mailSetup);
        });

    });


});

