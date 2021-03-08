import { EventLog } from '../../../shared/subclass/EventLog';
import { Task } from '../../../shared/subclass/Task';

export enum EXCLUDE_MODE {
    GUARD,
    ALL
}


export interface RunParams {
    eventLogs: EventLog[];
    tasks: Task[];
    mode: EXCLUDE_MODE;
}

export abstract class ExcludeStrategy {

    constructor(protected timeZone: string) {}

    abstract run({eventLogs, tasks, mode}: RunParams): EventLog[];

}