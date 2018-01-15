import {BaseClass} from "./BaseClass";

export class User extends BaseClass {

    static readonly className = '_User';

    static readonly _name = 'name';
    static readonly _active = 'active';

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

}