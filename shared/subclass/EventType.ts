import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class EventType extends BaseClass {

    static readonly className = 'EventType';

    static readonly _name = 'name';


    constructor() {
        super(EventType.className);
    }

    get name(): string {
        return this.get(EventType._name);
    }

    set name(name: string) {
        this.set(EventType._name, name);
    }


}

export class EventTypeQuery extends QueryBuilder<EventType> {

    constructor() {
        super(EventType);
    }



}