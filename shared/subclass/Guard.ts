import {BaseClass} from "./BaseClass";

export class Guard extends BaseClass {

    static readonly className = 'Guard';

    static readonly _guardId = 'guardId';
    static readonly _name = 'name';


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