import {Central} from "../../shared/subclass/Central";
import {Task} from "../../shared/subclass/Task";

export interface ICentralParser {
    getName(): string;

    matchesCentral(central: Central): boolean;
    matchesAlarm(alarm: Task): boolean;

    parse(central, alarmMsg): IParsedAlarm;

    handlePending(alarm): void;

    handleAccepted(alarm): void;

    handleArrived(alarm): void;

    handleAborted(alarm): void;

    handleFinished(alarm): void;
}

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