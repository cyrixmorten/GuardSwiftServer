import * as exporter from 'highcharts-export-server';
import * as highcharts from 'highcharts';
import * as uuid from 'uuid/v4';
import * as _ from 'lodash';
import * as debounce from 'debounce-promise';
import * as fs from 'fs';

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
    // Specify the output filename
    outfile?: string;
}

export interface IPoolConfig {
    maxWorkers: number;          // (default 25) - max count of worker processes
    initialWorkers?: number;     // (default 5) - initial worker process count
    workLimit?: number;          // (default 50) - how many task can be performed by a worker process before it's automatically restarted
    queueSize?: number;          // (default 5) - how many request can be stored in overflow count when there are not enough workers to handle all requests
    timeoutThreshold?: number;   // (default 3500) - the maximum allowed time for each export job execution, in milliseconds. If a worker has been executing a job for longer than this period, it will be restarted
}

export interface IExportResult {
    data: string;
}

// https://www.npmjs.com/package/highcharts-export-server
export class HighchartsExporter {

    private que: DeferredExporter[] = [];
    private flushDebounced = debounce(this.flushQue, 100);

    constructor(
        public readonly exportOptions: IExportOptions, 
        private poolConfig: Partial<IPoolConfig> = {maxWorkers: 25}) {

        // Set up a pool of PhantomJS workers
        exporter.initPool(this.poolConfig);
    }


    private async flushQue() {

        const deferredExporters: DeferredExporter[] = _.take(this.que, this.poolConfig.maxWorkers);

        _.pullAll(this.que, deferredExporters);

        for (var i = 0; i < deferredExporters.length; i++) {
            await deferredExporters[i].execute();
        }


        if (this.que.length > 0) {
            await this.flushDebounced();
        } else {
            exporter.killPool();
        }
    }

    public async execute(highchartOptions: highcharts.Options): Promise<string> {

        const tmpdir = 'tmp';

        const deferred = new DeferredExporter(_.create(this.exportOptions, {
            options: highchartOptions,
            tmpdir,
            outfile: `${tmpdir}/highcharts/${uuid()}.${this.exportOptions.type}`
        }));

        this.que.push(deferred);

        await this.flushDebounced();

        return deferred.promise;
    }

}

class DeferredExporter {

    private _resolveSelf;
    private _rejectSelf;

    public readonly promise: Promise<string>

    constructor(public exportSettings: IExportOptions) {
      this.promise = new Promise( (resolve, reject) =>
        {
          this._resolveSelf = resolve
          this._rejectSelf = reject
        }
      )
    }

    public execute(): Promise<string> {
        exporter.export(this.exportSettings, async (err, res) => {
            if (err) {
                return this.reject(err);
            }


            if (res.filename && fs.existsSync(res.filename)) {
                res.data = fs.readFileSync(res.filename, 'utf8');
                fs.unlinkSync(res.filename);
            }

            this.resolve(res.data);
        });

        return this.promise;
    }
  
    private resolve(val:IExportResult) { this._resolveSelf(val) }
    private reject(reason:any) { 
        console.error(reason);
        this._rejectSelf(reason) 
    }
  
    [Symbol.toStringTag]: 'Promise'

} 