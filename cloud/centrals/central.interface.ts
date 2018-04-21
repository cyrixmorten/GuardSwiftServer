import {IParsedAlarm} from "../alarm/alarm.parse";
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