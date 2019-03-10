import * as _ from 'lodash';
import { centralAlarmHandlers } from "../centrals/all";
import { ICentralAlarmHandler } from '../centrals/central.interface';


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

export let parseAlarm = async (central, alarmMsg): Promise<any> => {

    _.forEach(centralAlarmHandlers,  (handler: ICentralAlarmHandler) => {
        if (handler.matchesCentral(central)) {
            return handler.parse(central, alarmMsg) || {};
        }
    });

    throw 'Unable to parse alarm, unknown sender';

};

