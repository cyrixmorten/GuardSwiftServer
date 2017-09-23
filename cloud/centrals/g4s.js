"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
let cpsms = require('../../api/cpsms');
let matchesCentral = function (alarmOrCentral) {
    let centralName = alarmOrCentral.has('taskType') ? alarmOrCentral.get('centralName') : alarmOrCentral.get('name');
    return centralName === 'G4S';
};
exports.parse = function (central, alarmMsg) {
    console.log('matchesCentral(alarm): ', matchesCentral(central));
    if (!matchesCentral(central)) {
        return;
    }
    let onMyWayclientNumberAndAlarm = _.split(alarmMsg, ':');
    let statusMsg = _.split(onMyWayclientNumberAndAlarm[0], ',')[0];
    if (statusMsg !== 'På vej' && statusMsg !== 'ANNULERET') {
        throw new Error('Ignoring G4S status chain message');
    }
    let pieces = _.split(onMyWayclientNumberAndAlarm[1], ',');
    return {
        action: _.upperCase(statusMsg) === 'ANNULERET' ? 'abort' : 'create',
        alarmMsg: alarmMsg.substr(alarmMsg.indexOf(",") + 1),
        alarmObject: {
            clientName: _.trim(pieces[0]),
            clientId: _.trim(pieces[1]),
            fullAddress: _.trim(pieces[2]),
            priority: _.trim(pieces[3]),
            signalStatus: _.trim(pieces[4]),
            remarks: _.trim(pieces[5]),
            keybox: _.trim(pieces[6])
        }
    };
};
let smsToCentral = function (alarm, message) {
    findGuardMobile(alarm).then(function (mobileNumber) {
        cpsms.send({
            to: alarm.get('sentFrom'),
            from: mobileNumber,
            message: message,
            limit: 160
        });
    });
};
let findGuardMobile = function (alarm) {
    let fallback = Parse.Promise.as(alarm.get('sentTo'));
    let guardPointer = alarm.get('guard');
    if (guardPointer) {
        return guardPointer.fetch({ useMasterKey: true }).then(function (guard) {
            let mobile = guard.get('mobileNumber');
            return mobile && mobile.length > 6 ? mobile : fallback;
        }).fail(function () {
            return fallback;
        });
    }
    return fallback;
};
exports.handlePending = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
};
exports.handleAccepted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
    smsToCentral(alarm, 'På vej,' + alarm.get('original'));
};
exports.handleArrived = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
    smsToCentral(alarm, 'Fremme,' + alarm.get('original'));
};
exports.handleAborted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
};
exports.handleFinished = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
    smsToCentral(alarm, 'Slut,' + alarm.get('original'));
};
//# sourceMappingURL=g4s.js.map