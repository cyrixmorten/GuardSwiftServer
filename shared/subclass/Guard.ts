import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Guard extends BaseClass {

    static readonly className = 'Guard';

    static readonly _installation = 'installation';
    static readonly _guardId = 'guardId';
    static readonly _name = 'name';

    static readonly _alarmSMS = 'alarmSMS';


    constructor() {
        super(Guard.className);
    }

    get name(): string {
        return this.get(Guard._name);
    }

    set name(name: string) {
        this.set(Guard._name, name);
    }

    get guardId(): number {
        return this.get(Guard._guardId);
    }

    set guardId(guardId: number) {
        this.set(Guard._guardId, name);
    }
}

export class GuardQuery extends QueryBuilder<Guard>{

    constructor() {
        super(Guard);
    }

    whereAlarmSMS(value: boolean) {
        this.query.equalTo(Guard._alarmSMS, value);

        return this;
    }

}