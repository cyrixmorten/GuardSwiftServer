import * as _ from 'lodash';
import { ICentralAlarmHandler } from "./central.interface";
import {Central} from "../../shared/subclass/Central";

export class RedningsRingenCentral implements ICentralAlarmHandler {

    getName() {
        return "Rednings-ringen";
    }

    matchesCentral(central: Central) {
        return central.name === this.getName();
    };


    parse(central, alarm) {
        console.log(this.getName(), "parsing alarm");
        const splitNewlines = _.compact(_.split(alarm, "\n"));
        const splitSeparator = _.map(splitNewlines, (value) => _.split(value, ";").map(_.trim));
        const alarmObj = _.fromPairs(splitSeparator);

        return {
            action: 'create',
            alarmMsg: alarm,
            alarmObject: {
                clientName: alarmObj["Navn"] || "?",
                clientId: alarmObj["HwId"] || "?",
                fullAddress: `${alarmObj["Adresse1"]},${alarmObj["Adresse2"]},${alarmObj["Postnummer"]},${alarmObj["By"]}`,
                priority: alarmObj["Sikr.niv."] || "?",
                signalStatus: alarmObj["Zone"] || "?",
                remarks: alarmObj["Bemarkning"] || "?",
                keybox: alarmObj["Forbikoblerkode"] || "?"
            }
        }

    };

    handlePending(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }

    };

    handleAccepted(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };

    handleArrived(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };

    handleAborted(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };

    handleFinished(alarm) {
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };
}