/*
 * GUARDSWIFT CENTRAL
 */
var _ = require('lodash');
var cpsms = require('../../api/cpsms');

var matchesCentral = function (alarm) {
    return alarm.get('centralName') === 'GuardSwift'
};


exports.parse = function (alarm, alarmMsg) {
    console.log('matchesCentral(alarm): ', matchesCentral(alarm));
    if (!matchesCentral(alarm)) {
        return;
    }


    return {
        alarmMsg: 'Test alarm, Ryttervej 16 6600 Vejen, A, Indbrud, Hund, Bag døren',
        alarmObject: {
            clientName: 'Test alarm',
            fullAddress: 'Ryttervej 16 6600 Vejen',
            priority: 'A',
            signalStatus: 'Indbrud',
            remarks: 'Hund',
            keybox: 'Bag døren'
        }
    }

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