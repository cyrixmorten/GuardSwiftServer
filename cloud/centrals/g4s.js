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

    var pieces = _.split(alarmMsg, ',');

    return {
        taskId: pieces[0],
        clientName: pieces[1],
        clientId: pieces[2],
        fullAddress: pieces[3],
        securityLevel: _.toNumber(pieces[4]),
        signalStatus: pieces[5],
        remarks: pieces[6],
        keybox: pieces[7]
    }

};

exports.handlePending = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    twilio.send(alarm.get('sentFrom'), 'Modtaget,' + alarm.get('original'));
};

exports.handleAccepted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    twilio.send(alarm.get('sentFrom'), 'På vej,' + alarm.get('original'));
};

exports.handleArrived = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    twilio.send(alarm.get('sentFrom'), 'Fremme,' + alarm.get('original'));
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

    twilio.send(alarm.get('sentFrom'), 'Slut,' + alarm.get('original'));
};