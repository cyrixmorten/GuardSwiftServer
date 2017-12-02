import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Central extends BaseClass {

    static readonly className = 'Central';

    static readonly _name = 'name';


    constructor() {
        super(Central.className);
    }

    get name(): string {
        return this.get(Central._name);
    }

    set name(name: string) {
        this.set(Central._name, name);
    }


}

export class CentralQuery extends QueryBuilder<Central> {

    constructor() {
        super(Central);
    }



}