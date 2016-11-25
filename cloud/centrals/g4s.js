var _ = require('lodash');
var twilio = require('../../api/twilio');

var matchesCentral = function (alarm) {
    return alarm.get('centralName') === 'G4S'
};

exports.parse = function (alarm, alarmMsg) {
    console.log('matchesCentral(alarm): ', matchesCentral(alarm));
    if (!matchesCentral(alarm)) {
        console.log('abort');
        return;
    }

    var onMyWayclientNumberAndAlarm = _.split(alarmMsg, ':');
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

exports.handlePending = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    twilio.send(
        alarm.get('sentFrom'),
        'Modtaget,' + alarm.get('original'),
        160
    );
};

exports.handleAccepted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    twilio.send(
        alarm.get('sentFrom'),
        'På vej,' + alarm.get('original'),
        160
    );
};

exports.handleArrived = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    twilio.send(
        alarm.get('sentFrom'),
        'Fremme,' + alarm.get('original'),
        160
    );
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

    twilio.send(
        alarm.get('sentFrom'),
        'Slut,' + alarm.get('original'),
        160
    );
};