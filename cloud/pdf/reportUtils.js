var _ = require('lodash');
var moment = require('moment-timezone-all');

exports.fetchUser = function (report) {
    return report.get('owner').fetch({useMasterKey: true});
};

exports.fetchReport = function (reportId) {

    console.log('fetchReport ' + reportId);

    var query = new Parse.Query('Report');
    query.equalTo('objectId', reportId);

    query.include('owner');
    query.include('client.contacts');
    query.include('eventLogs');


    query.include('staticTask');    // Static
    query.include('circuitUnit');   // Regular
    query.include('task');          // Alarms

    query.include('circuitStarted');
    query.include('districtWatchStarted'); // to be removed

    return query.first({useMasterKey: true});
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

exports.isAcceptEvent = function (eventLog) {
    return eventLog.get('task_event') === 'ACCEPT';
};

exports.isArrivalEvent = function (eventLog) {
    return eventLog.get('task_event') === 'ARRIVE';
};

exports.isAbortEvent = function (eventLog) {
    return eventLog.get('task_event') === 'ABORT';
};

exports.isFinishEvent = function (eventLog) {
    return eventLog.get('task_event') === 'FINISH';
};

exports.isWrittenByGuard = function (eventLog) {
    return eventLog.get('task_event') === 'OTHER';
};

exports.isAlarmEvent = function (eventLog) {
    return eventLog.get('taskTypeName') === 'ALARM';
};

exports.isReportLog = function (eventLog) {
    var isArrive = eventLog.get('task_event') === 'ARRIVE';
    var isWritten = eventLog.get('task_event') === 'OTHER';


    return isArrive || isWritten || exports.isAlarmEvent(eventLog);
};

exports.eventsMap = function (eventLogs, timeZone) {

    var numberOfArrivals = _.filter(eventLogs, exports.isArrivalEvent).length;

    eventLogs = _.sortBy(eventLogs, function (log) {
        var date = log.get('deviceTimestamp');

        if (!exports.isAlarmEvent(log) && exports.isArrivalEvent(log) && numberOfArrivals === 1) {
            return Number.MIN_VALUE;
        }

        return date;
    });



    return {
        all: eventLogs,
        writtenByGuard: _.map(eventLogs, function (log) {
            if (exports.isWrittenByGuard(log)) {
                return log;
            }
        }),
        //
        // arrivedEvents: arrivedEvents,

        taskEvents: _.map(eventLogs, function(log) {
           return log.get('task_event');
        }),

        eventTimestamps: _.map(eventLogs, function (log) {
            var isAlarmEvent = exports.isAlarmEvent(log) && (exports.isAcceptEvent(log) || exports.isAbortEvent(log)  ||  exports.isFinishEvent(log))
            if (exports.isArrivalEvent(log) || isAlarmEvent) {
                return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
            }
        }),

        // arrivedGuardNames: _.map(arrivedEvents, function (log) {
        //     return log.get('guardName') || '';
        // }),
        //
        // arrivedClientNames: _.map(arrivedEvents, function (log) {
        //     return log.get('clientName') || '';
        // }),
        // arrivedClientAddress: _.map(arrivedEvents, function (log) {
        //     return log.has('clientAddress') ? log.get('clientAddress') + ' ' + log.get('clientAddressNumber') : '';
        // }),


        timestamps: _.map(eventLogs, function (log) {
            if (exports.isReportLog(log)) {
                return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
            }
        }),


        eventName: _.map(eventLogs, function (log) {
            if (exports.isReportLog(log)) {
                return log.get('event') || '';
            }
        }),

        amount: _.map(eventLogs, function (log) {
            if (exports.isReportLog(log)) {
                return (log.has('amount') && log.get('amount') !== 0) ? log.get('amount').toString() : '';
            }
        }),

        people: _.map(eventLogs, function (log) {
            if (exports.isReportLog(log)) {
                return log.get('people') || '';
            }
        }),

        location: _.map(eventLogs, function (log) {
            if (exports.isReportLog(log)) {
                return log.get('clientLocation') || '';
            }
        }),

        remarks: _.map(eventLogs, function (log) {
            if (exports.isReportLog(log)) {
                return log.get('remarks') || '';
            }
        })


    };
};