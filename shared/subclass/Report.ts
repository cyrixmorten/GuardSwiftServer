import {QueryBuilder} from "../QueryBuilder";
import {EventLog} from "./EventLog";
import {Task, TaskType} from "./Task";
import {Client} from "./Client";
import {TaskGroupStarted} from './TaskGroupStarted';
import { BaseClass } from './BaseClass';
import * as _ from 'lodash';

/**
 * When a new report is created it copies attributes from the eventlog that created the report, hence extending
 * EventLog
 */
export class Report extends BaseClass {

    static readonly className = 'Report';

    static readonly _task = 'task'; // TODO backwards compatibility - replace with tasks array entry
    static readonly _tasks = 'tasks';
    static readonly _taskType = 'taskType';
    static readonly _tasksGroupStarted = 'taskGroupStarted';
    static readonly _eventLogs = 'eventLogs';
    static readonly _eventCount = 'eventCount';

    static readonly _guardName = 'guardName';
    
    static readonly _client = 'client';
    static readonly _clientName = 'clientName';
    static readonly _clientAddress = 'clientAddress';
    static readonly _clientAddressNumber = 'clientAddressNumber';
    static readonly _clientFullAddress = 'clientFullAddress';

    static readonly _mailStatus = 'mailStatus';

    static readonly _timeStarted = 'timeStarted';
    static readonly _timeEnded = 'timeEnded';

    static readonly _isClosed = 'isClosed';

    constructor() {
        super(Report.className);
    }

    get guardName(): string {
        return this.get(Report._guardName) || '';
    }

    set guardName(guardName: string) {
        this.set(Report._guardName, guardName);
    }

    get tasks(): Task[] {
        return this.get(Report._tasks);
    }

    get eventLogs(): EventLog[] {
        return this.get(Report._eventLogs);
    }

    get isClosed(): boolean {
        return this.get(Report._isClosed);
    }

    set isClosed(isClosed: boolean) {
        this.set(Report._isClosed, isClosed);
    }

    get client(): Client {
        return this.get(Report._client);
    }

    set client(client: Client) {
        this.set(Report._client, client);
    }
    
    get clientName(): string {
        return this.get(Report._clientName);
    }

    set clientName(clientName: string) {
        this.set(Report._clientName, clientName);
    }

    get clientAddress(): string {
        return this.get(Report._clientAddress);
    }

    set clientAddress(clientAddress: string) {
        this.set(Report._clientAddress, clientAddress);
    }

    get clientAddressNumber(): string {
        return this.get(Report._clientAddressNumber);
    }

    set clientAddressNumber(clientAddressNumber: string) {
        this.set(Report._clientAddressNumber, clientAddressNumber);
    }

    get clientFullAddress(): string {
        return this.get(Report._clientFullAddress);
    }

    set clientFullAddress(clientFullAddress: string) {
        this.set(Report._clientFullAddress, clientFullAddress);
    }

    get mailStatus(): Object {
        return this.get(Report._mailStatus);
    }

    set mailStatus(mailStatus: Object) {
        this.set(Report._mailStatus, mailStatus);
    }


    get timeStarted(): Date {
        return this.get(Report._timeStarted);
    }

    set timeStarted(timeStarted: Date) {
        this.set(Report._timeStarted, timeStarted);
    }

    get timeEnded(): Date {
        return this.get(Report._timeEnded);
    }

    set timeEnded(timeEnded: Date) {
        this.set(Report._timeEnded, timeEnded);
    }

    incrementEventCount() {
        this.increment(Report._eventCount);
    }

    get taskType(): TaskType {
        return this.get(EventLog._taskType);
    }

    set taskType(taskType: TaskType) {
        this.set(EventLog._taskType, taskType);
    }

    isMatchingTaskType(...taskType: TaskType[]): boolean {
        return _.includes(taskType, this.taskType);
    }

    get task(): Task {
        return this.get(EventLog._task);
    }

    set task(task: Task) {
        this.set(EventLog._task, task);
    }

}

export class ReportQuery extends QueryBuilder<Report> {

    constructor() {
        super(Report);
    }

    isClosed(): any {
        this.query.equalTo(Report._isClosed, true);

        return this;
    }

    hasClient() {
        this.query.exists(Report._client);

        return this;
    }

    matchingClient(client: Client): ReportQuery {
        this.query.equalTo(Report._client, client);
        return this;
    }

    matchingTask(task: Task): ReportQuery {
        this.query.equalTo(Report._tasks, task);
        return this;
    }


    matchingTaskType(taskType: TaskType): ReportQuery {
        this.query.equalTo(Report._taskType, taskType);
        return this;
    }

    isNotSent(): ReportQuery {
        this.doesNotExist('mailStatus');
        return this;
    }

    matchingTaskGroupStarted(taskGroupStarted: TaskGroupStarted) {
        this.query.equalTo(Report._tasksGroupStarted, taskGroupStarted);
        return this;
    }
}