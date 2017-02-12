var _ = require('lodash');


Parse.Cloud.job("forceResetTasks", function(request, status) {
    return Parse.Cloud.httpRequest({
        method: "POST",
        url: process.env.SERVER_URL + '/jobs/resetTasks',
        headers: {
			'X-Parse-Application-Id': process.env.APP_ID,
			'X-Parse-Master-Key': process.env.MASTER_KEY,
            'Content-Type': "application/json"
        },
        body: {
           'forceUpdate': true
        }
    })
	.then(function () {
		status.success("Successfully forced reset of all tasks");
	})
	.fail(function(error) {
        console.error(error);
		status.error(error.message);
	});
});

Parse.Cloud.job("resetTasks", function (request, status) {

    console.log('----');
    console.log('- resetAllTasks');
    console.log('----\n\n');
    var forceUpdate = request.params.forceUpdate;
 

    var now = new Date();
    var now_dayOfWeek = now.getDay();
    var now_hour = now.getHours();

    console.log("manageActiveCircuitsStarted day: " + now_dayOfWeek + " hour: "
        + now_hour + " forced update: " + (forceUpdate == true));

    var promises = [];

    var districtPromise = manageDistrictWatches(now_dayOfWeek, now_hour, forceUpdate);
    var circuitPromise = manageCircuits(now_dayOfWeek, now_hour, forceUpdate);

    promises.push(districtPromise);
    promises.push(circuitPromise);

    Parse.Promise.when(promises).then(function () {
        // // All tasks completed
        console.log("all done");
        status.success("completed successfully");
    }, function (error) {
        console.error("failed - " + error.message);
        status.error("an error occurred: " + JSON.stringify(error));
    });

});

Parse.Cloud.define("createCircuitStarted", function (request, response) {
    var objectId = request.params.objectId;
    var Circuit = Parse.Object.extend("Circuit");
    var query = new Parse.Query(Circuit);
    query.get({ useMasterKey: true }, objectId).then(function (circuit) {
        createCircuitStarted(circuit).then(function () {
            response.success("Successfully created circuitStarted");
        }, function (error) {
            response.error(error.message);
        });
    }, function (error) {
        response.error(error.message);
    });

});

Parse.Cloud.define("createDistrictWatchStarted", function (request, response) {
    var objectId = request.params.objectId;
    var DistrictWatch = Parse.Object.extend("DistrictWatch");
    var query = new Parse.Query(DistrictWatch);
    query.get({ useMasterKey: true }, objectId).then(function (districtWatch) {
        createDistrictWatchStarted(districtWatch).then(function () {
            response.success("Successfully created districtWatch");
        }, function (error) {
            response.error(error.message);
        });
    }, function (error) {
        response.error(error.message);
    });

});

var manageCircuits = function (now_dayOfWeek, now_hour, forceUpdate) {

    var promise = new Parse.Promise();

    var queryCircuits = new Parse.Query("Circuit");
    if (!forceUpdate) {
        queryCircuits.notEqualTo('createdDay', now_dayOfWeek);
    }
    queryCircuits.doesNotExist('archive');
    queryCircuits.find({ useMasterKey: true }).then(
        function (circuits) {
            console.log("found circuits " + circuits.length);

            if (circuits.length == 0)
                return Parse.Promise.as();

            var promises = [];

            // for each Circuit
            circuits.forEach(function (circuit) {

                var days = circuit.get('days');
                // if run today
                if (_.includes(days, now_dayOfWeek)) {
                    // adjust time according to timeZone
                    var timeResetDate = circuit.get('timeResetDate');
                    var timeEnd = timeResetDate.getHours();

                    var hours_to_restart = timeEnd - now_hour;

                    console.log(" -- | "
                        + circuit.get('name')
                        + " | --");
                    console.log("Restart hour: "
                        + timeEnd + " now hour: "
                        + now_hour);
                    console.log("Restarting in "
                        + hours_to_restart
                        + " hour(s)");

                    /*
                     * Optimizing halt conditions Avoids a
                     * query and inspection of child
                     * CircuitStarted Time to restart or
                     * newly created
                     */
                    if (forceUpdate || hours_to_restart == 0
                        || !circuit.has('createdDay')) {
                        // CircuitStarted matching Circuit
                        var circuitsStartedPromise = new Parse.Promise();

                        findActiveCircuitStartedMatching(
                            circuit).then(
                            function (circuitsStarted) {

                                // perform
                                // restart

                                var promise = Parse.Promise.as();

                                promise = promise.then(
                                    function () {
                                        console.log(" ** RESTARTING CIRCUIT " + circuit.get('name') + " **");
                                        console.log('Closing ...');
                                        return closeCircuitsStarted(circuitsStarted);
                                    }).then(function () {
                                        console.log('Creating ...');
                                        return createCircuitStarted(circuit);
                                    });

                                return promise;

                            }).then(
                            function () {
                                // save/update
                                // complete
                                circuitsStartedPromise.resolve('save/update complete - circuit');
                            },
                            function (error) {
                                console.error(error.message);
                                circuitsStartedPromise.reject(error);
                            });

                        promises.push(circuitsStartedPromise);

                    } else {
                        // Do nothing
                        console.log(" -- | DO NOTHING | -- \n\n");
                    }

                } else {
                    console.log("Not run today: "
                        + now_dayOfWeek + " days: "
                        + days);
                    var closePromise = closeCircuitStartedMatching(circuit);
                    promises.push(closePromise);
                }

            });

            // Return a new promise that is resolved when all of the
            // async tasks are finished.
            return Parse.Promise.when(promises);

        }).then(function () {
        console.log("manageCircuits done");
        promise.resolve('reset circuits done');
    }, function (error) {
        console.error("manageCircuits " + error.message);
        promise.reject(error);
    });

    return promise;
};

