import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {Task, TaskType} from "./Task";
import {Client} from "./Client";
import * as _ from "lodash";
import {TaskGroupStarted} from "./TaskGroupStarted";
import { Report } from './Report';


export enum TaskEvent {
    ACCEPT = 'ACCEPT',
    ARRIVE = 'ARRIVE',
    ABORT = 'ABORT',
    FINISH = 'FINISH',
    OTHER = 'OTHER'
}

export class EventLog extends BaseClass {


    static className = 'EventLog';

    static readonly _name = 'name';
    
    static readonly _eventCode = 'eventCode';
    static readonly _taskEvent = 'task_event';
    static readonly _taskType = 'taskType';
    static readonly _taskTypeName = 'taskTypeName';

    static readonly _task = 'task';
    static readonly _taskGroupStarted = 'taskGroupStarted';

    static readonly _deviceTimestamp = 'deviceTimestamp';

    static readonly _guardName = 'guardName';

    static readonly _client = 'client';
    static readonly _clientName = 'clientName';
    static readonly _clientCity = 'clientCity';
    static readonly _clientZipcode = 'clientZipcode';
    static readonly _clientAddress = 'clientAddress';
    static readonly _clientAddressNumber = 'clientAddressNumber';
    static readonly _clientFullAddress = 'clientFullAddress';

    static readonly _event = 'event';
    static readonly _amount = 'amount';
    static readonly _people = 'people';
    static readonly _clientLocation = 'clientLocation';
    static readonly _remarks = 'remarks';

    static readonly _activityName = 'activityName';
    static readonly _distanceMeters = 'clientDistanceMeters';
    static readonly _automatic = 'automatic';
    static readonly _withinSchedule = 'withinSchedule';

    static readonly _report = 'report';

    private excludeReason: string;

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

    get eventCode(): number {
        return this.get(EventLog._eventCode);
    }

    set eventCode(eventCode: number) {
        this.set(EventLog._eventCode, eventCode);
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

    get taskGroupStarted(): TaskGroupStarted {
        return this.get(EventLog._taskGroupStarted);
    }

    set taskGroupStarted(taskGroupStarted: TaskGroupStarted) {
        this.set(EventLog._taskGroupStarted, taskGroupStarted);
    }

    get guardName(): string {
        return this.get(EventLog._guardName) || '';
    }

    set guardName(guardName: string) {
        this.set(EventLog._guardName, guardName);
    }

    get activityName(): string {
        return this.get(EventLog._activityName);
    }

    get distanceToClientMeters(): number {
        return this.get(EventLog._distanceMeters);
    }

    get client(): Client {
        return this.get(EventLog._client);
    }

    set client(client: Client) {
        this.set(EventLog._client, client);
    }

    get clientName(): string {
        return this.get(EventLog._clientName);
    }

    set clientName(clientName: string) {
        this.set(EventLog._clientName, clientName);
    }

    get clientCity(): string {
        return this.get(EventLog._clientCity);
    }

    set clientCity(clientCity: string) {
        this.set(EventLog._clientCity, clientCity);
    }

    get clientZipcode(): string {
        return this.get(EventLog._clientZipcode);
    }

    set clientZipcode(clientZipcode: string) {
        this.set(EventLog._clientZipcode, clientZipcode);
    }

    get clientAddress(): string {
        return this.get(EventLog._clientAddress);
    }

    set clientAddress(clientAddress: string) {
        this.set(EventLog._clientAddress, clientAddress);
    }

    get clientAddressNumber(): string {
        return this.get(EventLog._clientAddressNumber);
    }

    set clientAddressNumber(clientAddressNumber: string) {
        this.set(EventLog._clientAddressNumber, clientAddressNumber);
    }

    get clientFullAddress(): string {
        return this.get(EventLog._clientFullAddress);
    }

    set clientFullAddress(clientFullAddress: string) {
        this.set(EventLog._clientFullAddress, clientFullAddress);
    }
    
    
    get taskTypeName(): string {
        return this.get(EventLog._taskTypeName);
    }

    set taskTypeName(taskTypeName: string) {
        this.set(EventLog._taskTypeName, taskTypeName);
    }

    get taskEvent(): TaskEvent {
        return this.get(EventLog._taskEvent);
    }

    set taskEvent(taskEvent: TaskEvent) {
        this.set(EventLog._taskEvent, taskEvent);
    }

    matchingTaskEvent(...taskEvent: TaskEvent[]) {
        return _.includes(taskEvent, this.taskEvent);
    }

    get event(): string {
        return this.get(EventLog._event);
    }

    set event(event: string) {
        this.set(EventLog._event, event);
    }

    get people(): string {
        return this.get(EventLog._people);
    }

    set people(people: string) {
        this.set(EventLog._people, people);
    }

    get clientLocation(): string {
        return this.get(EventLog._clientLocation);
    }

    set clientLocation(clientLocation: string) {
        this.set(EventLog._clientLocation, clientLocation);
    }

    get remarks(): string {
        return this.get(EventLog._remarks);
    }

    set remarks(remarks: string) {
        this.set(EventLog._remarks, remarks);
    }


    get amount(): number {
        return this.get(EventLog._amount);
    }

    set amount(amount: number) {
        this.set(EventLog._amount, amount);
    }
    
    get automatic(): boolean {
        return this.get(EventLog._automatic);
    }

    set automatic(automatic: boolean) {
        this.set(EventLog._automatic, automatic);
    }

    get report(): Report {
        return this.get(EventLog._report);
    }

    set report(report: Report) {
        this.set(EventLog._report, report);
    }

    get withinSchedule(): boolean {
        return this.get(EventLog._withinSchedule);
    }

    set withinSchedule(withinSchedule: boolean) {
        this.set(EventLog._withinSchedule, withinSchedule);
    }

    get deviceTimestamp(): string {
        return this.get(EventLog._deviceTimestamp);
    }

    set deviceTimestamp(deviceTimestamp: string) {
        this.set(EventLog._deviceTimestamp, deviceTimestamp);
    }

    get guardInitials() {
        // usually first and last name
        let nameElements = _.compact(this.guardName.split(/[ ,]+/));

        // pick the first letter in each name element
        return _.join(_.map(nameElements, _.first), '');
    }

    isExcludedFromReport(): boolean {
        return !!this.excludeReason;
    }
    
    getExcludeReason(): string {
        return this.excludeReason;
    }

    setExcludeReason(reason: string) {
        this.excludeReason = reason;
    }
}

export class EventLogQuery extends QueryBuilder<EventLog> {

    constructor() {
        super(EventLog);
    }

    matchingTaskEvent(taskEvent: TaskEvent) {
        this.query.equalTo(EventLog._taskEvent, taskEvent);

        return this;
    }

    matchingTask(task: Task) {
        this.query.equalTo(EventLog._task, task);

        return this;
    }

}