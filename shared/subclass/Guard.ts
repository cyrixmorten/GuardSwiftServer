import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Guard extends BaseClass {

    static readonly className = 'Guard';

    static readonly _installation = 'installation';
    
    static readonly _guardId = 'guardId';
    static readonly _name = 'name';
    static readonly _mobileNumber = 'mobileNumber';
    
    static readonly _alarmNotify = 'alarmNotify';
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

    get mobileNumber(): string {
        return this.get(Guard._mobileNumber);
    }

    set mobileNumber(mobileNumber: string) {
        this.set(Guard._mobileNumber, mobileNumber);
    }

    get guardId(): number {
        return this.get(Guard._guardId);
    }

    set guardId(guardId: number) {
        this.set(Guard._guardId, guardId);
    }

    get alarmNotify(): boolean {
        return this.get(Guard._alarmNotify);
    }

    set alarmNotify(alarmNotify: boolean) {
        this.set(Guard._alarmNotify, alarmNotify);
    }

    get installation(): Parse.Object {
        return this.get(Guard._installation);
    }

    set installation(installation: Parse.Object) {
        this.set(Guard._installation, installation);
    }
}

export class GuardQuery extends QueryBuilder<Guard>{

    constructor() {
        super(Guard);
    }

    whereAlarmNotify(value: boolean) {
        this.query.equalTo(Guard._alarmNotify, value);

        return this;
    }

    whereAlarmSMS(value: boolean) {
        this.query.equalTo(Guard._alarmSMS, value);

        return this;
    }

}