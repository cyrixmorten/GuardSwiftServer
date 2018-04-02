import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {Guard} from "./Guard";
import {TaskGroup} from "./TaskGroup";
import {Client} from "./Client";

export class TrackerData extends BaseClass {

    static readonly className = 'TrackerData';
    
    static readonly _guard = 'guard';
    static readonly _client = 'client';
    static readonly _position = 'position';
    static readonly _taskGroup = 'taskGroup';
    static readonly _clientTimeStamp = 'clientTimeStamp';
    static readonly _activityType = 'activityType';


    constructor() {
        super(TrackerData.className);
    }

    get guard(): Guard {
        return this.get(TrackerData._guard);
    }

    set guard(guard: Guard) {
        this.set(TrackerData._guard, guard);
    }

    get client(): Client {
        return this.get(TrackerData._client);
    }

    set client(client: Client) {
        this.set(TrackerData._client, client);
    }

    get position(): Parse.GeoPoint {
        return this.get(TrackerData._position);
    }

    set position(position: Parse.GeoPoint) {
        this.set(TrackerData._position, position);
    }

    get taskGroup(): TaskGroup {
        return this.get(TrackerData._taskGroup);
    }

    set taskGroup(taskGroup: TaskGroup) {
        this.set(TrackerData._taskGroup, taskGroup);
    }

    get clientTimeStamp(): Date {
        return this.get(TrackerData._clientTimeStamp);
    }

    set clientTimeStamp(clientTimeStamp: Date) {
        this.set(TrackerData._clientTimeStamp, clientTimeStamp);
    }

    get activityType(): number {
        return this.get(TrackerData._activityType);
    }

    set activityType(activityType: number) {
        // IN_VEHICLE = 0;
        // ON_BICYCLE = 1;
        // ON_FOOT = 2;
        // STILL = 3;
        // UNKNOWN = 4;
        // TILTING = 5;
        // WALKING = 7;
        // RUNNING = 8;
        this.set(TrackerData._activityType, activityType);
    }
}

export class TrackerDataQuery extends QueryBuilder<TrackerData>{

    constructor() {
        super(TrackerData);
    }

    matchingGuard(objectId: string) {
        this.query.equalTo(TrackerData._guard, Guard.createWithoutData(objectId));

        return this;
    }

    withinRadiusMeters(point: Parse.GeoPoint, meters: number) {
        this.query.withinKilometers(TrackerData._position, point, meters/1000);

        return this;
    }
}