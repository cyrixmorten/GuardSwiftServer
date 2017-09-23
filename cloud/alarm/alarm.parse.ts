import * as _ from 'lodash';
import {centrals} from "../centrals/all";

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

