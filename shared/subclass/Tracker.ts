import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";
import {Guard} from "./Guard";

export class Tracker extends BaseClass {

    static readonly className = 'Tracker';

    static readonly _installation = 'installation';
    static readonly _start = 'start';
    static readonly _end = 'end';
    static readonly _guard = 'guard';
    static readonly _gpsFile = 'gpsFile';
    static readonly _clientTimeStamp = 'clientTimeStamp';


    constructor() {
        super(Tracker.className);
    }

    get start(): Date {
        return this.get(Tracker._start);
    }

    set start(start: Date) {
        this.set(Tracker._start, start);
    }

    get end(): Date {
        return this.get(Tracker._end);
    }

    set end(end: Date) {
        this.set(Tracker._end, end);
    }

    get guard(): Guard {
        return this.get(Tracker._guard);
    }

    set guard(guard: Guard) {
        this.set(Tracker._guard, guard);
    }


    get gpsFile(): Parse.File {
        return this.get(Tracker._gpsFile);
    }

    set gpsFile(gpsFile: Parse.File) {
        this.set(Tracker._gpsFile, gpsFile);
    }
}

export class TrackerQuery extends QueryBuilder<Tracker>{

    constructor() {
        super(Tracker);
    }

    matchingGuard(objectId: string) {
        this.query.equalTo(Tracker._guard, Guard.createWithoutData(objectId));

        return this;
    }
}