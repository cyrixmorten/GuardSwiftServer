"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
class Central extends BaseClass_1.BaseClass {
    constructor() {
        super(Central.className);
    }
    get name() {
        return this.get(Central._name);
    }
    set name(name) {
        this.set(Central._name, name);
    }
}
Central.className = 'Central';
Central._name = 'name';
exports.Central = Central;
class CentralQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Central);
    }
}
exports.CentralQuery = CentralQuery;
//# sourceMappingURL=Central.js.map