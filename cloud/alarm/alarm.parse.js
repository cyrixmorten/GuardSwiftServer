"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const all_1 = require("../centrals/all");
exports.parseAlarm = function (central, alarmMsg) {
    let promise = new Parse.Promise();
    let alarmObject = {};
    _.forEach(all_1.centrals, function (handler) {
        if (_.isEmpty(alarmObject)) {
            alarmObject = handler.parse(central, alarmMsg) || {};
        }
    });
    if (_.isEmpty(alarmObject)) {
        promise.reject('Unable to parse alarm, unknown sender');
    }
    else {
        console.log('alarmObject: ', alarmObject);
        promise.resolve(alarmObject);
    }
    return promise;
};
//# sourceMappingURL=alarm.parse.js.map