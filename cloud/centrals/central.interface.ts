import {IParsedAlarm} from "../alarm/alarm.parse";

export interface ICentralParser {
    getName(): string;
    matchesCentral(alarmOrCentral): boolean;

    parse(central, alarmMsg): IParsedAlarm;

    handlePending(alarm): void;

    handleAccepted(alarm): void;

    handleArrived(alarm): void;

    handleAborted(alarm): void;

    handleFinished(alarm): void;
}