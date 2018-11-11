import {QueryBuilder} from "../QueryBuilder";
import {EventLog} from "./EventLog";
import {Task, TaskType} from "./Task";
import {Client} from "./Client";

/**
 * When a new report is created it copies attributes from the eventlog that created the report, hence extending
 * EventLog
 */
export class Report extends EventLog {

    static readonly className = 'Report';

    static readonly _tasks = 'tasks';
    static readonly _eventLogs = 'eventLogs';

    static readonly _clientName = 'clientName';
    static readonly _clientAddress = 'clientAddress';
    static readonly _clientAddressNumber = 'clientAddressNumber';
    static readonly _clientFullAddress = 'clientFullAddress';

    static readonly _mailStatus = 'mailStatus';

    static readonly _timeStarted = 'timeStarted';
    static readonly _timeEnded = 'timeEnded';

    constructor() {
        super(Report.className);
    }

    get tasks(): Task[] {
        return this.get(Report._tasks);
    }

    get eventLogs(): EventLog[] {
        return this.get(Report._eventLogs);
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

}

export class ReportQuery extends QueryBuilder<Report> {

    constructor() {
        super(Report);
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

}