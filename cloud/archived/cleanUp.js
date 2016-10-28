//var _ = require('underscore');
//
//Parse.Cloud.job("PublicReadableEventLogs", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var promise = Parse.Promise.as();
//
//	var query = new Parse.Query("EventLog");
//	query.limit(1000);
//	query.addDescending('createdAt');
//	query.find().then(function(objects) {
//		_.each(objects, function(object) {
//
//			promise = promise.then(function() {
//				var acl = object.getACL();
//				acl.setPublicReadAccess(true);
//				acl.setPublicWriteAccess(false);
//				object.setACL(acl);
//
//				console.log(acl);
//
//				return object.save();
//			});
//
//		});
//
//	return promise;
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.error(err);
//		status.error(err.message);
//	});
//
//});
//
//
// var moment = require('cloud/lib/moment/moment.min.js');
//
// Parse.Cloud.job("ReSaveLastWeeksEventLogs", function(request, status) {
// 	Parse.Cloud.useMasterKey();
//
//     var now = moment();
//     var oneweekago = moment().subtract(7, 'days');
//    
// 	var query = new Parse.Query("EventLog");
//     query.greaterThan("deviceTimestamp", oneweekago.toDate());
//     query.lessThan("deviceTimestamp", now.toDate());
//    
// 	query.each(function(object) {
// 		return object.save();
// 	}).then(function() {
// 		status.success("completed successfully.");
// 	}, function(err) {
// 		console.error(err);
// 		status.error(err.message);
// 	});
//
// });
//
// Parse.Cloud.job("FixClientNumbers", function(request, status) {
// 	Parse.Cloud.useMasterKey();
//
// 	var query = new Parse.Query("Client");
//
// 	query.each(function(object) {
// 		var number = object.get('number') || '';
// 		object.set('clientId', ''+number);
// 		return object.save();
// 	}).then(function() {
// 		var query = new Parse.Query("CircuitUnit");
//
// 		return query.each(function(object) {
// 			return object.save();
// 		});
//		
// 	}
// 	).then(function() {
// 		status.success("completed successfully.");
// 	}, function(err) {
// 		console.error(err);
// 		status.error(err.message);
// 	});
//
// });
//
//
//Parse.Cloud.job("ResetAllCircuitUnits", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("CircuitUnit");
////	query.doesNotExist("days");
//	query.each(function(object) {
////		object.unset('guardId');
////        object.unset('guardName');
//		var radius = object.get('geofenceRadius');
//		if (radius < 200) {
//			object.set('geofenceRadius', 200);
//		}
//		return object.save();
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.error(err);
//		status.error(err.message);
//	});
//
//});
//
//Parse.Cloud.job("DistrictWatchUnitSupervisions", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("DistrictWatchClient");
//	query.each(function(object) {
////		if (!object.get("supervisions")) {
////			object.set("supervisions", 1);
////		}
//		return object.save();
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.error(err);
//		status.error(err.message);
//	});
//
//});
//
//Parse.Cloud.job("cleanupOrphanPointers", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
////	,{
////		className : "CircuitUnit",
////		pointerNames : ["client", "circuit"],
////		pointerArrayNames: ["messages"]
////	}
//
//	/*
//	 * Define which pointers and arrays that needs testing of orphan pointers
//	 */
//	var inspectJobs = [{
//		className : "Client",
//		pointerNames : [],
//		pointerArrayNames: ["roomLocations", "contacts", "messages"]
//	}
//	];
//
//	var jobPromises = [];
//
//	_.each(inspectJobs, function(job) {
//
//		var className = job.className;
//		var pointerNames = job.pointerNames;
//		var arrayNames = job.pointerArrayNames;
//
//		console.log("Running job for " + className + " with " + pointerNames.length + " pointerNames and " +  arrayNames.length + " pointerArrays ...");
//
//		var query = new Parse.Query(className);
//
//		// include pointers
//		_.each(pointerNames, function(pointerName) {
//			query.include(pointerName);
//		});
//
//		// include array of pointers
//		_.each(arrayNames, function(arrayName) {
//			query.include(arrayName);
//		});
//
//		var counter = 0;
//
//		var jobPromise = query.each(function(object) {
//
//
//			var promises = [];
//
//			// inspect pointerNames specified in job
//			_.each(pointerNames, function(pointerName) {
//				var pointer = object.get(pointerName);
//
//				if (pointer && pointer.createdAt) {
//					// valid
//				} else {
//					console.log(className + ": invalid " + pointerName + " pointer in object: " + object.id);
//
//					/*
//					 * Example reaction invalid pointer:
//					 * Destroying the object
//					 */
//					promises.push(object.destroy());
//				}
//			});
//
//
//			// inspect arrayNames specified in job
//			_.each(arrayNames, function(arrayName) {
//				var pointers = object.get(arrayName);
//
//				// inspect pointers in arrayName
//				_.each(pointers, function(pointer) {
//					if (pointer && pointer.createdAt) {
//						// valid
//					} else {
//						console.log(className + ": invalid pointer in array: " + arrayName + " in object: " + object.id);
//
//						/*
//						 * Example reaction to an array containing invalid pointer:
//						 * Clearing the array
//						 */
//						object.set(arrayName, []);
//						promises.push(object.save());
//					}
//				});
//			});
//			return Parse.Promise.when(promises).then(function() {
//				counter++;
//				if (counter % 100 == 0) {
//					console.log('Processed ' + counter + " " + className + " objects");
//				}
//			});
//		}).then(function() {
//			console.log("Job complete for class: " + className)
//		}, function(error) {
//			console.error("Error running job for class " + className + " message " + error.message);
//		});
//
//		jobPromises.push(jobPromise);
//	});
//
//	Parse.Promise.when(jobPromises).then().then(function() {
//		console.log("Background job complete!");
//		status.success("completed successfully.");
//	}, function(err) {
//		console.error(err);
//		status.error(err.message);
//	});
//
//});
//
//
//Parse.Cloud.job("correctDaysByDecrementing", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("CircuitUnit");
//	query.each(function(object) {
//		var days = object.get('days');
//		var decrementedDays = [];
//		if (!_.contains(decrementedDays, -1)) {
//			days.forEach(function(day) {
//				decrementedDays.push((day - 1));
//			});
//			object.set('days', decrementedDays);
//		}
//
//		var incrementedDays = [];
//		if (_.contains(decrementedDays, -1)) {
//			days.forEach(function(day) {
//				incrementedDays.push((day + 1));
//			});
//			object.set('days', incrementedDays);
//		}
//
//		return object.save();
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		status.error(err.message);
//	});
//
//});
//
//Parse.Cloud.job("RepairBySaving", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("CircuitUnit");
//	query.each(function(object) {
//		return object.save();
//	}).then(function() {
//		console.log("CircuitUnit");
//		var query = new Parse.Query("DistrictWatchUnit");
//		query.each(function(object) {
//			return object.save();
//		}).then(function() {
//			console.log("DistrictWatchUnit");
//			status.success("completed successfully.");
//			// var query = new Parse.Query("Circuit");
//			// query.each(function(object) {
//			// return object.save();
//			// }).then(function() {
//			// console.log("Circuit")
//			// var query = new Parse.Query("ChecklistCircuitStarting");
//			// query.each(function(object) {
//			// return object.save();
//			// }).then(function() {
//			// console.log("ChecklistCircuitStarting");
//			// var query = new Parse.Query("ChecklistCircuitEdning");
//			// query.each(function(object) {
//			// return object.save();
//			// }).then(function() {
//			// console.log("ChecklistCircuitEdning");
//			// var query = new Parse.Query("CircuitStarted");
//			// query.each(function(object) {
//			// return object.save();
//			// }).then(function() {
//			// console.log("CircuitStarted");
//			// var query = new Parse.Query("Event");
//			// query.each(function(object) {
//			// return object.save();
//			// }).then(function() {
//			// status.success("completed successfully.");
//			// }, function(err) {
//			// status.error(err);
//			// });
//			// }, function(err) {
//			// status.error(err);
//			// });
//			// }, function(err) {
//			// status.error(err);
//			// });
//			// }, function(err) {
//			// status.error(err);
//			// });
//			// }, function(err) {
//			// status.error(err);
//			// });
//		}, function(err) {
//			status.error(err);
//		});
//	}, function(err) {
//		status.error(err.message);
//	});
//
//});
