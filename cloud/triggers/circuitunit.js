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


});