var twilio = require('../../api/twilio');

var matchesCentral = function(alarm) {
    return alarm.get('centralName') === 'G4S'
};

exports.parse = function(alarm, alarmMsg) {
    if (!matchesCentral(alarm)) {
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

exports.handleAccepted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

    var originalAlarmMsg = alarm.get('original');

    _.forEach(alarm.get('sendFrom'), function(centralNumber) {
        twilio.send(centralNumber, 'På vej,' + originalAlarmMsg);
    });


};

exports.handleArrived = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }


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


};