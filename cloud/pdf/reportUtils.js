"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moment = require("moment-timezone-all");
class ReportUtils {
}
ReportUtils.fetchUser = function (report) {
    return report.get('owner').fetch({ useMasterKey: true });
};
ReportUtils.fetchReport = function (reportId) {
    console.log('fetchReport ' + reportId);
    let query = new Parse.Query('Report');
    query.equalTo('objectId', reportId);
    query.include('owner');
    query.include('client.contacts');
    query.include('eventLogs');
    query.include('staticTask'); // Static
    query.include('circuitUnit'); // Regular
    query.include('task'); // Alarms
    query.include('circuitStarted');
    query.include('districtWatchStarted'); // to be removed
    return query.first({ useMasterKey: true });
};
ReportUtils.getPDFUrl = function (report) {
    return report.get('pdf').url();
};
ReportUtils.hasExistingPDF = function (report) {
    let hasPdf = report.has('pdf');
    let pdfCreatedAt = report.get('pdfCreatedAt');
    let updatedAt = report.get('updatedAt');
    let pdfOutdated = pdfCreatedAt && Math.abs(moment(pdfCreatedAt).diff(moment(updatedAt), 'seconds')) > 5;
    return hasPdf && !pdfOutdated;
};
ReportUtils.readExistingPDF = function (report) {
    return Parse.Cloud.httpRequest({
        method: 'GET',
        url: ReportUtils.getPDFUrl(report),
        headers: {
            'Content-Type': 'application/pdf'
        }
    });
};
ReportUtils.deleteExistingPDF = function (report) {
    let promise = Parse.Promise.as('');
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
ReportUtils.generatePDF = function (docDefinition) {
    return Parse.Cloud.httpRequest({
        method: 'POST',
        url: process.env.APP_URL + '/api/pdfmake',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: docDefinition
    });
};
ReportUtils.generatePDFParseFile = function (httpResponse) {
    let file = new Parse.File("report.pdf", {
        base64: httpResponse.buffer.toString('base64', 0, httpResponse.buffer.length)
    }, 'application/pdf');
    return file.save();
};
/**
 * Extracts categorised event information for given report
 */
ReportUtils.reportEventsMap = function (report, timeZone) {
    return ReportUtils.eventsMap(report.get('eventLogs'), timeZone);
};
ReportUtils.isAcceptEvent = function (eventLog) {
    return eventLog.get('task_event') === 'ACCEPT';
};
ReportUtils.isArrivalEvent = function (eventLog) {
    return eventLog.get('task_event') === 'ARRIVE';
};
ReportUtils.isAbortEvent = function (eventLog) {
    return eventLog.get('task_event') === 'ABORT';
};
ReportUtils.isFinishEvent = function (eventLog) {
    return eventLog.get('task_event') === 'FINISH';
};
ReportUtils.isWrittenByGuard = function (eventLog) {
    return eventLog.get('task_event') === 'OTHER';
};
ReportUtils.isAlarmEvent = function (eventLog) {
    return eventLog.get('taskTypeName') === 'ALARM';
};
ReportUtils.isReportLog = function (eventLog) {
    let isArrive = eventLog.get('task_event') === 'ARRIVE';
    let isWritten = eventLog.get('task_event') === 'OTHER';
    return isArrive || isWritten || ReportUtils.isAlarmEvent(eventLog);
};
ReportUtils.eventsMap = function (eventLogs, timeZone) {
    let numberOfArrivals = _.filter(eventLogs, ReportUtils.isArrivalEvent).length;
    eventLogs = _.sortBy(eventLogs, function (log) {
        let date = log.get('deviceTimestamp');
        if (!ReportUtils.isAlarmEvent(log) && ReportUtils.isArrivalEvent(log) && numberOfArrivals === 1) {
            return Number.MIN_VALUE;
        }
        return date;
    });
    return {
        all: eventLogs,
        writtenByGuard: _.map(eventLogs, function (log) {
            if (ReportUtils.isWrittenByGuard(log)) {
                return log;
            }
        }),
        //
        // arrivedEvents: arrivedEvents,
        taskEvents: _.map(eventLogs, function (log) {
            return log.get('task_event');
        }),
        eventTimestamps: _.map(eventLogs, function (log) {
            let isAlarmEvent = ReportUtils.isAlarmEvent(log) && (ReportUtils.isAcceptEvent(log) || ReportUtils.isAbortEvent(log) || ReportUtils.isFinishEvent(log));
            if (ReportUtils.isArrivalEvent(log) || isAlarmEvent) {
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
            if (ReportUtils.isReportLog(log)) {
                return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
            }
        }),
        eventName: _.map(eventLogs, function (log) {
            if (ReportUtils.isReportLog(log)) {
                return log.get('event') || '';
            }
        }),
        amount: _.map(eventLogs, function (log) {
            if (ReportUtils.isReportLog(log)) {
                return (log.has('amount') && log.get('amount') !== 0) ? log.get('amount').toString() : '';
            }
        }),
        people: _.map(eventLogs, function (log) {
            if (ReportUtils.isReportLog(log)) {
                return log.get('people') || '';
            }
        }),
        location: _.map(eventLogs, function (log) {
            if (ReportUtils.isReportLog(log)) {
                return log.get('clientLocation') || '';
            }
        }),
        remarks: _.map(eventLogs, function (log) {
            if (ReportUtils.isReportLog(log)) {
                return log.get('remarks') || '';
            }
        })
    };
};
exports.ReportUtils = ReportUtils;
//# sourceMappingURL=reportUtils.js.map