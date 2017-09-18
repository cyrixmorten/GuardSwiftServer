"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
class Client extends BaseClass_1.BaseClass {
    constructor() {
        super(Client.className);
    }
    get name() {
        return this.get(Client._name);
    }
    set name(name) {
        this.set(Client._name, name);
    }
}
Client.className = 'Client';
Client._name = 'name';
exports.Client = Client;
class ClientQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Client);
    }
}
exports.ClientQuery = ClientQuery;
//# sourceMappingURL=Client.js.map