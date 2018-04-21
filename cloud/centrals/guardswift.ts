/*
 * GUARDSWIFT CENTRAL
 */
import {ICentralParser, IParsedAlarm} from "./central.interface";
import {Central} from "../../shared/subclass/Central";
import {Task} from "../../shared/subclass/Task";


export class GuardswiftCentral implements ICentralParser{

    getName() {
        return "GuardSwift";
    }

    matchesCentral(central: Central) {
        return central.name === this.getName();
    };

    matchesAlarm(alarm: Task) {
        return alarm.centralName === this.getName();
    };


    parse(central, alarmMsg): IParsedAlarm {
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
    };

    handleAccepted(alarm) {
        console.log('GuardSwift handleAccepted', !this.matchesCentral(alarm));
    };

    handleArrived(alarm) {
        console.log('GuardSwift handleArrived', !this.matchesCentral(alarm));
    };

    handleAborted(alarm) {
        console.log('GuardSwift handleAborted', !this.matchesCentral(alarm));
    };

    handleFinished(alarm) {
        console.log('GuardSwift handleFinished', !this.matchesCentral(alarm));
    };
    
}

