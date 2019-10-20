import { IDailyArrivalAutomationStatistics, IDayArrivalAutomationStatistics } from '../statistics/arrival.statistics.types';
import * as highcharts from 'highcharts';
import * as moment from 'moment';
import * as _ from 'lodash';

type DayStats = {
  dayOfWeek: number,
  manual: number,
  automatic: number
};

export class ManualAutomaticArrivalColumnChart {

    constructor(private data: IDailyArrivalAutomationStatistics) {}

    public getHighchartsOptions(): highcharts.Options {
        const {days} = this.data;
    
        const dayStats: DayStats[] = _.times(7, null).map((_val, i) => {
            const isoDayOfWeek = i + 1;
            const allMatchingDay = _.filter(days, (dailyStatistics: IDayArrivalAutomationStatistics) => dailyStatistics.dayOfWeek === isoDayOfWeek);

            return {
                dayOfWeek: isoDayOfWeek,
                manual: _.sumBy(allMatchingDay, (matchDay) => matchDay.statistics.count.manual) || 0,
                automatic: _.sumBy(allMatchingDay, (matchDay) => matchDay.statistics.count.automatic) || 0,
            };
        });


        return {
            chart: {
              type: 'column'
            },
            title: {
              text: ''
            },
            xAxis: {
              categories: _.times(7, null).map((_, i) => {
                // TODO take locale as parameter
                return moment(i, 'e').locale('dk').startOf('week').isoWeekday(i + 1).format('ddd');
              })
            },
            yAxis: {
              min: 0,
              title: {
                text: 'Antal ankomster'
              },
            },
            tooltip: {
              headerFormat: '<b>{point.x}</b><br/>',
              pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
            },
            plotOptions: {
              column: {
                stacking: 'normal',
                dataLabels: {
                  enabled: false
                }
              },
              series: {
                groupPadding: 0,
                pointPadding: 0.2,
                borderWidth: 0
              } as any
            },
            series: [{
              type: 'column',
              name: 'Manuelt', // TODO: translate 
              data: _.map(dayStats, (stats) => stats.manual),
              color: 'red'
            }, {
             type: 'column',
              name: 'Automatisk', // TODO: translate
              data: _.map(dayStats, (stats) => stats.automatic),
              color: 'green'
            }]
          }
    }
}