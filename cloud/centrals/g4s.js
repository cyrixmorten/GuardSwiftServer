var _ = require('lodash');
var cpsms = require('../../api/cpsms');

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

exports.handlePending = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    cpsms.send({
        to: alarm.get('sentFrom'),
        from: alarm.get('sentTo'),
        message: 'Modtaget,' + alarm.get('original'),
        limit: 160
    });
};

exports.handleAccepted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    cpsms.send({
        to: alarm.get('sentFrom'),
        from: alarm.get('sentTo'),
        message: 'På vej,' + alarm.get('original'),
        limit: 160
    });
};

exports.handleArrived = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    cpsms.send({
        to: alarm.get('sentFrom'),
        from: alarm.get('sentTo'),
        message: 'Fremme,' + alarm.get('original'),
        limit: 160
    });
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


    cpsms.send({
        to: alarm.get('sentFrom'),
        from: alarm.get('sentTo'),
        message: 'Slut,' + alarm.get('original'),
        limit: 160
    });
};