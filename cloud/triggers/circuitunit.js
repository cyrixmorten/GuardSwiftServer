Parse.Cloud.beforeSave("CircuitUnit", function (request, response) {

    var CircuitUnit = request.object;

    // client pointer has been updated
    // if (!CircuitUnit.isNew() && CircuitUnit.dirty('client')) {
    //     // and is empty
    //     if (!CircuitUnit.get('client')) {
    //         response.error('Not allowed to delete client pointer');
    //         return;
    //     }
    // }

    // Set default values
    if (!CircuitUnit.has('supervisions')) {
        CircuitUnit.set('supervisions', 1);
    }

    if (!CircuitUnit.has('timesArrived')) {
        CircuitUnit.set('timesArrived', 0);
    }

    if (!CircuitUnit.has('timeStarted')) {
        CircuitUnit.set('timeStarted', new Date(1970));
    }

    if (!CircuitUnit.has('timeEnded')) {
        CircuitUnit.set('timeEnded', new Date(1970));
    }

    if (!CircuitUnit.get('isRaid')) {
        CircuitUnit.set('taskType', 'Regular');
    } else {
        CircuitUnit.set('taskType', 'Driving');
    }

    // inherit client position
    var hasPosition = CircuitUnit.has('clientPosition');
    var clientPointer = CircuitUnit.get('client');


    // console.log('clientPointer', clientPointer);
    //
    // // TODO Update task positions in client afterSave

    if (clientPointer && !hasPosition) {
        clientPointer.fetch({useMasterKey: true}).then(function (client) {
            CircuitUnit.set('clientId', client.get('clientId'));
            CircuitUnit.set('clientName', client.get('name'));
            CircuitUnit.set('clientPosition', client.get('position'));
            response.success();
        }).fail(function (error) {
            console.error('Failed to fetch clientPointer: ' + clientPointer);
            response.success();
        });
    } else {
        response.success();
    }

});