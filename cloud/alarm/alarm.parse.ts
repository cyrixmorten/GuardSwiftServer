import * as _ from 'lodash';
import {CentralParsers} from "../centrals/all";
import {Central} from "../../shared/subclass/Central";
import {ICentralParser, IParsedAlarm} from "../centrals/central.interface";
import {Task} from "../../shared/subclass/Task";



export let parseAlarm = async (central: Central, alarmMsg: string): Promise<IParsedAlarm> => {
    return findCentralParserMatchingCentral(central).parse(central, alarmMsg);
};

export let findCentralParserMatchingCentral = (central: Central): ICentralParser => {

    console.log('findCentralParserMatchingCentral: ', central.name);

    let centralParser: ICentralParser;
    _.forEach(CentralParsers, (handler: ICentralParser) => {

        console.log('handler.getName(): ', handler.getName());

        if (handler.matchesCentral(central)) {
            centralParser = handler;
        }
    });

    if (centralParser) {
        return centralParser;
    }

    throw 'Unable to find central parser matching central';
};

export let findCentralParserMatchingAlarm = (alarm: Task): ICentralParser => {

    console.log('findCentralParserMatchingAlarm: ', alarm.centralName);

    let centralParser: ICentralParser;
    _.forEach(CentralParsers, (handler: ICentralParser) => {
        if (handler.matchesAlarm(alarm)) {
            centralParser = handler;
        }
    });

    if (centralParser) {
        return centralParser;
    }

    throw 'Unable to find central parser matching alarm';
};

