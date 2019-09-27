import { EventLogQuery, TaskEvent } from '../../shared/subclass/EventLog';
import { TaskType } from '../../shared/subclass/Task';
import { ManualAutomaticArrivalStatistics, IManualAutomaticArrivalStatistics } from './manual.automatic.arrival.statistics';
import * as _ from 'lodash';

export interface ITotalArrivalAutomationStatistics {
    taskType: TaskType;
    statistics: IManualAutomaticArrivalStatistics;
}

export class TotalArrivalAutomationStatistics {

    constructor(
            private fromDate: Date, 
            private toDate: Date,
            private clientId?: string,
            private taskId?: string,
        ) {}


    public async generate(): Promise<ITotalArrivalAutomationStatistics[]> {

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

        const manualAutomaticStatistics = new ManualAutomaticArrivalStatistics(arrivalEventLogs);

        return taskTypes.map((taskType) => {
            return {
                taskType,
                statistics: manualAutomaticStatistics.create(taskType)
            }
        });
    }

}