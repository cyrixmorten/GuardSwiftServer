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
var BaseClass = (function (_super) {
    __extends(BaseClass, _super);
    function BaseClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(BaseClass.prototype, "owner", {
        get: function () {
            return this.get(BaseClass._owner);
        },
        set: function (user) {
            this.set(BaseClass._owner, user);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseClass.prototype, "archive", {
        get: function () {
            return this.get(BaseClass._archive);
        },
        set: function (archive) {
            this.set(BaseClass._archive, archive);
        },
        enumerable: true,
        configurable: true
    });
    BaseClass.prototype.copyAttributes = function (fromObject) {
        var _this = this;
        Object.keys(fromObject.attributes).forEach(function (fieldName) {
            _this.set(fieldName, fromObject.get(fieldName));
        });
    };
    BaseClass._owner = 'owner';
    BaseClass._archive = 'archive';
    return BaseClass;
}(Parse.Object));
exports.BaseClass = BaseClass;
//# sourceMappingURL=BaseClass.js.map