import { TaskType } from '../subclass/Task';

export interface IClientArrivalAutomationStatistics {
    client: {
        id: string;
        name: string;
    },
    total: ITotalArrivalAutomationStatistics[];
    daily: IDailyArrivalAutomationStatistics[];
}

export interface ITotalArrivalAutomationStatistics {
    taskType: TaskType;
    statistics: IManualAutomaticArrivalStatistics;
}

export interface IDailyArrivalAutomationStatistics {
    taskType: TaskType;
    days: IDayArrivalAutomationStatistics[]
}

export interface IDayArrivalAutomationStatistics {
    dayOfWeek: number;
    statistics: IManualAutomaticArrivalStatistics;
}

export interface IManualAutomaticArrivalStatistics {
    total: number;
    count: IManualAutomatic;
    percentage: IManualAutomatic;
}

export interface IManualAutomatic {
    manual: number;
    automatic: number;
}