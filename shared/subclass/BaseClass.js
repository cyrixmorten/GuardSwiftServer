"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class BaseClass extends Parse.Object {
    get owner() {
        return this.get(BaseClass._owner);
    }
    set owner(user) {
        this.set(BaseClass._owner, user);
    }
    get archive() {
        return this.get(BaseClass._archive);
    }
    set archive(archive) {
        this.set(BaseClass._archive, archive);
    }
    copyAttributes(fromObject, select) {
        Object.keys(fromObject.attributes).forEach((fieldName) => {
            if (!select || _.includes(select, fieldName)) {
                this.set(fieldName, fromObject.get(fieldName));
            }
        });
    }
}
BaseClass._owner = 'owner';
BaseClass._archive = 'archive';
exports.BaseClass = BaseClass;
//# sourceMappingURL=BaseClass.js.map