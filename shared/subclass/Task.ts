import {BaseClass} from "./BaseClass";
import {TaskGroup} from "./TaskGroup";
import {QueryBuilder} from "../QueryBuilder";
import {Guard} from "./Guard";
import * as _ from "lodash";
import {TaskGroupStarted} from "./TaskGroupStarted";
import {Client} from "./Client";

export enum TaskStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    ARRIVED = 'arrived',
    ABORTED = 'aborted',
    FINISHED = 'finished'
}

export enum TaskType {
    REGULAR = 'Regular',
    RAID = 'Raid',
    STATIC = 'Static',
    ALARM = 'Alarm'
}

export class Task extends BaseClass {

    static readonly className = 'Task';

    static readonly _name = 'name';
    static readonly _guard = 'guard';

    static readonly _status = 'status';

    static readonly _taskType = 'taskType';
    static readonly _taskGroup = 'taskGroup';
    static readonly _taskGroupStarted = 'taskGroupStarted';
    static readonly _timesArrived = 'timesArrived';

    static readonly _client = 'client';
    static readonly _clientId = 'clientId';
    static readonly _clientName = 'clientName';
    static readonly _clientAddress = 'clientAddress';
    static readonly _position = 'position';

    static readonly _days = 'days';
    static readonly _isRunToday = 'isRunToday';


    constructor() {
        super(Task.className);
    }

    get name(): string {
        return this.get(Task._name);
    }

    set name(name: string) {
        this.set(Task._name, name);
    }

    get status(): TaskStatus {
        return this.get(Task._status);
    }

    set status(status: TaskStatus) {
        this.set(Task._status, status);
    }

    get taskType(): TaskType {
        return this.get(Task._taskType);
    }

    set taskType(taskType: TaskType) {
        this.set(Task._taskType, taskType);
    }

    get taskGroup(): TaskGroup {
        return this.get(Task._taskGroup);
    }

    set taskGroup(taskGroup: TaskGroup) {
        this.set(Task._taskGroup, taskGroup);
    }

    get taskGroupStarted(): TaskGroupStarted {
        return this.get(Task._taskGroupStarted);
    }

    set taskGroupStarted(taskGroupStarted: TaskGroupStarted) {
        if (_.isUndefined(taskGroupStarted)) {
            this.unset(Task._taskGroupStarted);
            return;
        }

        this.set(Task._taskGroupStarted, taskGroupStarted);
    }

    get timesArrived(): number {
        return this.get(Task._timesArrived);
    }

    set timesArrived(timesArrived: number) {
        this.set(Task._timesArrived, timesArrived);
    }

    set guard(guard: Guard) {
        if (_.isUndefined(guard)) {
            this.unset(Task._guard);
            return;
        }

        this.set(Task._guard, guard);
    }

    get guard(): Guard {
        return this.get(Task._guard);
    }

    get client(): Client {
        return this.get(Task._client);
    }

    set client(client: Client) {
        this.set(Task._client, client);

        this.clientId = client.clientId || '';
        this.clientName = client.name || '';
        this.clientAddress = client.fullAddress || '';

        this.position = client.position || this.position;
    }

    get clientId(): string {
        return this.get(Task._clientId);
    }

    set clientId(id: string) {
        this.set(Task._clientId, id);
    }

    get clientName(): string {
        return this.get(Task._clientName);
    }

    set clientName(name: string) {
        this.set(Task._clientName, name);
    }

    get clientAddress(): string {
        return this.get(Task._clientAddress);
    }

    set clientAddress(name: string) {
        this.set(Task._clientAddress, name);
    }

    set days(days: number[]) {
        this.set(Task._days, days);
    }

    get days(): number[] {
        return this.get(Task._days);
    }

    set isRunToday(isRunToday: boolean) {
        this.set(Task._isRunToday, isRunToday);
    }

    get isRunToday(): boolean {
        return this.get(Task._isRunToday);
    }

    get position(): Parse.GeoPoint {
        return this.get(Task._position);
    }

    set position(position: Parse.GeoPoint) {
        this.set(Task._position, position);
    }

    isType(type: TaskType) {
        return this.taskType === type;
    }



    isTaskRunToday() {
        // TODO check against holidays
        return _.includes(this.days, new Date().getDay())
    }

    reset(taskGroup?: TaskGroup, taskGroupStarted?: TaskGroupStarted) {
        this.status = TaskStatus.PENDING;
        this.guard = undefined;
        this.timesArrived = 0;


        if (taskGroup) {
            this.isRunToday = taskGroup.isRunToday() && this.isTaskRunToday();
        }
        if (taskGroupStarted) {
            this.taskGroupStarted = taskGroupStarted;
        }
    }
}

export class TaskQuery extends QueryBuilder<Task>{

    constructor() {
        super(Task);
    }

    matchingTaskGroup(taskGroup: TaskGroup): TaskQuery {
        this.query.equalTo(Task._taskGroup, taskGroup);
        return this;
    }

    matchingTaskType(taskType: TaskType): TaskQuery {
        this.query.equalTo(Task._taskType, taskType);
        return this;
    }

    matchingTaskStatus(taskStatus: TaskStatus): TaskQuery {
        this.query.equalTo(Task._status, taskStatus);
        return this;
    }

    whereTimesArrivedGreaterThan(timesArrived: number): TaskQuery {
        this.query.greaterThan(Task._timesArrived, timesArrived);
        return this;
    }

    matchingClient(client: Client) {
        this.query.equalTo(Task._client, client);
        return this;
    }
}