var manageDistrictWatches = function (now_dayOfWeek, now_hour, forceUpdate) {

    var promise = new Parse.Promise();

    var queryDistrictWatches = new Parse.Query("DistrictWatch");
    if (!forceUpdate) {
        queryDistrictWatches.notEqualTo('createdDay', now_dayOfWeek);
    }
    queryDistrictWatches.doesNotExist('archive');
    queryDistrictWatches.find({ useMasterKey: true }).then(
        function (districtWatches) {
            console.log("found districtWatches "
                + districtWatches.length);

            if (districtWatches.length == 0)
                return Parse.Promise.as();

            var promises = [];

            // for each Circuit
            districtWatches.forEach(function (districtWatch) {

                var days = districtWatch.get('days');
                // if run today
                if (_.includes(days, now_dayOfWeek)) {
                    // adjust time according to timeZone

                    var timeResetDate = districtWatch.get('timeResetDate');
                    var timeEnd = timeResetDate.getHours();
                    var hours_to_restart = timeEnd - now_hour;

                    console.log(" -- | "
                        + districtWatch.get('name')
                        + " | --");
                    console.log("Restart hour: "
                        + timeEnd + " now hour: "
                        + now_hour);
                    console.log("Restarting in "
                        + hours_to_restart
                        + " hour(s)");

                    /*
                     * Optimizing halt conditions Avoids a
                     * query and inspection of child
                     * DistrictWatchStarted Time to restart
                     * or newly created
                     */
                    if (forceUpdate || hours_to_restart == 0
                        || !districtWatch.has('createdDay')) {
                        // CircuitStarted matching Circuit
                        var districtWatchesStartedPromise = new Parse.Promise();
                        activeDistrictWatchStartedMatching(
                            districtWatch).then(
                            function (districtWatchStarted) {

                                // perform
                                // restart
                                var promise = Parse.Promise.as();

                                promise = promise.then(
                                    function () {
                                        console.log(" ** RESTARTING DISTRICTWATCH "
                                            + districtWatch.get('name')
                                            + "**");
                                        return closeDistrictWatchesStarted(districtWatchStarted);
                                    }).then(
                                    function () {
                                        return createDistrictWatchStarted(districtWatch);
                                    });

                                return promise;

                            }).then(
                            function () {
                                // save/update
                                // complete
                                districtWatchesStartedPromise.resolve('save/update complete - districtWatch');
                            },
                            function (error) {
                                console.error(error.message);
                                districtWatchesStartedPromise.reject(error);
                            });

                        promises.push(districtWatchesStartedPromise);

                    } else {
                        // Do nothing
                        console.log(" -- | DO NOTHING | -- \n\n");
                    }

                } else {
                    console.log("Not run today: "
                        + now_dayOfWeek + " days: "
                        + days);
                    var closePromise = closeDistrictWatchesStartedMatching(districtWatch);
                    promises.push(closePromise);
                }
                ;

            });

            return Parse.Promise.when(promises);

        }).then(function () {
        console.log("manageDistrictWatches done");
        promise.resolve('reset districtwatches done');
    }, function (error) {
        console.error("manageDistrictWatches " + error.message);
        promise.reject(error);
    });

    return promise;
};

var closeCircuitStartedMatching = function (circuit) {

    return findActiveCircuitStartedMatching(circuit).then(
        function (circuitsStarted) {
            return closeCircuitsStarted(circuitsStarted);
        });
};

var closeCircuitsStarted = function (circuitsStarted) {
    if (circuitsStarted.length == 0) {
        return Parse.Promise.as();
    }

    var promises = [];
    circuitsStarted.forEach(function (circuitStarted) {
        circuitStarted.set('timeEnded', new Date());
        promises.push(circuitStarted.save(null, { useMasterKey: true }));
    });

    console.log('promises.length: ', promises.length);
    
    return Parse.Promise.when(promises);
};

