import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class ClientContact extends BaseClass {

    static readonly className = 'ClientContact';

    static readonly _name = 'name';
    static readonly _email = 'email';
    static readonly _receiveReports = 'receiveReports';
    
    constructor() {
        super(ClientContact.className);
    }

    get name(): string {
        return this.get(ClientContact._name);
    }

    set name(name: string) {
        this.set(ClientContact._name, name);
    }

    get email(): string {
        return this.get(ClientContact._email);
    }

    set email(email: string) {
        this.set(ClientContact._email, email);
    }

    get receiveReports(): boolean {
        return this.get(ClientContact._receiveReports);
    }

    set receiveReports(receiveReports: boolean) {
        this.set(ClientContact._receiveReports, receiveReports);
    }

}

export class ClientContactQuery extends QueryBuilder<ClientContact> {

    constructor() {
        super(ClientContact);
    }



}