import * as _ from 'lodash';
import {CentralParser} from "../centrals/all";
import {Central} from "../../shared/subclass/Central";
import {ICentralParser} from "../centrals/central.interface";

export interface IParsedAlarm {
    action: 'create' | 'abort' | 'finish',
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

export let parseAlarm = async (central: Central, alarmMsg: string): Promise<IParsedAlarm> => {

    _.forEach(CentralParser, (handler: ICentralParser) => {
        if (handler.matchesCentral(central)) {
            return handler.parse(central, alarmMsg) || {};
        }
    });

   throw 'Unable to parse alarm, did not find central matching sender';
};

