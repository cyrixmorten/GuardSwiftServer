var _ = require('lodash');
var twilio = require('../../api/twilio');

var matchesCentral = function(alarm) {
    return alarm.get('centralName') === 'G4S'
};

exports.parse = function(alarm, alarmMsg) {
    console.log('matchesCentral(alarm): ', matchesCentral(alarm));
    if (!matchesCentral(alarm)) {
        console.log('abort');
        return;
    }

    var onMyWayclientNumberAndAlarm = _.split(alarmMsg, ':');
    var pieces = _.split(onMyWayclientNumberAndAlarm[1], ',');


    alarmMsg = alarmMsg.substr(alarmMsg.indexOf(","));

    console.log('alarmMsg: ', alarmMsg);

    return {
        clientName: pieces[0],
        fullAddress: pieces[2],
        priority: pieces[3],
        signalStatus: pieces[4],
        remarks: pieces[5],
        keybox: pieces[6]
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