import * as _ from 'lodash';
import { centralAlarmHandlers } from "../centrals/all";
import {Central} from "../../shared/subclass/Central";


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

export const parseAlarm = async (central: Central, alarm: string): Promise<any> => {

    const handlerMatchingCentral = _.find(centralAlarmHandlers, (handler) => handler.matchesCentral(central));

    if (!handlerMatchingCentral) {
        throw 'Unable to parse alarm, unknown central';
    }

    return handlerMatchingCentral.parse(central, alarm);

};

