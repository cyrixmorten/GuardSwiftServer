import { QueryBuilder } from "../QueryBuilder";
import { EventLog } from "./EventLog";
import { Task, TaskType } from './Task';
import { Client } from "./Client";
import { TaskGroupStarted } from './TaskGroupStarted';
import { BaseClass } from './BaseClass';
import * as _ from 'lodash';
import { TaskGroup } from './TaskGroup';

/**
 * When a new report is created it copies attributes from the eventlog that created the report, hence extending
 * EventLog
 */
export class Report extends BaseClass {

    static readonly className = 'Report';

    static readonly _tasks = 'tasks';
    static readonly _taskTypes = 'taskTypes';
    static readonly _taskGroups = 'taskGroups';
    static readonly _eventLogs = 'eventLogs';
    static readonly _eventCount = 'eventCount';

    static readonly _guardName = 'guardName';

    static readonly _client = 'client';
    static readonly _clientName = 'clientName';
    static readonly _clientAddress = 'clientAddress';
    static readonly _clientAddressNumber = 'clientAddressNumber';
    static readonly _clientFullAddress = 'clientFullAddress';

    static readonly _mailStatus = 'mailStatus';
    static readonly _mailStatuses = 'mailStatuses';

    static readonly _timeStarted = 'timeStarted';
    static readonly _timeEnded = 'timeEnded';

    static readonly _isClosed = 'isClosed';
    static readonly _isSent = 'isSent';

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
        return this.get(Report._tasks) || [this.get('task')];
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

    get isSent(): boolean {
        return this.get(Report._isSent);
    }

    set isSent(isSent: boolean) {
        this.set(Report._isSent, isSent);
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
        this.add(Report._mailStatuses, mailStatus);
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

    get taskTypes(): TaskType[] {
        return this.get(Report._taskTypes) || [this.get('taskType')];
    }

    addTaskType(taskType: TaskType) {
        this.addUnique(Report._taskTypes, taskType);
    }

    isMatchingTaskType(...taskTypes: TaskType[]): boolean {
        return _.some(taskTypes, (taskType) => {
            return _.includes(taskTypes, taskType);
        });
    }

    addTaskGroupStarted(taskGroup: TaskGroup) {
        this.addUnique(Report._taskGroups, taskGroup);
    }

    get taskGroups(): TaskGroup[] {
        return this.get(Report._taskGroups);
    }

}

export class ReportQuery extends QueryBuilder<Report> {

    constructor() {
        super(Report);
    }

    isClosed(val: boolean): any {
        this.query.equalTo(Report._isClosed, val);

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


    matchingOneOfTaskTypes(taskTypes: TaskType[]): ReportQuery {
        taskTypes.forEach((taskType) => {
            this.query = Parse.Query.or(
                this.query, 
                this.query.equalTo(Report._taskTypes, taskType)
            );
        });
        
        return this;
    }

    isSent(val: boolean): ReportQuery {
        this.query.equalTo(Report._isSent, val);
        return this;
    }

    matchingTaskGroup(taskGroup: TaskGroup) {
        this.query.equalTo(Report._taskGroups, taskGroup);
        return this;
    }

    notClosed() {
        this.query.equalTo(Report._isClosed, false);
        return this;
    }
}