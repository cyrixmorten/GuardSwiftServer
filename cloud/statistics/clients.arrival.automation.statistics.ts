import { Client } from '../../shared/subclass/Client';
import { EventLogQuery, EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import { TotalArrivalAutomationStatistics, ITotalArrivalAutomationStatistics } from './total.arrival.automation.statistics';
import { DailyArrivalAutomationStatistics, IDailyArrivalAutomationStatistics } from './daily.arrival.automation.statistics';
import * as _ from 'lodash';

export interface IClientArrivalAutomationStatistics {
    client: {
        id: string;
        name: string;
    },
    total: ITotalArrivalAutomationStatistics[];
    daily: IDailyArrivalAutomationStatistics[];
}
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

    public async generate(): Promise<any[]> {

        const clients: Client[] = await this.findClients();

        return Promise.all(clients.map(async (client) => {
            return {
                client: {
                    id: client.clientId,
                    name: client.name,
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