import { EventLogQuery, TaskEvent } from '../../shared/subclass/EventLog';
import { ManualAutomaticArrivalStatistics } from './manual.automatic.arrival.statistics';
import * as _ from 'lodash';
import { Client } from '../../shared/subclass/Client';
import { ITotalArrivalAutomationStatistics } from '../../shared/statistics/arrival.statistics.types';

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

        const manualAutomaticStatistics = new ManualAutomaticArrivalStatistics(arrivalEventLogs);

        return taskTypes.map((taskType) => {
            return {
                taskType,
                statistics: manualAutomaticStatistics.create(taskType)
            }
        });
    }

}