/*
 * GUARDSWIFT CENTRAL
 */
import * as _ from 'lodash';
import {ICentralParser} from "./central.interface";
import {IParsedAlarm} from "../alarm/alarm.parse";
let cpsms = require('../../api/cpsms');


export class GuardswiftCentral implements ICentralParser{

    getName() {
        return "GuardSwift";
    }

    matchesCentral(alarmOrCentral) {

        let centralName =  alarmOrCentral.has('taskType') ? alarmOrCentral.get('centralName') : alarmOrCentral.get('name');

        return centralName === this.getName();
    };


    parse(central, alarmMsg): IParsedAlarm {
        console.log('matchesCentral(alarm): ', this.matchesCentral(central));
        if (!this.matchesCentral(central)) {
            return;
        }


        return {
            action: 'create',
            alarmMsg: 'Test alarm, Ryttervej 16 6600 Vejen, A, Indbrud, Hund, Bag døren',
            alarmObject: {
                clientId: 'Test',
                clientName: 'Test alarm',
                fullAddress: 'Ryttervej 16 6600 Vejen',
                priority: 'A',
                signalStatus: 'Indbrud',
                remarks: 'Hund',
                keybox: 'Bag døren'
            }
        }

    };


    handlePending(alarm) {
        console.log('GuardSwift handlePending', !this.matchesCentral(alarm));
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };

    handleAccepted(alarm) {
        console.log('GuardSwift handleAccepted', !this.matchesCentral(alarm));
        if (!this.matchesCentral(alarm)) {
            return;
        }

    };

    handleArrived(alarm) {
        console.log('GuardSwift handleArrived', !this.matchesCentral(alarm));
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };

    handleAborted(alarm) {
        console.log('GuardSwift handleAborted', !this.matchesCentral(alarm));
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };

    handleFinished(alarm) {
        console.log('GuardSwift handleFinished', !this.matchesCentral(alarm));
        if (!this.matchesCentral(alarm)) {
            return;
        }
    };
    
}

