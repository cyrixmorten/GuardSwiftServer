"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
class Person extends BaseClass_1.BaseClass {
    constructor() {
        super(Person.className);
    }
    get name() {
        return this.get(Person._name);
    }
    set name(name) {
        this.set(Person._name, name);
    }
}
Person.className = 'Person';
Person._name = 'name';
exports.Person = Person;
class PersonQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Person);
    }
}
exports.PersonQuery = PersonQuery;
//# sourceMappingURL=Person.js.map