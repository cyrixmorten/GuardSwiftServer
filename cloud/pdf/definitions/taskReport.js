var _ = require('lodash');

var regularReport = require('./regularReport.js');
var districtReport = require('./districtReport.js');
var staticReport = require('./staticReport.js');


var reportUtils = require('../reportUtils.js');

var fetchReportSettings = function (report) {

    var getSettingsColumn = function() {
        var taskType = report.get('taskTypeName');
        if (taskType === 'ALARM') {
            return 'regularReportSettings';
        }
        if (taskType === 'REGULAR') {
            return 'regularReportSettings';
        }
        if (taskType === 'DISTRICTWATCH') {
            return 'districtReportSettings';
        }
        if (taskType === 'STATIC') {
            return 'staticReportSettings';
        }
    };

    var fetchReportSettings = function () {
        var settingsCol = getSettingsColumn();

        console.log('settingsCol: ' + settingsCol);

        if (_.isEmpty(settingsCol)) {
            return new Parse.Promise.error('No definition matching report');
        }

        return reportUtils.fetchUser(report).then(function (user) {
            return user.get(settingsCol).fetch({ useMasterKey: true });
        });
    };


    return fetchReportSettings()
};

exports.createDoc = function (report) {

    var timeZone;
    
    return reportUtils.fetchUser(report)
        .then(function(user) {
        
            timeZone = (user.has('timeZone')) ? user.get('timeZone') : 'Europe/Copenhagen';
        
            return fetchReportSettings(report);
        })
        .then(function(settings) {
            if (report.has('task')) {
                return regularReport.createDoc(report, settings, timeZone);
            }
            if (report.has('circuitUnit')) {
                return regularReport.createDoc(report, settings, timeZone);
            }
            if (report.has('districtWatchUnit')) {
                return districtReport.createDoc(report, settings, timeZone);
            }
            if (report.has('staticTask')) {
                return staticReport.createDoc(report, settings, timeZone);
            }
        });



};