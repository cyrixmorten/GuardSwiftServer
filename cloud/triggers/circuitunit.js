Parse.Cloud.beforeSave("CircuitUnit", function (request, response) {

    var CircuitUnit = request.object;

    // Set default values
    if (!CircuitUnit.has('highPriority')) {
        CircuitUnit.set('highPriority', false);
    }

    if (!CircuitUnit.has('timeStarted')) {
        CircuitUnit.set('timeStarted', new Date(1970));
    }

    if (!CircuitUnit.has('timeEnded')) {
        CircuitUnit.set('timeEnded', new Date(1970));
    }

    // inherit client position
    var clientPointer = CircuitUnit.get('client');
    if (clientPointer) {
        clientPointer.fetch().then(function (client) {
            CircuitUnit.set('clientId', client.get('clientId'));
            CircuitUnit.set('clientName', client.get('name'));
            CircuitUnit.set('clientPosition', client.get('position'));
            response.success();
        }, function (error) {
            console.error("error at clientPointer " + error.message);
            response.success();
        });
    } else {
        response.success();
    }

});