var _ = require('lodash');
var cpsms = require('../../api/cpsms');

var matchesCentral = function (alarm) {
    return alarm.get('centralName') === 'G4S'
};


exports.parse = function (alarm, alarmMsg) {
    console.log('matchesCentral(alarm): ', matchesCentral(alarm));
    if (!matchesCentral(alarm)) {
        return;
    }

    var onMyWayclientNumberAndAlarm = _.split(alarmMsg, ':');
    var statusMsg = _.split(onMyWayclientNumberAndAlarm[0], ',')[0];

    if (statusMsg !== 'På vej') {
        throw new Error('Ignoring G4S status chain message')
    }

    var pieces = _.split(onMyWayclientNumberAndAlarm[1], ',');

    return {
        alarmMsg: alarmMsg.substr(alarmMsg.indexOf(",") + 1),
        alarmObject: {
            clientName: _.trim(pieces[0]),
            fullAddress: _.trim(pieces[2]),
            priority: _.trim(pieces[3]),
            signalStatus: _.trim(pieces[4]),
            remarks: _.trim(pieces[5]),
            keybox: _.trim(pieces[6])
        }
    }

};

var smsToCentral = function (alarm, message) {
    findGuardMobile(alarm).then(function(mobileNumber) {
        cpsms.send({
            to: alarm.get('sentFrom'),
            from: mobileNumber,
            message: message,
            limit: 160
        });
    });
};

var findGuardMobile = function (alarm) {
    var fallback = Parse.Promise.as(alarm.get('sentTo'));

    var guardPointer = alarm.get('guard');
    if (guardPointer) {
        return guardPointer.fetch({useMasterKey: true}).then(function (guard) {
            var mobile = guard.get('mobileNumber');

            return mobile && mobile.length > 6 ? mobile : fallback;
        }).fail(function() {
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