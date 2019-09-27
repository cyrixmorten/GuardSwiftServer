import { Client } from '../../shared/subclass/Client';
import { EventLogQuery, EventLog, TaskEvent } from '../../shared/subclass/EventLog';
import { TotalArrivalAutomationStatistics, ITotalArrivalAutomationStatistics } from './total.arrival.automation.statistics';
import { DailyArrivalAutomationStatistics, IDailyArrivalAutomationStatistics } from './daily.arrival.automation.statistics';

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

        const arrivalEventLogsDistinctClient: EventLog[] = await new EventLogQuery()
                        .matchingTaskEvent(TaskEvent.ARRIVE)
                        .matchingOwner(this.owner)
                        .createdAfter(this.fromDate)
                        .createdBefore(this.toDate)
                        .distinct(EventLog._client)
                        .build()
                        .limit(Number.MAX_SAFE_INTEGER)
                        .find({useMasterKey: true});

        return Promise.all(arrivalEventLogsDistinctClient.map((event) => {
            return Parse.Object.createWithoutData<Client>(event.client.id).fetch({useMasterKey: true});
        }));
    }

    public async generate(): Promise<IClientArrivalAutomationStatistics[]> {

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