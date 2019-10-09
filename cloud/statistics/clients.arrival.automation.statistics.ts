import { Client } from '../../shared/subclass/Client';
import { EventLogQuery, EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import { TotalArrivalAutomationStatistics } from './total.arrival.automation.statistics';
import { DailyArrivalAutomationStatistics } from './daily.arrival.automation.statistics';
import { IClientArrivalAutomationStatistics } from '../../shared/statistics/arrival.statistics.types';
import * as _ from 'lodash';

export class ClientArrivalAutomationStatistics {

    constructor(
            private owner: Parse.User,
            private fromDate: Date, 
            private toDate: Date
        ) {}

    private async findClients(): Promise<Client[]> {

        const clientPointers: Client[] = await new EventLogQuery()
                        .matchingTaskEvent(TaskEvent.ARRIVE)
                        .matchingOwner(this.owner)
                        .createdAfter(this.fromDate)
                        .createdBefore(this.toDate)
                        .build()
                        .limit(Number.MAX_SAFE_INTEGER)
                        .distinct(EventLog._client);
                        
        return Parse.Object.fetchAll<Client>(
            _.map(clientPointers, (pointer: any) => Client.createWithoutData(pointer.objectId)), 
        {useMasterKey: true});
    }

    public async generate(): Promise<IClientArrivalAutomationStatistics[]> {

        const clients: Client[] = await this.findClients();

        return Promise.all(clients.map(async (client) => {
            return {
                client: {
                    id: client.id,
                    name: client.idAndName,
                },
                 total: await new TotalArrivalAutomationStatistics(
                    this.fromDate,
                    this.toDate,
                    client.id
                ).generate(),
               daily: await new DailyArrivalAutomationStatistics(
                    this.fromDate,
                    this.toDate,
                    client.id,
                ).generate()
            }
        })); 
    }

}