var closeDistrictWatchesStartedMatching = function (districtWatch) {

    return activeDistrictWatchStartedMatching(districtWatch).then(
        function (districtWatchesStarted) {
            return closeDistrictWatchesStarted(districtWatchesStarted);
        });
};

var closeDistrictWatchesStarted = function (districtWatchesStarted) {
    if (districtWatchesStarted.length == 0)
        return Parse.Promise.as();

    var promises = [];
    districtWatchesStarted.forEach(function (districtWatchStarted) {
        districtWatchStarted.set('timeEnded', new Date());
        promises.push(districtWatchStarted.save(null, { useMasterKey: true }));
    });

    return Parse.Promise.when(promises);
};

var resetCircuitUnits = function (circuit) {

    console.log("reseting circuitUnits for " + circuit.get('name'));
    console.log("resetCircuitUnits");

    var promise = new Parse.Promise();

    var counter = 0;

    var finishedQuery = new Parse.Query("CircuitUnit");
    finishedQuery.equalTo('status', 'finished');

    // TODO backwards compatibility - remove
    var abortedQuery = new Parse.Query("CircuitUnit");
    abortedQuery.equalTo('status', 'aborted');

    var timesArrivedQuery = new Parse.Query("CircuitUnit");
    timesArrivedQuery.greaterThan('timesArrived', 0);

    var mainQuery = Parse.Query.or(abortedQuery, finishedQuery, timesArrivedQuery);
    mainQuery.equalTo('circuit', circuit);

    mainQuery.each(function (object) {
        object.set('status', 'pending');
        object.set('guardId', 0);
        object.set('guardName', "");
        object.set('timesArrived', 0);
        object.unset('checkedCheckpoints');
        object.unset('guard');

        counter++;
        return object.save(null, { useMasterKey: true });
    }, { useMasterKey: true })
    .then(function () {
        console.log("has reset " + counter + " circuitunits");
        promise.resolve('regular tasks reset success');
    }, function (err) {
        promise.reject(err);
    });

    return promise;
};


var resetDistrictWatchClients = function (districtWatch) {

    console.log("resetting districtwatches for " + districtWatch.get('name'));

    var promise = new Parse.Promise();

    var query = new Parse.Query("DistrictWatchClient");
    query.greaterThan('timesArrived', 0);
    
    query.equalTo('districtWatch', districtWatch);

    query.each(function (object) {
        object.set('timesArrived', 0);
        object.set('arrived', false);
        object.set('completed', false);
        return object.save(null, { useMasterKey: true });
    }, { useMasterKey: true })
    .then(function () {
        promise.resolve('district watch clients reset success');
    }, function (err) {
        promise.reject(err);
    });

    return promise;

};


var createCircuitStarted = function (circuit) {

    console.log("createCircuitStarted");

    var promises = [];

    var name = circuit.get('name');
    var user = circuit.get('owner');
    var now = new Date();

    circuit.set('createdTime', now);
    circuit.set('createdDay', now.getDay());

    var ACL = new Parse.ACL(user);

    var CircuitStarted = Parse.Object.extend("CircuitStarted");
    var circuitStarted = new CircuitStarted();
    circuitStarted.set('circuit', circuit);
    circuitStarted.set('name', name);
    circuitStarted.set('owner', user);
    circuitStarted.set('ACL', ACL);
    circuitStarted.set('timeStarted', now);

    promises.push(circuitStarted.save(null, { useMasterKey: true }));
    promises.push(circuit.save(null, { useMasterKey: true }));
    promises.push(resetCircuitUnits(circuit));

    return Parse.Promise.when(promises);
};


var createDistrictWatchStarted = function (districtWatch) {

    var promises = [];

    var name = districtWatch.get('name');
    var user = districtWatch.get('owner');
    var now = new Date();

    districtWatch.set('createdTime', now);
    districtWatch.set('createdDay', now.getDay());

    var ACL = new Parse.ACL(user);

    var DistrictWatchStarted = Parse.Object.extend("DistrictWatchStarted");
    var object = new DistrictWatchStarted();
    object.set('districtWatch', districtWatch);
    object.set('name', name);
    object.set('owner', user);
    object.set('ACL', ACL);
    object.set('timeStarted', now);

    promises.push(object.save(null, { useMasterKey: true }));
    promises.push(districtWatch.save(null, { useMasterKey: true }));
    promises.push(resetDistrictWatchClients(districtWatch));

    return Parse.Promise.when(promises);
};

var activeDistrictWatchStartedMatching = function (districtWatch) {
    var query = new Parse.Query("DistrictWatchStarted");
    query.equalTo('districtWatch', districtWatch);
    query.doesNotExist('timeEnded');
    return query.find({ useMasterKey: true });
};

var findActiveCircuitStartedMatching = function (circuit) {
    var query = new Parse.Query("CircuitStarted");
    query.equalTo('circuit', circuit);
    query.doesNotExist('timeEnded');
    return query.find({ useMasterKey: true });
};
