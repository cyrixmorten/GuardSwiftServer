import {BaseClass} from "./BaseClass";
import {TaskGroup} from "./TaskGroup";
import {Guard} from "./Guard";
import * as _ from "lodash";
import {TaskGroupStarted} from "./TaskGroupStarted";
import {Client} from "./Client";
import {QueryBuilder} from '../QueryBuilder';
import { Planning } from '../Planning';
import moment = require('moment');

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

    static readonly _type = 'type';
    static readonly _taskType = 'taskType';
    static readonly _taskGroup = 'taskGroup';
    static readonly _taskGroupStarted = 'taskGroupStarted';
    static readonly _timesArrived = 'timesArrived';
    static readonly _knownStatus = 'knownStatus';
    
    static readonly _client = 'client';
    static readonly _clientId = 'clientId';
    static readonly _clientName = 'clientName';
    static readonly _clientAddress = 'clientAddress';
    static readonly _fullAddress = 'fullAddress'; // used by alarms when creating client 
    static readonly _position = 'position';

    static readonly _days = 'days';
    static readonly _supervisions = 'supervisions';
    static readonly _timeStartDate = 'timeStartDate';
    static readonly _timeEndDate = 'timeEndDate';
    static readonly _expireDate = 'expireDate';

    static readonly _isRunToday = 'isRunToday';
    static readonly _geofenceRadius = 'geofenceRadius';

    // original alarm as it looked when received from central
    static readonly _original = 'original';

    constructor() {
        super(Task.className);
    }

    get type(): string {
        return this.get(Task._type);
    }

    set type(type: string) {
        this.set(Task._type, type);
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

    get knownStatus(): TaskStatus[] {
        return this.get(Task._knownStatus);
    }

    set knownStatus(knownStatus: TaskStatus[]) {
        this.set(Task._knownStatus, knownStatus);
    }

    addKnownStatus(knownStatus: TaskStatus) {
        this.addUnique(Task._knownStatus, knownStatus);
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

        const taskRadiusFromClient = client.taskRadius && client.taskRadius[this.taskType];

        if (taskRadiusFromClient) {
            this.geofenceRadius = taskRadiusFromClient;
        }
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

    get fullAddress(): string {
        return this.get(Task._fullAddress);
    }

    set fullAddress(name: string) {
        this.set(Task._fullAddress, name);
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


    get supervisions(): number {
        return this.get(Task._supervisions);
    }

    set supervisions(supervisions: number) {
        this.set(Task._supervisions, supervisions);
    }

    get timeStartDate(): Date {
        return this.get(Task._timeStartDate);
    }

    set timeStartDate(timeStartDate: Date) {
        this.set(Task._timeStartDate, timeStartDate);
    }


    get timeEndDate(): Date {
        return this.get(Task._timeEndDate);
    }

    set timeEndDate(timeEndDate: Date) {
        this.set(Task._timeEndDate, timeEndDate);
    }

    get expireDate(): Date {
        return this.get(Task._expireDate);
    }

    set expireDate(expireDate: Date) {
        this.set(Task._expireDate, expireDate);
    }

    daysUntilExpire(): number {
        const expireDate = this.expireDate;
        if (!expireDate) {
            return Number.MAX_SAFE_INTEGER
        }


        return moment(expireDate).diff(moment(), 'days', true);
    }
    
    get geofenceRadius(): number {
        return this.get(Task._geofenceRadius);
    }

    set geofenceRadius(geofenceRadius: number) {
        this.set(Task._geofenceRadius, geofenceRadius);
    }

    get original(): string {
        return this.get(Task._original);
    }

    set original(original: string) {
        this.set(Task._original, original);
    }
    
    isType(type: TaskType) {
        return this.taskType === type;
    }

    matchingTaskType(...taskType: TaskType[]): boolean {
        return _.includes(taskType, this.taskType);
    }


    isTaskRunToday(taskGroup?: TaskGroup, countryCode?: string) {
        return taskGroup.isRunToday() && Planning.isRunToday(this.days, countryCode);
    }

    reset(taskGroup?: TaskGroup, taskGroupStarted?: TaskGroupStarted): Task {
        this.status = TaskStatus.PENDING;
        this.guard = undefined;
        this.timesArrived = 0;


        if (taskGroup) {
            this.isRunToday = this.isTaskRunToday(taskGroup);
        }
        if (taskGroupStarted) {
            this.taskGroupStarted = taskGroupStarted;
        }

        if (this.daysUntilExpire() < 0) {
            this.archive = true;
        }

        return this;
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

    isRunToday(isRunToday: boolean = true): TaskQuery {
        this.query.equalTo(Task._isRunToday, isRunToday);
        return this;
    }

    matchingClient(client: Client) {
        this.query.equalTo(Task._client, client);
        return this;
    }
}