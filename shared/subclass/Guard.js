"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
const QueryBuilder_1 = require("../QueryBuilder");
class Guard extends BaseClass_1.BaseClass {
    constructor() {
        super(Guard.className);
    }
    get name() {
        return this.get(Guard._name);
    }
    set name(name) {
        this.set(Guard._name, name);
    }
    get guardId() {
        return this.get(Guard._guardId);
    }
    set guardId(guardId) {
        this.set(Guard._guardId, name);
    }
}
Guard.className = 'Guard';
Guard._installation = 'installation';
Guard._guardId = 'guardId';
Guard._name = 'name';
Guard._alarmSMS = 'alarmSMS';
exports.Guard = Guard;
class GuardQuery extends QueryBuilder_1.QueryBuilder {
    constructor() {
        super(Guard);
    }
    whereAlarmSMS(value) {
        this.query.equalTo(Guard._alarmSMS, value);
        return this;
    }
}
exports.GuardQuery = GuardQuery;
//# sourceMappingURL=Guard.js.map