import * as _ from 'lodash';
import * as moment from 'moment-timezone-all';

import {EventLog, TaskEvent} from "../../shared/subclass/EventLog";
import {Report, ReportQuery} from "../../shared/subclass/Report";
import IPromise = Parse.IPromise;
import {TaskStatus, TaskType} from "../../shared/subclass/Task";
import HttpResponse = Parse.Cloud.HttpResponse;

//     all: eventLogs,
//     writtenByGuard: _.map(eventLogs, (eventLog: EventLog) => {
//     tasks: _.map(eventLogs, (eventLog: EventLog) => {
//     taskEvents: _.map(eventLogs, (eventLog: EventLog) => {
//     reportedTimestamps: _.map(eventLogs, (eventLog: EventLog) => {
//     timestamps: _.map(eventLogs, (eventLog: EventLog) => {
//     eventName: _.map(eventLogs, (eventLog: EventLog) => {
//     amount: _.map(eventLogs, (eventLog: EventLog) => {
//     people: _.map(eventLogs, (eventLog: EventLog) => {
//     location: _.map(eventLogs, (eventLog: EventLog) => {
//     remarks: _.map(eventLogs, (eventLog: EventLog) => {
//     guardInitials: _.map(eventLogs, (eventLog: EventLog) => {
//
// interface IReportEvent {
//     event: EventLog,
//     isWrittenByGuard: boolean,
//     timestampString: string,
// }

export class ReportUtils {

    static fetchUser = (report) => {
        return report.get('owner').fetch({useMasterKey: true});
    };

    /**
     * @param {string} reportId objectId of report
     * @returns {Parse.IPromise<Report>}
     */
    static fetchReport = (reportId: string): IPromise<Report> => {

        let query = new ReportQuery().matchingId(reportId).build();

        query.include(Report._eventLogs);
        query.include(Report._tasks);

        return query.first({useMasterKey: true}).then((report) => {
            if (!report) {
                throw new Error(`Report with objectId ${reportId} not found!`);
            }

            return report;
        });
    };

    static generatePDF = async (docDefinition): Promise<HttpResponse> => {

        return Parse.Cloud.httpRequest({
            method: 'POST',
            url: process.env.APP_URL + '/api/pdfmake',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: docDefinition
        })
    };




    static isReportLog = (eventLog: EventLog) => {
        let isArrive = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);
        let isWritten = eventLog.matchingTaskEvent(TaskEvent.OTHER);


        return isArrive || isWritten || eventLog.matchingTaskType(TaskType.ALARM);
    };

    static eventsMap = (eventLogs: EventLog[], timeZone) => {

        let numberOfArrivals = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE)).length;

        eventLogs = _.sortBy(eventLogs, (eventLog: EventLog) => {

            if (!eventLog.matchingTaskType(TaskType.ALARM) && eventLog.matchingTaskEvent(TaskEvent.ARRIVE) && numberOfArrivals === 1) {
                return Number.MIN_VALUE;
            }

            return eventLog.deviceTimestamp;
        });


        return {
            all: eventLogs,

            writtenByGuard: _.map(eventLogs, (eventLog: EventLog) => {
                if (eventLog.matchingTaskEvent(TaskEvent.OTHER)) {
                    return eventLog;
                }
            }),

            tasks: _.map(eventLogs, (eventLog: EventLog) => {
                return eventLog.task;
            }),

            taskEvents: _.map(eventLogs, (eventLog: EventLog) => {
                return eventLog.taskEvent;
            }),

            eventTimestamps: _.map(eventLogs, (eventLog: EventLog) => {

                let isAlarmEvent = eventLog.matchingTaskType(TaskType.ALARM) && eventLog.matchingTaskEvent(TaskEvent.ACCEPT, TaskEvent.ABORT, TaskEvent.FINISH);
                let isArriveEvent = eventLog.matchingTaskEvent(TaskEvent.ARRIVE);

                if (isArriveEvent || isAlarmEvent) {
                    return moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm');
                }
            }),


            timestamps: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog)) {
                    return moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm');
                }
            }),


            eventName: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog)) {
                    return eventLog.event || '';
                }
            }),

            amount: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog)) {
                    return (eventLog.amount) ? eventLog.amount.toString() : '';
                }
            }),

            people: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog)) {
                    return eventLog.people || '';
                }
            }),

            location: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog)) {
                    return eventLog.clientLocation || '';
                }
            }),

            remarks: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog)) {
                    return eventLog.remarks || '';
                }
            }),

            guardInitials: _.map(eventLogs, (eventLog: EventLog) => {
                if (ReportUtils.isReportLog(eventLog) && eventLog.guardName) {
                    let guardName = eventLog.guardName;

                    // usually first and last name
                    let nameElements = _.compact(guardName.split(/[ ,]+/));

                    // pick the first letter in each name element
                    return _.join(_.map(nameElements, _.first), '');

                }

                return '';
            })

        }
    };

    // static reportEventsArray = (eventLogs: EventLog[], timeZone) => {
    //
    //     let numberOfArrivals = _.filter(eventLogs, (eventLog) => eventLog.matchingTaskEvent(TaskEvent.ARRIVE)).length;
    //
    //     let sortedEventLogs = _.sortBy(eventLogs, (eventLog: EventLog) => {
    //
    //         if (!eventLog.matchingTaskType(TaskType.ALARM) && eventLog.matchingTaskEvent(TaskEvent.ARRIVE) && numberOfArrivals === 1) {
    //             return Number.MIN_VALUE;
    //         }
    //
    //         return eventLog.deviceTimestamp;
    //     });
    //
    //     return _.map(sortedEventLogs, (eventLog: EventLog) => {
    //
    //     })
    //
    //
    // };
}