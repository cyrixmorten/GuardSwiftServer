import * as _ from 'lodash';
import * as moment from 'moment-timezone-all';

import {EventLog} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import IPromise = Parse.IPromise;
import {TaskStatus} from "../../shared/subclass/Task";

export class ReportUtils {

    static fetchUser = (report) => {
        return report.get('owner').fetch({useMasterKey: true});
    };

    /**
     * @param {string} reportId can either be objectId or reportId
     * @returns {Parse.IPromise<Report>}
     */
    static fetchReport = (reportId: string): IPromise<Report> => {

        console.log('fetchReport ' + reportId);

        let queryObjectId = new ReportQuery().matchingId(reportId).build();
        let queryReportId = new ReportQuery().matchingReportId(reportId).build();

        let query = Parse.Query.or(queryObjectId, queryReportId);

        query.include('owner');
        query.include('client.contacts');
        query.include('eventLogs');
        query.include('task');

        return query.first({useMasterKey: true}).then((report) => {
            if (!report) {
                throw new Error(`Report with objectId ${reportId} not found!`);
            }

            return report;
        });
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


    /**
     * Extracts categorised event information for given report
     */
    static reportEventsMap = (report: Report, timeZone) => {
        return ReportUtils.eventsMap(report.eventLogs, timeZone);
    };


    static isAcceptEvent = (eventLog) => {
        return eventLog.get(EventLog._taskEvent) === 'ACCEPT';
    };

    static isArrivalEvent = (eventLog) => {
        return eventLog.get(EventLog._taskEvent) === 'ARRIVE';
    };

    static isAbortEvent = (eventLog) => {
        return eventLog.get(EventLog._taskEvent) === 'ABORT';
    };

    static isFinishEvent = (eventLog) => {
        return eventLog.get(EventLog._taskEvent) === 'FINISH';
    };

    static isWrittenByGuard = (eventLog) => {
        return eventLog.get(EventLog._taskEvent) === 'OTHER';
    };

    static isAlarmEvent = (eventLog) => {
        return eventLog.get(EventLog._taskTypeName) === 'ALARM';
    };

    static isReportLog = (eventLog) => {
        let isArrive = eventLog.get(EventLog._taskEvent) === 'ARRIVE';
        let isWritten = eventLog.get(EventLog._taskEvent) === 'OTHER';


        return isArrive || isWritten || ReportUtils.isAlarmEvent(eventLog);
    };

    static eventsMap = (eventLogs: EventLog[], timeZone) => {

        let numberOfArrivals = _.filter(eventLogs, ReportUtils.isArrivalEvent).length;

        eventLogs = _.sortBy(eventLogs, (log) => {
            let date = log.get(EventLog._deviceTimeStamp);

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

            taskEvents: _.map(eventLogs, (log) => {
                return log.get(EventLog._taskEvent);
            }),

            eventTimestamps: _.map(eventLogs, (log) => {
                let isAlarmEvent = ReportUtils.isAlarmEvent(log) && (ReportUtils.isAcceptEvent(log) || ReportUtils.isAbortEvent(log) || ReportUtils.isFinishEvent(log));
                if (ReportUtils.isArrivalEvent(log) || isAlarmEvent) {
                    return moment(log.get(EventLog._deviceTimeStamp)).tz(timeZone).format('HH:mm');
                }
            }),


            timestamps: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return moment(log.get(EventLog._deviceTimeStamp)).tz(timeZone).format('HH:mm');
                }
            }),


            eventName: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get(EventLog._event) || '';
                }
            }),

            amount: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return (log.has(EventLog._amount) && log.get(EventLog._amount) !== 0) ? log.get(EventLog._amount).toString() : '';
                }
            }),

            people: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get(EventLog._people) || '';
                }
            }),

            location: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get(EventLog._clientLocation) || '';
                }
            }),

            remarks: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    return log.get(EventLog._remarks) || '';
                }
            }),

            guardInitials: _.map(eventLogs, (log) => {
                if (ReportUtils.isReportLog(log)) {
                    let guardName = log.get(EventLog._guardName) || '';
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