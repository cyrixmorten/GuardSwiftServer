import * as _ from 'lodash';
import {centrals} from "../centrals/all";


export interface IParsedAlarm {
    action: string,
    alarmMsg: string,
    alarmObject: {
        clientId: string;
        clientName: string,
        fullAddress: string,
        priority: string,
        signalStatus: string,
        remarks: string,
        keybox: string
    }
}

export let parseAlarm = function(central, alarmMsg) {

    let promise = new Parse.Promise();

    let alarmObject = {};
    _.forEach(centrals, function(handler) {
        if (_.isEmpty(alarmObject)) {
            alarmObject = handler.parse(central, alarmMsg) || {};
        }
    });

    if (_.isEmpty(alarmObject)) {
        promise.reject('Unable to parse alarm, unknown sender');
    } else {
        console.log('alarmObject: ', alarmObject);
        promise.resolve(alarmObject);
    }


    return promise;
};

