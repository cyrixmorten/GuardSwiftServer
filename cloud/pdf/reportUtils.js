var _ = require('lodash');
var moment = require('moment-timezone-all');

exports.fetchUser = function (report) {
    return report.get('owner').fetch({ useMasterKey: true });
};

exports.fetchReport = function (reportId) {

    console.log('fetchReport ' + reportId);

    var query = new Parse.Query('Report');
    query.equalTo('objectId', reportId);

    query.include('owner');
    query.include('client.contacts');
    query.include('eventLogs');

    query.include('staticTask');
    query.include('circuitStarted');
    query.include('districtWatchStarted');
    
    return query.first({ useMasterKey: true });
};


exports.getPDFUrl = function (report) {
    return report.get('pdf').url();
};

exports.hasExistingPDF = function (report) {

    var hasPdf = report.has('pdf');
    var pdfCreatedAt = report.get('pdfCreatedAt');
    var updatedAt = report.get('updatedAt');
    var pdfOutdated = pdfCreatedAt && Math.abs(moment(pdfCreatedAt).diff(moment(updatedAt), 'seconds')) > 5;

    return hasPdf && !pdfOutdated;
};

exports.readExistingPDF = function (report) {
    
    return Parse.Cloud.httpRequest({
        method: 'GET',
        url: exports.getPDFUrl(report),
        headers: {
            'Content-Type': 'application/pdf'
        }
    });
};

exports.deleteExistingPDF = function (report) {

    var promise = Parse.Promise.as();

    if (report.has('pdf')) {

        promise = Parse.Cloud.run('fileDelete', {
            file: report.get('pdf')
        });
    }

    promise.fail(function (error) {
        // ignoring any errors
        console.error('Error deleting report', error);
    });

    return promise;
};


exports.generatePDF = function (docDefinition) {

    return Parse.Cloud.httpRequest({
        method: 'POST',
        url: process.env.APP_URL + '/api/pdfmake',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: docDefinition
    })
};

exports.generatePDFParseFile = function (httpResponse) {

    var file = new Parse.File("report.pdf", {
        base64: httpResponse.buffer.toString('base64', 0, httpResponse.buffer.length)
    }, 'application/pdf');

    return file.save(null, {useMasterKey: true})

};

/**
 * Extracts categorised event information for given report
 */
exports.reportEventsMap = function (report, timeZone) {
    return exports.eventsMap(report.get('eventLogs'), timeZone);
};

exports.eventsMap = function (eventLogs, timeZone) {

    var reportEventLogs = _.filter(eventLogs, function (eventLog) {
        return eventLog.get('task_event') === 'ARRIVE' || eventLog.get('task_event') === 'OTHER';
    });

    var arrivedEvents = _.filter(reportEventLogs, function (eventLog) {
        return eventLog.get('task_event') === 'ARRIVE';
    });

    var writtenByGuard = _.filter(reportEventLogs, function (eventLog) {
        return eventLog.get('task_event') === 'OTHER';
    });

    return {
        // all: reportEventLogs,
        //
        writtenByGuard: writtenByGuard,
        //
        // arrivedEvents: arrivedEvents,

        arrivedTimestamps: _.map(arrivedEvents, function (log) {
            return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
        }),

        arrivedGuardNames: _.map(arrivedEvents, function (log) {
            return log.get('guardName') || '';
        }),

        arrivedClientNames: _.map(arrivedEvents, function (log) {
            return log.get('clientName') || '';
        }),
        arrivedClientAddress: _.map(arrivedEvents, function (log) {
            return log.has('clientAddress') ? log.get('clientAddress') + ' ' + log.get('clientAddressNumber') : '';
        }),


        timestamps: _.map(reportEventLogs, function (log) {
            return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
        }),

        eventName: _.map(reportEventLogs, function (log) {
            return log.get('event') || '';
        }),

        amount: _.map(reportEventLogs, function (log) {
            return (log.has('amount') && log.get('amount') !== 0) ? log.get('amount').toString() : '';
        }),

        people: _.map(reportEventLogs, function (log) {
            return log.get('people') || '';
        }),

        location: _.map(reportEventLogs, function (log) {
            return log.get('clientLocation') || '';
        }),

        remarks: _.map(reportEventLogs, function (log) {
            return log.get('remarks') || '';
        })


    };
};