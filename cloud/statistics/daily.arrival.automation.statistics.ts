import { EventLogQuery, TaskEvent } from '../../shared/subclass/EventLog';
import { TaskType } from '../../shared/subclass/Task';
import { ManualAutomaticArrivalStatistics, IManualAutomaticArrivalStatistics } from './manual.automatic.arrival.statistics';
import * as _ from 'lodash';
import { TaskGroupStarted } from '../../shared/subclass/TaskGroupStarted';
import * as moment from 'moment';

export interface IDayArrivalAutomationStatistics {
    date: Date;
    dayOfWeek: number;
    statistics: IManualAutomaticArrivalStatistics;
}

export interface IDailyArrivalAutomationStatistics {
    taskType: TaskType;
    days: IDayArrivalAutomationStatistics[]
}

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
                        .matchingClient(this.clientId)
                        .matchingTask(this.taskId)
                        .createdAfter(this.fromDate)
                        .createdBefore(this.toDate)
                        .build()
                        .limit(Number.MAX_SAFE_INTEGER)
                        .find({useMasterKey: true});

        const taskTypes = _.compact(_.map(arrivalEventLogs, (event) => event.taskType));

        

        const arrivalsByTaskgroupStarted = _.groupBy(arrivalEventLogs, (event) => event.taskGroupStarted);



        return Promise.all(taskTypes.map(async (taskType) => {

            const dailyStatistics: IDayArrivalAutomationStatistics[] = 
                await Promise.all(_.map(arrivalsByTaskgroupStarted, async (events, taskGroupStartedPointer) => {

                    const manualAutomaticStatistics = new ManualAutomaticArrivalStatistics(events);

                    const taskGroupStarted = await Parse.Object.createWithoutData<TaskGroupStarted>(taskGroupStartedPointer)
                                                .fetch({useMasterKey: true});

                    const date = taskGroupStarted.createdAt;

                    return {
                        date,
                        dayOfWeek: moment(date).isoWeekday(),
                        statistics: manualAutomaticStatistics.create(taskType)
                    }
                }));

            return {
                taskType,
                days: dailyStatistics
            }
        }));
    }

}