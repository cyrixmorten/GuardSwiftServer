"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const rp = require("request-promise");
const ResetTasks_1 = require("./ResetTasks");
Parse.Cloud.job("forceResetTasks", function (request, status) {
    return rp({
        method: "POST",
        url: process.env.SERVER_URL + '/jobs/resetTasks',
        headers: {
            'X-Parse-Application-Id': process.env.APP_ID,
            'X-Parse-Master-Key': process.env.MASTER_KEY,
            'Content-Type': "application/json"
        },
        json: true,
        body: {
            'force': true
        }
    })
        .then(() => {
        status.success("Successfully forced reset of all tasks");
    }).catch((error) => {
        console.error(error);
        status.error(error.message);
    });
});
Parse.Cloud.job("resetTasks", function (request, status) {
    console.log('----');
    console.log('- resetAllTasks');
    console.log('----\n\n');
    var forceUpdate = request.params.force;
    var now = new Date();
    var now_dayOfWeek = now.getDay();
    var now_hour = now.getHours();
    console.log("manageActiveCircuitsStarted day: " + now_dayOfWeek + " hour: "
        + now_hour + " forced update: " + (forceUpdate == true));
    var promises = [];
    promises.push(manageCircuits(now_dayOfWeek, now_hour, forceUpdate));
    promises.push(new ResetTasks_1.ResetTasks(forceUpdate).run());
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
    query.get(objectId, { useMasterKey: true }).then(function (circuit) {
        createCircuitStarted(circuit).then(function () {
            response.success("Successfully created circuitStarted");
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
    queryCircuits.find({ useMasterKey: true }).then(function (circuits) {
        console.log("found circuits " + circuits.length);
        if (circuits.length == 0)
            return Parse.Promise.as('');
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
                    findActiveCircuitStartedMatching(circuit).then(function (circuitsStarted) {
                        // perform
                        // restart
                        var promise = Parse.Promise.as(undefined);
                        promise = promise.then(function () {
                            console.log(" ** RESTARTING CIRCUIT " + circuit.get('name') + " **");
                            console.log('Closing ...');
                            return closeCircuitsStarted(circuitsStarted);
                        }).then(function () {
                            console.log('Creating ...');
                            return createCircuitStarted(circuit);
                        });
                        return promise;
                    }).then(function () {
                        // save/update
                        // complete
                        circuitsStartedPromise.resolve('save/update complete - circuit');
                    }, function (error) {
                        console.error(error.message);
                        circuitsStartedPromise.reject(error);
                    });
                    promises.push(circuitsStartedPromise);
                }
                else {
                    // Do nothing
                    console.log(" -- | DO NOTHING | -- \n\n");
                }
            }
            else {
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
var closeCircuitStartedMatching = function (circuit) {
    return findActiveCircuitStartedMatching(circuit).then(function (circuitsStarted) {
        return closeCircuitsStarted(circuitsStarted);
    });
};
var closeCircuitsStarted = function (circuitsStarted) {
    if (circuitsStarted.length == 0) {
        return Parse.Promise.as(undefined);
    }
    var promises = [];
    circuitsStarted.forEach(function (circuitStarted) {
        circuitStarted.set('timeEnded', new Date());
        promises.push(circuitStarted.save(null, { useMasterKey: true }));
    });
    console.log('promises.length: ', promises.length);
    return Parse.Promise.when(promises);
};
var resetCircuitUnits = function (circuit) {
    console.log("reseting circuitUnits for " + circuit.get('name'));
    console.log("resetCircuitUnits");
    var promise = new Parse.Promise();
    var counter = 0;
    // TODO backwards compatibility - remove
    var arrivedQuery = new Parse.Query("CircuitUnit");
    arrivedQuery.equalTo('status', 'arrived');
    var abortedQuery = new Parse.Query("CircuitUnit");
    abortedQuery.equalTo('status', 'aborted');
    var finishedQuery = new Parse.Query("CircuitUnit");
    finishedQuery.equalTo('status', 'finished');
    var timesArrivedQuery = new Parse.Query("CircuitUnit");
    timesArrivedQuery.greaterThan('timesArrived', 0);
    var mainQuery = Parse.Query.or(arrivedQuery, abortedQuery, finishedQuery, timesArrivedQuery);
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
var findActiveCircuitStartedMatching = function (circuit) {
    var query = new Parse.Query("CircuitStarted");
    query.equalTo('circuit', circuit);
    query.doesNotExist('timeEnded');
    return query.find({ useMasterKey: true });
};
//# sourceMappingURL=dailyTasksReset.js.map