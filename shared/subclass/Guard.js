"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BaseClass_1 = require("./BaseClass");
var Guard = (function (_super) {
    __extends(Guard, _super);
    function Guard() {
        return _super.call(this, Guard.className) || this;
    }
    Object.defineProperty(Guard.prototype, "name", {
        get: function () {
            return this.get(Guard._name);
        },
        set: function (name) {
            this.set(Guard._name, name);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Guard.prototype, "guardId", {
        get: function () {
            return this.get(Guard._guardId);
        },
        set: function (guardId) {
            this.set(Guard._guardId, name);
        },
        enumerable: true,
        configurable: true
    });
    Guard.className = 'Guard';
    Guard._guardId = 'guardId';
    Guard._name = 'name';
    return Guard;
}(BaseClass_1.BaseClass));
exports.Guard = Guard;
//# sourceMappingURL=Guard.js.map