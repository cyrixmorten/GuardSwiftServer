var Mail = require("../utils/mailing.js");

Parse.Cloud.beforeSave("Task", function (request, response) {
    
    var Task = request.object;

    if (Task.isNew()) {
        Task.set('isArrived', false);
        Task.set('isAborted', false);
        Task.set('isFinished', false);
        Task.set('timeStarted', new Date(1970));
        Task.set('timeEnded', new Date(1970));
    }

    response.success();
    
});

// exports.sendTextEmail = function(to, replyto, subject, mail, from) {
Parse.Cloud.afterSave("Task", function (request) {

    var Task = request.object;

    var taskType = Task.get('taskType');

    if (taskType === 'Alarm') {

        var arrived = Task.get('isArrived');
        var aborted = Task.get('isAborted');
        var finished = Task.get('isFinished');

        var title = '';

        if (arrived) {
            title = 'Alarm - vægter ankommet'
        }
        if (aborted) {
            title = 'Alarm - afbrudt';
        }
        if (finished) {
            title = 'Alarm - afsluttet';
        }

        title = title || 'Ny alarm';

        // sendAlarm(Task, title);

    }

});

var sendAlarm = function (Task, title) {
    var clientName = Task.get('clientName');

    var street = Task.get('street');
    var streetNumber = Task.get('streetNumber');
    var postalCode = Task.get('postalCode');
    var city = Task.get('city');
    var fullAddress = Task.get('fullAddress');

    var securityLevel = Task.get('securityLevel');
    var keybox = Task.get('keybox');
    var remarks = Task.get('remarks');


    var body = '';
    body += title;
    body += '\n\n';
    body += 'Kunde: ' + clientName + '\n';
    body += 'Vej: ' + street + '\n';
    body += 'Vejnummer: ' + streetNumber + '\n';
    body += 'Postnummer: ' + postalCode + '\n';
    body += 'By: ' + city + '\n';
    body += '\n\n';
    body += 'Sikkerheds niveau: ' + securityLevel + '\n';
    body += 'Nøgleboks: ' + keybox + '\n';
    body += 'Bemærkninger: ' + remarks + '\n';


    Mail.sendTextEmail('cyrixmorten@gmail.com', 'alarm@guardswift.com', title, body);
};