var Global = require('../global.js');
var _ = require('lodash');


Parse.Cloud.job("forceResetAllTasks", function(request, status) {
	Parse.Cloud.useMasterKey();

    return Parse.Cloud.httpRequest({
        method: "POST",
        url: "https://api.parse.com/1/jobs/resetAllTasks",
        headers: {
			'X-Parse-Application-Id': Parse.applicationId,
			'X-Parse-Master-Key': Global.PARSE_MASTER_KEY,
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
		console.log('error' + JSON.stringify(error));
		status.error(error.message);
	});
});

Parse.Cloud.job("resetAllTasks", function(request, status) {
	Parse.Cloud.useMasterKey();


	var forceUpdate = request.params.forceUpdate;
	// var circuitPointer = {__type: "Pointer", className: "Circuit", objectId:
	// "CiWrW4N96J"};
	// resetCircuitUnits(circuitPointer).then(function() {
	// // // All tasks completed
	// console.log("all done");
	// status.success("completed successfully");
	// }, function(error) {
	// console.error("failed - " + error.message);
	// status.error("an error occured");
	// });;

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

	Parse.Promise.when(promises).then(function() {
		// // All tasks completed
		console.log("all done");
		status.success("completed successfully");
	}, function(error) {
		console.error("failed - " + error.message);
		status.error("an error occurred: " + JSON.stringify(error));
	});

});

Parse.Cloud.define("createCircuitStarted", function(request, response) {
	var objectId = request.params.objectId;
	var Circuit = Parse.Object.extend("Circuit");
	var query = new Parse.Query(Circuit);
	query.get(objectId).then(function(circuit) {
		createCircuitStarted(circuit).then(function() {
			response.success("Successfully created circuitStarted");
		}, function(error) {
			response.error(error.message);
		});
	}, function(error) {
		response.error(error.message);
	});

});

Parse.Cloud.define("createDistrictWatchStarted", function(request, response) {
	var objectId = request.params.objectId;
	var DistrictWatch = Parse.Object.extend("DistrictWatch");
	var query = new Parse.Query(DistrictWatch);
	query.get(objectId).then(function(districtWatch) {
		createDistrictWatchStarted(districtWatch).then(function() {
			response.success("Successfully created districtWatch");
		}, function(error) {
			response.error(error.message);
		});
	}, function(error) {
		response.error(error.message);
	});

});

var manageCircuits = function(now_dayOfWeek, now_hour, forceUpdate) {

	var promise = new Parse.Promise();

	var queryCircuits = new Parse.Query("Circuit");
	if (!forceUpdate) {
		queryCircuits.notEqualTo('createdDay', now_dayOfWeek);
	}
	queryCircuits.doesNotExist('archive');
	queryCircuits
			.find()
			.then(
					function(circuits) {
						console.log("found circuits " + circuits.length);

						if (circuits.length == 0)
							return new Parse.Promise.as();

						var promises = [];

						// for each Circuit
						circuits
								.forEach(function(circuit) {

									var days = circuit.get('days');
									// if run today
									if (_.contains(days, now_dayOfWeek)) {
										// adjust time according to timeZone
										var timeResetDate = circuit.get('timeResetDate');
										var timeEnd = timeResetDate.getHours();

										var hours_to_restart = timeEnd - now_hour;

										console
												.log(" -- | "
														+ circuit.get('name')
														+ " | --");
										console.log("Restart hour: "
												+ timeEnd + " now hour: "
												+ now_hour);
										console
												.log("Restarting in "
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

											activeCircuitStartedMatching(
													circuit)
													.then(
															function(circuitsStarted) {

																// perform
																// restart

																var promise = new Parse.Promise.as();

																promise = promise
																		.then(
																				function() {
																					console
																							.log(" ** RESTARTING CIRCUIT "
																									+ circuit
																											.get('name')
																									+ "**");
																					return closeCircuitsStarted(circuitsStarted);
																				})
																		.then(
																				function() {
																					return createCircuitStarted(circuit);
																				});

																return promise;

															})
													.then(
															function() {
																// save/update
																// complete
																circuitsStartedPromise
																		.resolve('save/update complete - circuit');
															},
															function(error) {
																console
																		.error(error.message);
																circuitsStartedPromise
																		.reject(error);
															});

											promises
													.push(circuitsStartedPromise);

										} else {
											// Do nothing
											console
													.log(" -- | DO NOTHING | -- \n\n");
										};

									} else {
										console.log("Not run today: "
												+ now_dayOfWeek + " days: "
												+ days);
										var closePromise = closeCircuitStartedMatching(circuit);
										promises.push(closePromise);
									};

								});

						// Return a new promise that is resolved when all of the
						// async tasks are finished.
						return Parse.Promise.when(promises);

					}).then(function() {
				console.log("manageCircuits done");
				promise.resolve('reset circuits done');
			}, function(error) {
				console.error("manageCircuits " + error.message);
				promise.reject(error);
			});

	return promise;
};

var manageDistrictWatches = function(now_dayOfWeek, now_hour, forceUpdate) {

	var promise = new Parse.Promise();

	var queryDistrictWatches = new Parse.Query("DistrictWatch");
	if (!forceUpdate) {
		queryDistrictWatches.notEqualTo('createdDay', now_dayOfWeek);	
	}
	queryDistrictWatches.doesNotExist('archive');
	queryDistrictWatches
			.find()
			.then(
					function(districtWatches) {
						console.log("found districtWatches "
								+ districtWatches.length);

						if (districtWatches.length == 0)
							return new Parse.Promise.as();

						var promises = [];

						// for each Circuit
						districtWatches
								.forEach(function(districtWatch) {

									var days = districtWatch.get('days');
									// if run today
									if (_.contains(days, now_dayOfWeek)) {
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
										console
												.log("Restarting in "
														+ hours_to_restart
														+ " hour(s)");

										/*
										 * Optimizing halt conditions Avoids a
										 * query and inspection of child
										 * DistrictWatchStarted Time to restart
										 * or newly created
										 */
										if (forceUpdate || hours_to_restart == 0
												|| !districtWatch
														.has('createdDay')) {
											// CircuitStarted matching Circuit
											var districtWatchesStartedPromise = new Parse.Promise();
											activeDistrictWatchStartedMatching(
													districtWatch)
													.then(
															function(districtWatchStarted) {

																// perform
																// restart
																var promise = new Parse.Promise.as();

																promise = promise
																		.then(
																				function() {
																					console
																							.log(" ** RESTARTING DISTRICTWATCH "
																									+ districtWatch
																											.get('name')
																									+ "**");
																					return closeDistrictWatchesStarted(districtWatchStarted);
																				})
																		.then(
																				function() {
																					return createDistrictWatchStarted(districtWatch);
																				});

																return promise;

															})
													.then(
															function() {
																// save/update
																// complete
																districtWatchesStartedPromise
																		.resolve('save/update complete - districtWatch');
															},
															function(error) {
																console
																		.error(error.message);
																districtWatchesStartedPromise
																		.reject(error);
															});

											promises
													.push(districtWatchesStartedPromise);

										} else {
											// Do nothing
											console
													.log(" -- | DO NOTHING | -- \n\n");
										}

									} else {
										console.log("Not run today: "
												+ now_dayOfWeek + " days: "
												+ days);
										var closePromise = closeDistrictWatchesStartedMatching(districtWatch);
										promises.push(closePromise);
									};

								});

						return Parse.Promise.when(promises);

					}).then(function() {
				console.log("manageDistrictWatches done");
				promise.resolve('reset districtwatches done');
			}, function(error) {
				console.error("manageDistrictWatches " + error.message);
				promise.reject(error);
			});

	return promise;
};

var closeCircuitStartedMatching = function(circuit) {

	return activeCircuitStartedMatching(circuit).then(
			function(circuitsStarted) {
				return closeCircuitsStarted(circuitsStarted);
			});
};

var closeCircuitsStarted = function(circuitsStarted) {
	if (circuitsStarted.length == 0)
		return new Parse.Promise.as();
	
	var promises = [];
	circuitsStarted.forEach(function(circuitStarted) {
		circuitStarted.set('timeEnded', new Date());
		promises.push(circuitStarted.save());
	});

	return Parse.Promise.when(promises);
};

var closeDistrictWatchesStartedMatching = function(districtWatch) {

	return activeDistrictWatchStartedMatching(districtWatch).then(
			function(districtWatchesStarted) {
				return closeDistrictWatchesStarted(districtWatchesStarted);
			});
};

var closeDistrictWatchesStarted = function(districtWatchesStarted) {
	if (districtWatchesStarted.length == 0)
		return new Parse.Promise.as();
	
	var promises = [];
	districtWatchesStarted.forEach(function(districtWatchStarted) {
		districtWatchStarted.set('timeEnded', new Date());
		promises.push(districtWatchStarted.save());
	});

	return Parse.Promise.when(promises);
};

var resetCircuitUnits = function(circuit) {

	 console.log("reseting circuitUnits for " + circuit.get('name'));
	console.log("resetCircuitUnits");

	var promise = new Parse.Promise();

	var counter = 0;

	var queryCompleted = new Parse.Query("CircuitUnit");
	queryCompleted.notEqualTo('guardId', 0);
	
	var queryExtras = new Parse.Query("CircuitUnit");
	queryExtras.equalTo('isExtra', true);
	queryExtras.doesNotExist('isHidden');
	
	var queryHasCheckpoints = new Parse.Query("CircuitUnit");
	queryHasCheckpoints.exists("checkedCheckpoints");
	
	var queryMarkedArrived = new Parse.Query("CircuitUnit");
	queryMarkedArrived.equalTo("isArrivedReported", true);
	
	var queryWithinGeofence = new Parse.Query("CircuitUnit");
	queryWithinGeofence.equalTo("isWithinGeofence", true);
	
	var query = Parse.Query.or(queryCompleted, queryExtras, queryHasCheckpoints, queryMarkedArrived, queryWithinGeofence);
	query.equalTo('circuit', circuit);
	
	query.each(function(object) {
		resetGeofencedTaskValues(object);
		object.set('guardId', 0);
		object.set('guardName', "");
		if (object.get('isExtra')) {
			object.set('isHidden', true);
		}
		object.unset('checkedCheckpoints');
		object.set('isAborted', false);
		
		counter++;
		return object.save();
	}).then(function() {
		console.log("has reset " + counter + " circuitunits");
		promise.resolve('regular tasks reset success');
	}, function(err) {
		promise.reject(err);
	});

	return promise;
};


var resetDistrictWatchClients = function(districtWatch) {

	 console.log("resetting districtwatches for " + districtWatch.get('name'));

	var promise = new Parse.Promise();

	var queryArrived = new Parse.Query("DistrictWatchClient");
	queryArrived.greaterThan('timesArrived', 0);
	
	var queryMarkedArrived = new Parse.Query("DistrictWatchClient");
	queryMarkedArrived.equalTo("isArrivedReported", true);
	
	var queryWithinGeofence = new Parse.Query("DistrictWatchClient");
	queryWithinGeofence.equalTo("isWithinGeofence", true);
	
	var query = Parse.Query.or(queryArrived, queryMarkedArrived, queryWithinGeofence);
	query.equalTo('districtWatch', districtWatch);
	
	query.each(function(object) {
		resetGeofencedTaskValues(object);
		object.set('timesArrived', 0);
		object.set('arrived', false);
		object.set('completed', false);
		return object.save();
	}).then(function() {
		promise.resolve('district watch clients reset success');
	}, function(err) {
		promise.reject(err);
	});

	return promise;

};

// todo: cleanup - no longer needed
var resetGeofencedTaskValues = function(object) {
	object.set('isWithinGeofence', false);
	object.set('isArrivedReported', false);
	object.set('isDepartureReported', false);
	object.set('isOnfootReported', false);
	object.set('isStillReported', false);
	object.unset('enterTriggerDateGeofence');
	object.unset('enterTriggerDateGPS');
	object.unset('exitTriggerDateGeofence');
	object.unset('exitTriggerDateGPS');
};



var createCircuitStarted = function(circuit) {

	console.log("createCircuitStarted");

	var promises = [];

	var name = circuit.get('name');
	var user = circuit.get('owner');
	var now = new Date();

	circuit.set('createdTime', now);
	circuit.set('createdDay', now.getDay());

	var ACL = new Parse.ACL(user);

	var CircuitStarted = Parse.Object.extend("CircuitStarted");
	var circuitStarted  = new CircuitStarted();
	circuitStarted.set('circuit', circuit);
	circuitStarted.set('name', name);
	circuitStarted.set('owner', user);
	circuitStarted.set('ACL', ACL);
	circuitStarted.set('timeStarted', now);

	promises.push(circuitStarted.save());
	promises.push(circuit.save());
	promises.push(resetCircuitUnits(circuit));

	return Parse.Promise.when(promises);
};



var createDistrictWatchStarted = function(districtWatch) {

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

	promises.push(object.save());
	promises.push(districtWatch.save());
	promises.push(resetDistrictWatchClients(districtWatch));

	return Parse.Promise.when(promises);
};

var activeDistrictWatchStartedMatching = function(districtWatch) {
	var query = new Parse.Query("DistrictWatchStarted");
	query.equalTo('districtWatch', districtWatch);
	query.doesNotExist('timeEnded');
	return query.find();
};

var activeCircuitStartedMatching = function(circuit) {
	var query = new Parse.Query("CircuitStarted");
	query.equalTo('circuit', circuit);
	query.doesNotExist('timeEnded');
	return query.find();
};
