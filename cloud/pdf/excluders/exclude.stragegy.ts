import { EventLog } from '../../../shared/subclass/EventLog';
import { Task } from '../../../shared/subclass/Task';
import { Report } from '../../../shared/subclass/Report';

export abstract class ExcludeStrategy {

    constructor(protected timeZone: string) {}

    protected run(eventLogs: EventLog[], tasks: Task[]): void {};
}