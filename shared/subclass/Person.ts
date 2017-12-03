import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Person extends BaseClass {

    static readonly className = 'Person';

    static readonly _name = 'name';

    constructor() {
        super(Person.className);
    }

    get name(): string {
        return this.get(Person._name);
    }

    set name(name: string) {
        this.set(Person._name, name);
    }

}

export class PersonQuery extends QueryBuilder<Person> {

    constructor() {
        super(Person);
    }



}