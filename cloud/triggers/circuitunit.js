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

        console.log('clientPointer: ', clientPointer);

        clientPointer.fetch({ useMasterKey: true }).then(function (client) {
            console.log('client: ', client);
            CircuitUnit.set('clientId', client.get('clientId'));
            CircuitUnit.set('clientName', client.get('name'));
            CircuitUnit.set('clientPosition', client.get('position'));
            response.success();
        }).fail(function(error) {
            console.error('Failed to fetch clientPointer: ' + clientPointer);
            response.success();
        });
    } else {
        response.success();
    }

});