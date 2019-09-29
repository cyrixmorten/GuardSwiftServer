import { EventLogQuery, TaskEvent } from '../../shared/subclass/EventLog';
import { ManualAutomaticArrivalStatistics } from './manual.automatic.arrival.statistics';
import * as _ from 'lodash';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import * as moment from 'moment';
import { Client } from '../../shared/subclass/Client';
import { IDailyArrivalAutomationStatistics } from '../../shared/statistics/arrival.statistics.types';

export class DailyArrivalAutomationStatistics {

    constructor(
            private fromDate: Date, 
            private toDate: Date,
            private clientId?: string,
            private taskId?: string,
        ) {}


    public async generate(): Promise<IDailyArrivalAutomationStatistics[]> {

        const arrivalEventLogs = await new EventLogQuery()
                        .matchingTaskEvent(TaskEvent.ARRIVE)
                        .matchingClient(
                            Client.createWithoutData(this.clientId)
                        )
                        .matchingTask(this.taskId)
                        .createdAfter(this.fromDate)
                        .createdBefore(this.toDate)
                        .build()
                        .limit(Number.MAX_SAFE_INTEGER)
                        .find({useMasterKey: true});

        const taskTypes = _.uniq(_.map(arrivalEventLogs, (event) => event.taskType));
        const taskGroupsStartedIds = _.uniq(_.map(arrivalEventLogs, (event) => event.taskGroupStarted.id));

        const taskGroupsStarted = await Parse.Object.fetchAll(
            _.map(taskGroupsStartedIds, (taskGroupStartedId: string) => {
                return TaskGroupStarted.createWithoutData(taskGroupStartedId)
            }),
            {useMasterKey: true}
        ); 

        const arrivalsByTaskGroupStartedDayOfWeek = _.groupBy(arrivalEventLogs, (event) => {
            const taskGroupStarted = _.find(taskGroupsStarted, (taskGroupStarted) => taskGroupStarted.id === event.taskGroupStarted.id);
            return moment(taskGroupStarted.createdAt).isoWeekday()
        });

        return taskTypes.map((taskType) => {
            return {
                taskType,
                days: _.map(arrivalsByTaskGroupStartedDayOfWeek, (events, dayOfWeekKey) => {
                    return {
                        dayOfWeek: _.toNumber(dayOfWeekKey),
                        statistics: new ManualAutomaticArrivalStatistics(events).create(taskType)
                    }
                })
            }
        });
    }

}