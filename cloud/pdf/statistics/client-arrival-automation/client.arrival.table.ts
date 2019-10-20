import { IClientArrivalAutomationStatistics, ITotalArrivalAutomationStatistics, IDailyArrivalAutomationStatistics } from '../../../../shared/statistics/arrival.statistics.types';
import { HighchartsExporter } from '../../../utils/highcharts.exporter';
import { TaskType } from '../../../../shared/subclass/Task';
import { ManualAutomaticArrivalPieChart } from '../../../../shared/highcharts/manual.automatic.pie.chart';
import * as _ from 'lodash';
import { ManualAutomaticArrivalColumnChart } from '../../../../shared/highcharts/manual.automatic.column.chart';

export class ClientArrivalReportTable {

    constructor(
        private clientArrivalStatistics: IClientArrivalAutomationStatistics, 
        private exporter: HighchartsExporter) {}

    public async getTable() {

        const taskTypes = _.map(this.clientArrivalStatistics.total, (stats) => stats.taskType);

        return {
            unbreakable: true,
            stack: [
                this.getHeader(),
                {
                    margin: [0, 0, 0, 15],
                    table: {
                        widths: [75, '*', '*'],
                        body: [
                            ... await Promise.all(_.map(taskTypes, (taskType) => {
                               return this.getTaskTypeRow(taskType) 
                            }))
                        ],
                    },
                    layout: 'lightHorizontalLines'
                }
            ]
        }
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

        const dailyStatistics = _.find(daily, (stats: IDailyArrivalAutomationStatistics) => {
            return stats.taskType === taskType;
        });

        const totalStatistics = _.find(total, (stats: ITotalArrivalAutomationStatistics) => {
            return stats.taskType === taskType;
        }).statistics;

        const taskTypeName = taskType === TaskType.REGULAR ? 'Gående' : 'Kørende'; // TODO: translate

        return [taskTypeName, {
            width: 200,
            margin: [0, 20],
            image: `data:image/${this.exporter.exportOptions.type};base64,` + await this.exporter.execute(
                new ManualAutomaticArrivalColumnChart(dailyStatistics).getHighchartsOptions()
            )
        }, {
            width: 150,
            margin: [0, 25],
            image: `data:image/${this.exporter.exportOptions.type};base64,` + await this.exporter.execute(
                new ManualAutomaticArrivalPieChart(totalStatistics).getHighchartsOptions()
            )
        }];
    }

}