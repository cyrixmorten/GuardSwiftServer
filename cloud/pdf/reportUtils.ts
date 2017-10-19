import * as _ from 'lodash';
import * as moment from 'moment-timezone-all';

import {EventLog} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import IPromise = Parse.IPromise;

export class ReportUtils {

    static fetchUser = (report) => {
        return report.get('owner').fetch({useMasterKey: true});
    };

    static fetchReport = (reportId: string): IPromise<Report> => {

        console.log('fetchReport ' + reportId);

        let query = new ReportQuery().matchingId(reportId).build();

        query.include('owner');
        query.include('client.contacts');
        query.include('eventLogs');


        query.include('staticTask');    // Static
        query.include('circuitUnit');   // Regular
        query.include('task');          // Alarms

        query.include('circuitStarted');
        query.include('districtWatchStarted'); // to be removed

        return query.first({useMasterKey: true}).then((report) => {
            if (!report) {
                throw new Error(`Report with objectId ${reportId} not found!`);
            }

            return report;
        });
    };

    static getPDFUrl = (report: Report) => {
        return report.get('pdf').url();
    };

    static hasExistingPDF = (report: Report) => {

        let hasPdf = report.has('pdf');
        let pdfCreatedAt = report.get('pdfCreatedAt');
        let updatedAt = report.get('updatedAt');
        let pdfOutdated = pdfCreatedAt && Math.abs(moment(pdfCreatedAt).diff(moment(updatedAt), 'seconds')) > 5;

        return hasPdf && !pdfOutdated;
    };

    static readExistingPDF = (report: Report) => {

        return Parse.Cloud.httpRequest({
            method: 'GET',
            url: ReportUtils.getPDFUrl(report),
            headers: {
                'Content-Type': 'application/pdf'
            }
        });
    };

    static deleteExistingPDF = (report: Report) => {

        let promise = Parse.Promise.as('');

        if (report.has('pdf')) {

            promise = Parse.Cloud.run('fileDelete', {
                file: report.get('pdf')
            });
        }

        promise.fail((error) => {
            // ignoring any errors
            console.error('Error deleting report', error);
        });

        return promise;
    };

    static generatePDF = (docDefinition) => {

        return Parse.Cloud.httpRequest({
            method: 'POST',
            url: process.env.APP_URL + '/api/pdfmake',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: docDefinition
        })
    };

    static generatePDFParseFile = (httpResponse) => {

        let file = new Parse.File("report.pdf", {
            base64: httpResponse.buffer.toString('base64', 0, httpResponse.buffer.length)
        }, 'application/pdf');

        return file.save();

    };

    /**
     * Extracts categorised event information for given report
     */
    static reportEventsMap = (report, timeZone) => {
        return ReportUtils.eventsMap(report.get('eventLogs'), timeZone);
    };


    static isAcceptEvent = (eventLog) => {
        return eventLog.get('task_event') === 'ACCEPT';
    };

    static isArrivalEvent = (eventLog) => {
        return eventLog.get('task_event') === 'ARRIVE';
    };

    static isAbortEvent = (eventLog) => {
        return eventLog.get('task_event') === 'ABORT';
    };

    static isFinishEvent = (eventLog) => {
        return eventLog.get('task_event') === 'FINISH';
    };

    static isWrittenByGuard = (eventLog) => {
        return eventLog.get('task_event') === 'OTHER';
    };

    static isAlarmEvent = (eventLog) => {
        return eventLog.get('taskTypeName') === 'ALARM';
    };

    static isReportLog = (eventLog) => {
        let isArrive = eventLog.get('task_event') === 'ARRIVE';
        let isWritten = eventLog.get('task_event') === 'OTHER';


        return isArrive || isWritten || ReportUtils.isAlarmEvent(eventLog);
    };

    static eventsMap = (eventLogs: EventLog[], timeZone) => {

        let numberOfArrivals = _.filter(eventLogs, ReportUtils.isArrivalEvent).length;

        eventLogs = _.sortBy(eventLogs, (log) => {
            let date = log.get('deviceTimestamp');

            if (!ReportUtils.isAlarmEvent(log) && ReportUtils.isArrivalEvent(log) && numberOfArrivals === 1) {
                return Number.MIN_VALUE;
            }

            return date;
        });


        return {
            all: eventLogs,
            writtenByGuard: _.map(eventLogs, (log) => {
                if (ReportUtils.isWrittenByGuard(log)) {
                    return log;
                }
            }),
            //
            // arrivedEvents: arrivedEvents,

            taskEvents: _.map(eventLogs, (log) => {
                return log.get('task_event');
            }),

            eventTimestamps: _.map(eventLogs, (log) => {
                let isAlarmEvent = ReportUtils.isAlarmEvent(log) && (ReportUtils.isAcceptEvent(log) || ReportUtils.isAbortEvent(log) || ReportUtils.isFinishEvent(log));
                if (ReportUtils.isArrivalEvent(log) || isAlarmEvent) {
                    return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
                }
            }),

            // arrivedGuardNames: _.map(arrivedEvents,  (log) {
            //     return log.get('guardName') || '';
            // }),
            //
            // arrivedClientNames: _.map(arrivedEvents,  (log) {
            //     return log.get('clientName') || '';
            // }),
            // arrivedClientAddress: _.map(arrivedEvents,  (log) {
            //     return log.has('clientAddress') ? log.get('clientAddress') + ' ' + log.get('clientAddressNumber') : '';
            // }),


            timestamps: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return moment(log.get('deviceTimestamp')).tz(timeZone).format('HH:mm');
                }
            }),


            eventName: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get('event') || '';
                }
            }),

            amount: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return (log.has('amount') && log.get('amount') !== 0) ? log.get('amount').toString() : '';
                }
            }),

            people: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get('people') || '';
                }
            }),

            location: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get('clientLocation') || '';
                }
            }),

            remarks: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get('remarks') || '';
                }
            }),

            guardInitials: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    let guardName = log.get('guardName') || '';
                    if (_.isEmpty(guardName)) {
                        return guardName;
                    }

                    // usually first and last name
                    let nameElements = _.compact(guardName.split(/[ ,]+/));

                    // pick the first letter in each name element
                    return _.join(_.map(nameElements, _.first), '');

                }
            })

        }
    };
}