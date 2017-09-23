import * as _ from 'lodash';
import * as moment from 'moment-timezone-all';

import {EventLog} from "../../shared/subclass/EventLog";

export class ReportUtils {

    static fetchUser = function (report) {
        return report.get('owner').fetch({useMasterKey: true});
    };

    static fetchReport = function (reportId) {

        console.log('fetchReport ' + reportId);

        let query = new Parse.Query('Report');
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

    static getPDFUrl = function (report) {
        return report.get('pdf').url();
    };

    static hasExistingPDF = function (report) {

        let hasPdf = report.has('pdf');
        let pdfCreatedAt = report.get('pdfCreatedAt');
        let updatedAt = report.get('updatedAt');
        let pdfOutdated = pdfCreatedAt && Math.abs(moment(pdfCreatedAt).diff(moment(updatedAt), 'seconds')) > 5;

        return hasPdf && !pdfOutdated;
    };

    static readExistingPDF = function (report) {

        return Parse.Cloud.httpRequest({
            method: 'GET',
            url: ReportUtils.getPDFUrl(report),
            headers: {
                'Content-Type': 'application/pdf'
            }
        });
    };

    static deleteExistingPDF = function (report) {

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

    static generatePDF = function (docDefinition) {

        return Parse.Cloud.httpRequest({
            method: 'POST',
            url: process.env.APP_URL + '/api/pdfmake',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: docDefinition
        })
    };

    static generatePDFParseFile = function (httpResponse) {

        let file = new Parse.File("report.pdf", {
            base64: httpResponse.buffer.toString('base64', 0, httpResponse.buffer.length)
        }, 'application/pdf');

        return file.save();

    };

    /**
     * Extracts categorised event information for given report
     */
    static reportEventsMap = function (report, timeZone) {
        return ReportUtils.eventsMap(report.get('eventLogs'), timeZone);
    };


    static isAcceptEvent = function (eventLog) {
        return eventLog.get('task_event') === 'ACCEPT';
    };

    static isArrivalEvent = function (eventLog) {
        return eventLog.get('task_event') === 'ARRIVE';
    };

    static isAbortEvent = function (eventLog) {
        return eventLog.get('task_event') === 'ABORT';
    };

    static isFinishEvent = function (eventLog) {
        return eventLog.get('task_event') === 'FINISH';
    };

    static isWrittenByGuard = function (eventLog) {
        return eventLog.get('task_event') === 'OTHER';
    };

    static isAlarmEvent = function (eventLog) {
        return eventLog.get('taskTypeName') === 'ALARM';
    };

    static isReportLog = function (eventLog) {
        let isArrive = eventLog.get('task_event') === 'ARRIVE';
        let isWritten = eventLog.get('task_event') === 'OTHER';


        return isArrive || isWritten || ReportUtils.isAlarmEvent(eventLog);
    };

    static eventsMap = function (eventLogs: EventLog[], timeZone) {

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
}