import { IManualAutomaticArrivalStatistics } from '../statistics/arrival.statistics.types';

export class ManualAutomaticArrivalPieChart {

    constructor(private data: IManualAutomaticArrivalStatistics) {}

    public getHighchartsOptions() {
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
                name: 'Ankomster', // TODO: translate
                colorByPoint: true,
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