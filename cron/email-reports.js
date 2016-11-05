var http = require('http-request');
var CronJob = require('cron').CronJob;

exports.start = function () {
    console.log('Starting cron job: reports-mail');

    console.log(' - job scheduled to run every day at 9:00');

    var job = new CronJob({
        //   +----------- Seconds (0-59)
        //   | +--------- Minute (0-59)                    | Output Dumper: >/dev/null 2>&1
        //   | | +------- Hour (0-23)                      | Multiple Values Use Commas: 3,12,47
        //   | | | +----- Day Of Month (1-31)              | Do every X intervals: */X  -> Example: */15 * * * *  Is every 15 minutes
        //   | | | | +--- Month (1 -12)                    | Aliases: @reboot -> Run once at startup; @hourly -> 0 * * * *;
        //   | | | | | +- Day Of Week (0-6) (Sunday = 0)   | @daily -> 0 0 * * *; @weekly -> 0 0 * * 0; @monthly ->0 0 1 * *;
        //   | | | | | |                                   | @yearly -> 0 0 1 1 *;
        //   * * * * * *
        cronTime: '0 0 9 * * *',
        onTick: function () {
            http.post({
                url: process.env.SERVER_URL + '/jobs/dailyMailReports',
                headers: {
                    'X-Parse-Application-Id': process.env.APP_ID,
                    'X-Parse-Master-Key': process.env.MASTER_KEY,
                    'Content-Type': "application/json"
                }
            }, function (err, res) {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log(res.code, res.headers, res.file);
            });
        },
        start: false,
        timeZone: 'Europe/Copenhagen'
    });
    job.start();
};