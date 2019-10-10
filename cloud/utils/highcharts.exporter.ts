import * as exporter from 'highcharts-export-server';
import * as highcharts from 'highcharts';
import * as fs from 'fs';
import * as uuid from 'uuid/v4';
import * as _ from 'lodash';

export type ExportType = 'png' | 'jpeg' | 'pdf' | 'svg';

export interface IExportOptions {
    type: ExportType;
    // The scale factor. Use it to improve resolution in PNG and JPG, 
    // for example setting scale to 2 on a 600px chart will result in a 1200px output
    scale?: number;
    // The chart width (overrides scale),
    width?: number;
    // A JSON object with options to be passed to Highcharts.setOptions
    globalOptions?: highcharts.GlobalOptions;
    // Passed to Highcharts.data(..)
    dataOptions?: Object;
}

export interface IPoolConfig {
    maxWorkers: number;          // (default 25) - max count of worker processes
    initialWorkers?: number;     // (default 5) - initial worker process count
    workLimit?: number;          // (default 50) - how many task can be performed by a worker process before it's automatically restarted
    queueSize?: number;          // (default 5) - how many request can be stored in overflow count when there are not enough workers to handle all requests
    timeoutThreshold?: number;   // (default 3500) - the maximum allowed time for each export job execution, in milliseconds. If a worker has been executing a job for longer than this period, it will be restarted
}

export interface IHighchartOptionWithId extends highcharts.Options {
    id?: string; // id added to result
}

export interface IExportResult {
    id?: string;
    data: string;
}

// https://www.npmjs.com/package/highcharts-export-server
export class HighchartsExporter {

    constructor(
        private exportOptions: IExportOptions, 
        private poolConfig: Partial<IPoolConfig> = {maxWorkers: 25}) {

        // Set up a pool of PhantomJS workers
        exporter.initPool(this.poolConfig);

    }

    public done() {
        // Kill the pool when we're done with it
        exporter.killPool();
    }

    public async executeBatch(highchartOptions: IHighchartOptionWithId[]): Promise<IExportResult[]> {

        const results = [];
        const batches: IHighchartOptionWithId[][] = _.chunk(highchartOptions, this.poolConfig.maxWorkers);

        for (let i = 0; i < batches.length; i++) {
            const batch: IHighchartOptionWithId[] = batches[i];

            results.push(
                await Promise.all(batch.map((highchartOption) => {
                    return this.execute(highchartOption);
                }))
            )
        }

        return _.flatten(results);
    }

    public async execute(highchartOptions: IHighchartOptionWithId): Promise<IExportResult> {

        const exportSettings = Object.assign(this.exportOptions, {
            options: highchartOptions,
            tmpdir: 'tmp',
            outfile: `tmp/${uuid()}.${this.exportOptions.type}`
        });

        return new Promise((resolve, reject) => {
            exporter.export(exportSettings, (err, res) => {
                if (err) return reject(err);

                if (res.filename) {
                    res.data = fs.readFileSync(res.filename, 'utf8');
                    fs.unlinkSync(res.filename);
                }

                resolve(Object.assign(res, {id: highchartOptions.id}));
            });
        })
    }
}