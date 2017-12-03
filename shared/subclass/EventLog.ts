import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {Task, TaskType} from "./Task";
import {Client} from "./Client";
import * as _ from "lodash";

export class EventLog extends BaseClass {

    static className = 'EventLog';

    static readonly _name = 'name';
    static readonly _taskEvent = 'task_event';
    static readonly _taskType = 'taskType';
    static readonly _taskTypeName = 'taskTypeName';
    static readonly _task = 'task';

    static readonly _deviceTimeStamp = 'deviceTimestamp';

    static readonly _guardName = 'guardName';

    static readonly _client = 'client';

    static readonly _event = 'event';
    static readonly _amount = 'amount';
    static readonly _people = 'people';
    static readonly _clientLocation = 'clientLocation';
    static readonly _remarks = 'remarks';


    constructor(className?: string) {
        super(className || EventLog.className);
    }

    get name(): string {
        return this.get(EventLog._name);
    }

    set name(name: string) {
        this.set(EventLog._name, name);
    }

    get taskType(): TaskType {
        return this.get(EventLog._taskType);
    }

    set taskType(taskType: TaskType) {
        this.set(EventLog._taskType, taskType);
    }

    matchingTaskType(...taskType: TaskType[]): boolean {
        return _.includes(taskType, this.taskType);
    }

    get task(): Task {
        return this.get(EventLog._task);
    }

    set task(task: Task) {
        this.set(EventLog._task, task);
    }

    get guardName(): string {
        return this.get(EventLog._guardName);
    }

    set guardName(guardName: string) {
        this.set(EventLog._guardName, guardName);
    }

    get client(): Client {
        return this.get(EventLog._client);
    }

    set client(client: Client) {
        this.set(EventLog._client, client);
    }

    get taskTypeName(): string {
        return this.get(EventLog._taskTypeName);
    }

    set taskTypeName(taskTypeName: string) {
        this.set(EventLog._taskTypeName, taskTypeName);
    }

    get taskEvent(): string {
        return this.get(EventLog._taskEvent);
    }

    set taskEvent(taskEvent: string) {
        this.set(EventLog._taskEvent, taskEvent);
    }
}

export class EventLogQuery extends QueryBuilder<EventLog> {

    constructor() {
        super(EventLog);
    }



}