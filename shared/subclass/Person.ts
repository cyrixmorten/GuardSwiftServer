import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Person extends BaseClass {

    static readonly className = 'Person';

    static readonly _name = 'name';
    static readonly _email = 'email';
    static readonly _receiveReports = 'receiveReports';
    
    constructor() {
        super(Person.className);
    }

    get name(): string {
        return this.get(Person._name);
    }

    set name(name: string) {
        this.set(Person._name, name);
    }

    get email(): string {
        return this.get(Person._email);
    }

    set email(email: string) {
        this.set(Person._email, email);
    }

    get receiveReports(): boolean {
        return this.get(Person._receiveReports);
    }

    set receiveReports(receiveReports: boolean) {
        this.set(Person._receiveReports, receiveReports);
    }

}

export class PersonQuery extends QueryBuilder<Person> {

    constructor() {
        super(Person);
    }



}