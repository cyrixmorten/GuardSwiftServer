import {BaseClass} from "./BaseClass";

export class User extends BaseClass {

    static readonly className = '_User';

    static readonly _name = 'name';


    constructor() {
        super(User.className);
    }

    get name(): string {
        return this.get(User._name);
    }

    set name(name: string) {
        this.set(User._name, name);
    }

}