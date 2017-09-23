/*
 * GUARDSWIFT CENTRAL
 */
import * as _ from 'lodash';
let cpsms = require('../../api/cpsms');



let matchesCentral = function (alarmOrCentral) {

    let centralName =  alarmOrCentral.has('taskType') ? alarmOrCentral.get('centralName') : alarmOrCentral.get('name');

    return centralName === 'GuardSwift'
};


export let parse = function (central, alarmMsg) {
    console.log('matchesCentral(alarm): ', matchesCentral(central));
    if (!matchesCentral(central)) {
        return;
    }


    return {
        action: 'create',
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


export let handlePending = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
};

export let handleAccepted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }

};

export let handleArrived = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
};

export let handleAborted = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
};

export let handleFinished = function (alarm) {
    if (!matchesCentral(alarm)) {
        return;
    }
};