import {QueryBuilder} from "../QueryBuilder";

export class User extends Parse.User {

    static readonly className = '_User';

    static readonly _name = 'name';
    static readonly _active = 'active';
    static readonly _timeZone = 'timeZone';
    static readonly _sendTo = 'sendTo';

    constructor() {
        super(User.className);
    }

    get name(): string {
        return this.get(User._name);
    }

    set name(name: string) {
        this.set(User._name, name);
    }

    get active(): boolean {
        return this.get(User._active);
    }

    set active(active: boolean) {
        this.set(User._active, active);
    }

    get timeZone(): string {
        return this.get(User._timeZone);
    }

    set timeZone(timeZone: string) {
        this.set(User._timeZone, timeZone);
    }

    get sendTo(): string {
        return this.get(User._sendTo);
    }

    set sendTo(sendTo: string) {
        this.set(User._sendTo, sendTo);
    }

}

export class UserQuery extends QueryBuilder<Parse.User> {

    constructor() {
        super(Parse.User);
    }

    matchingSendTo(receiver: string): UserQuery {
        this.query.equalTo(User._sendTo, receiver);

        return this;
    }
}