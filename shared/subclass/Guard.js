"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
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
Guard._guardId = 'guardId';
Guard._name = 'name';
exports.Guard = Guard;
//# sourceMappingURL=Guard.js.map