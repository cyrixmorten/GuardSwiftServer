import { IManualAutomaticArrivalStatistics } from '../statistics/arrival.statistics.types';
import * as highcharts from 'highcharts';

export class ManualAutomaticArrivalPieChart {

    constructor(private data: IManualAutomaticArrivalStatistics) {}

    public getHighchartsOptions(): highcharts.Options {
        const {total, percentage} = this.data;
    
        return {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: null
            },
            subtitle: {
                text: 'Total: ' + total // TODO: translate
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            },
            series: [{
                type: 'pie',
                name: 'Ankomster', // TODO: translate
                data: [{
                    name: 'Manuelt', // TODO translate
                    y: percentage.manual,
                }, {
                    name: 'Automatisk', // TODO translate
                    y: percentage.automatic,
                    sliced: true,
                    selected: true
                }]
            }]
        }
    }
}