export interface ICentral {
    getName(): string;
    matchesCentral(alarmOrCentral): boolean;

    parse(central, alarmMsg): Object;

    handlePending(alarm): void;

    handleAccepted(alarm): void;

    handleArrived(alarm): void;

    handleAborted(alarm): void;

    handleFinished(alarm): void;
}