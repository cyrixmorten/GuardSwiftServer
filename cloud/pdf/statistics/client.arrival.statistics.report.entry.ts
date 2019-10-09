import { IClientArrivalAutomationStatistics } from '../../../shared/statistics/arrival.statistics.types';
import { HighchartsExporter } from '../../utils/highcharts.exporter';
import { TaskType } from '../../../shared/subclass/Task';

export class ClientArrivalReportEntry {

    constructor(
        private clientArrivalStatistics: IClientArrivalAutomationStatistics, 
        private exporter: HighchartsExporter) {}

    private getHeader() {
        const {client} = this.clientArrivalStatistics;

        return {text: client.name, style: 'header'};
    }

    private getTaskTypeRow(taskType: TaskType) {
        return ['Gående', 'Sample value 2', 'Sample value 3'];
    }

}