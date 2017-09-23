import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class EventLog extends BaseClass {

    static readonly className = 'EventLog';

    static readonly _name = 'name';


    constructor() {
        super(EventLog.className);
    }

    get name(): string {
        return this.get(EventLog._name);
    }

    set name(name: string) {
        this.set(EventLog._name, name);
    }


}

export class EventLogQuery extends QueryBuilder<EventLog> {

    constructor() {
        super(EventLog);
    }



}