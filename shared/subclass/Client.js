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
    set clientId(clientId) {
        this.set(Client._clientId, clientId);
    }
    get clientId() {
        return this.get(Client._clientId);
    }
    set fullAddress(fullAddress) {
        this.set(Client._fullAddress, fullAddress);
    }
    get fullAddress() {
        return this.get(Client._fullAddress);
    }
    get position() {
        return this.get(Client._position);
    }
    set position(position) {
        this.set(Client._position, position);
    }
}
Client.className = 'Client';
Client._name = 'name';
Client._clientId = 'clientId';
Client._cityName = 'cityName';
Client._zipcode = 'zipcode';
Client._addressName = 'addressName';
Client._addressNumber = 'addressNumber';
Client._fullAddress = 'fullAddress';
Client._position = 'position';
exports.Client = Client;
class ClientQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Client);
    }
}
exports.ClientQuery = ClientQuery;
//# sourceMappingURL=Client.js.map