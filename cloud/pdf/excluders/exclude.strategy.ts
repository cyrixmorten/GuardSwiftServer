import { EventLog } from '../../../shared/subclass/EventLog';
import { Task } from '../../../shared/subclass/Task';

export abstract class ExcludeStrategy {

    constructor(protected timeZone: string) {}

    abstract run(eventLogs: EventLog[], tasks: Task[]): EventLog[];
}