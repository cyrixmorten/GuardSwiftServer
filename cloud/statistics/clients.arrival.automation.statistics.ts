import { ClientQuery, Client } from '../../shared/subclass/Client';
import { EventLogQuery, EventLog, TaskEvent } from '../../shared/subclass/EventLog';

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
                        .find({useMasterKey: true});

        return Promise.all(arrivalEventLogsDistinctClient.map((event) => {
            return Parse.Object.createWithoutData<Client>(event.client.id).fetch({useMasterKey: true});
        }));
    }

    public async generate() {

        const clients: Client[] = await this.findClients();

        return Promise.all(clients.map((client) => {
            return {
                client: {
                    id: client.clientId,
                    name: client.name,
                },
                statistics: {

                }
            }
        }));
    }

}