"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = require("./BaseClass");
class User extends BaseClass_1.BaseClass {
    constructor() {
        super(User.className);
    }
    get name() {
        return this.get(User._name);
    }
    set name(name) {
        this.set(User._name, name);
    }
}
User.className = '_User';
User._name = 'name';
exports.User = User;
//# sourceMappingURL=User.js.map