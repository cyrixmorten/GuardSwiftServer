"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
class EventLog extends BaseClass_1.BaseClass {
    constructor() {
        super(EventLog.className);
    }
    get name() {
        return this.get(EventLog._name);
    }
    set name(name) {
        this.set(EventLog._name, name);
    }
}
EventLog.className = 'EventLog';
EventLog._name = 'name';
exports.EventLog = EventLog;
class EventLogQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(EventLog);
    }
}
exports.EventLogQuery = EventLogQuery;
//# sourceMappingURL=EventLog.js.map