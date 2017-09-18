import {BaseClass} from "./BaseClass";
import {QueryBuilder} from "../QueryBuilder";

export class Client extends BaseClass {

    static readonly className = 'Client';

    static readonly _name = 'name';


    constructor() {
        super(Client.className);
    }

    get name(): string {
        return this.get(Client._name);
    }

    set name(name: string) {
        this.set(Client._name, name);
    }


}

export class ClientQuery extends QueryBuilder<Client> {

    constructor() {
        super(Client);
    }



}