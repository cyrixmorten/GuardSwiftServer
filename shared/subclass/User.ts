
export class User extends Parse.User {

    static readonly className = '_User';

    static readonly _name = 'name';
    static readonly _active = 'active';
    static readonly _timeZone = 'timeZone';

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

}