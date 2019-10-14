import { IClientArrivalAutomationStatistics, ITotalArrivalAutomationStatistics } from '../../../../shared/statistics/arrival.statistics.types';
import { HighchartsExporter } from '../../../utils/highcharts.exporter';
import { TaskType } from '../../../../shared/subclass/Task';
import { ManualAutomaticArrivalPieChart } from '../../../../shared/highcharts/manual.automatic.piechart';
import * as _ from 'lodash';

export class ClientArrivalReportTable {

    constructor(
        private clientArrivalStatistics: IClientArrivalAutomationStatistics, 
        private exporter: HighchartsExporter) {}

    public async getTable() {

        const taskTypes = _.map(this.clientArrivalStatistics.total, (stats) => stats.taskType);

        return [
            this.getHeader(),
            {
                margin: [0, 0, 0, 15],
                table: {
                    widths: [75, '*', '*'],
                    body: [
                        ['', '', ''],
                        _.flatten(await Promise.all(_.map(taskTypes, (taskType) => {
                           return this.getTaskTypeRow(taskType) 
                        })))
                    ]
                },
                layout: 'lightHorizontalLines'
            }
        ]
    }

    private getHeader() {
        const {client} = this.clientArrivalStatistics;

        return {
            text: client.name, 			
            fontSize: 18,
			bold: true,
            margin: [0, 0, 0, 5]
        };
    }

    private async getTaskTypeRow(taskType: TaskType) {
        const {daily, total} = this.clientArrivalStatistics;

        const dailyStatistics = _.find(daily, (stats: ITotalArrivalAutomationStatistics) => {
            return stats.taskType === taskType;
        });

        const totalStatistics = _.find(total, (stats: ITotalArrivalAutomationStatistics) => {
            return stats.taskType === taskType;
        });

        const pieChartOptions = new ManualAutomaticArrivalPieChart(totalStatistics.statistics).getHighchartsOptions();

        const taskTypeName = taskType === TaskType.REGULAR ? 'Gående' : 'Kørende'; // TODO: translate

        return [taskTypeName, '', {
            width: 150,
            image: `data:image/${this.exporter.exportOptions.type};base64,` + await this.exporter.execute(pieChartOptions)
        }];
    }

}