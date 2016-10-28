//Parse.Cloud.job("compFixClientArrays", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("Client");
//
//	query.each(function(object) {
//
//		if (!object.has('contacts')) {
//			object.set('contacts', []);
//		}
//		if (!object.has('roomLocations')) {
//			object.set('roomLocations', []);
//		}
//		if (!object.has('messages')) {
//			object.set('messages', []);
//		}
//
//		return object.save();
//
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.log(err.message);
//		status.error(err.message);
//	});
//
//});
//
//Parse.Cloud.job("compFixEventTypes", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("EventType");
//
//	query.each(function(object) {
//
//		object.set('hasAmount', true);
//		object.set('hasPeople', true);
//		object.set('hasLocations', true);
//		object.set('hasRemarks', true);
//
//		return object.save();
//
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.log(err.message);
//		status.error(err.message);
//	});
//
//});
//
//Parse.Cloud.job("compMigrateClientLocations", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("Client");
//
//	query.each(function(object) {
//
//		console.log("--" + object.get("name") + "--");
//
//		var promise = new Parse.Promise.as();
//
//		if (object.has('locations')) {
//			var locations = object.get('locations')
//
//			var locationObjects = []
//			var ClientLocation = Parse.Object.extend("ClientLocation");
//			for (var i = 0; i < locations.length; i++) {
//				var locationObject = new ClientLocation();
//				locationObject.set('location', locations[i]);
//				locationObject.set('isCheckpoint', false);
//				locationObjects.push(locationObject);
//			}
//
//			promise = promise.then(function() {
//				console.log("saving locations: " + locationObjects.length);
//				return Parse.Object.saveAll(locationObjects);
//			}).then(function(objects) {
//				for (var i = 0; i < objects.length; i++) {
//					object.add('roomLocations', objects[i])
//				}
//				console.log("saving array to client");
//				return object.save();
//			});
//		}
//
//		return promise;
//
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.log(err.message);
//		status.error(err.message);
//	});
//
//});
//
//Parse.Cloud.job("compMigrateDistrictwatchTimes", function(request, status) {
//	Parse.Cloud.useMasterKey();
//
//	var query = new Parse.Query("DistrictWatch");
//	query.each(function(object) {
//
//		migrateTimeStringToDate(object, 'timeStart', 'timeStartDate');
//		migrateTimeStringToDate(object, 'timeEnd', 'timeEndDate');
//		migrateTimeNumberToDate(object, 'timeReset', 'timeResetDate');
//
//		return object.save();
//	}).then(function() {
//		status.success("completed successfully.");
//	}, function(err) {
//		console.log(err.message);
//		status.error(err.message);
//	});
//
//});
//
//// Parse.Cloud.job("compMigrateCircuitTimes", function(request, status) {
//// Parse.Cloud.useMasterKey();
////
//// var query = new Parse.Query("Circuit");
//// query.each(function(object) {
////
//// migrateTimeStringToDate(object, 'timeStart', 'timeStartDate');
//// migrateTimeStringToDate(object, 'timeEnd', 'timeEndDate');
//// migrateTimeNumberToDate(object, 'timeReset', 'timeResetDate');
////
//// return object.save();
//// }).then(function() {
//// var query = new Parse.Query("CircuitUnit");
//// query.each(function(object) {
////
//// migrateTimeStringToDate(object, 'timeStart', 'timeStartDate');
//// migrateTimeStringToDate(object, 'timeEnd', 'timeEndDate');
////
//// return object.save();
//// }).then(function() {
//// status.success("completed successfully.");
//// }, function(err) {
//// console.log(err.message);
//// status.error(err.message);
//// });
//// }, function(err) {
//// console.log(err.message);
//// status.error(err.message);
//// });
////
//// });
//
//var migrateTimeNumberToDate = function(object, timeNumberCol, timeDateCol) {
//	var timeNumber = object.get(timeNumberCol);
//	if (timeNumber) {
//		var timeHour = timeNumber;
//
//		var timeDate = new Date();
//		timeDate.setHours((timeHour - 1));
//		timeDate.setMinutes(0);
//
//		object.set(timeDateCol, timeDate);
//	}
//};
//
//var migrateTimeStringToDate = function(object, timeStringCol, timeDateCol) {
//	var timeString = object.get(timeStringCol);
//	if (timeString) {
//		var timeHour = timeStringHourToInt(timeString);
//		var timeMinute = timeStringMinuteToInt(timeString);
//
//		var timeDate = new Date();
//		timeDate.setHours((timeHour - 1));
//		timeDate.setMinutes(timeMinute);
//
//		object.set(timeDateCol, timeDate);
//	}
//};
//
//var timeStringHourToInt = function(timeString) {
//	if (timeString.indexOf('.') != -1) {
//		var hourString = timeString.substring(0, timeString.indexOf('.'));
//		return parseInt(hourString, 10);
//	} else {
//		return parseInt(timeString, 10);
//	}
//};
//
//var timeStringMinuteToInt = function(timeString) {
//	if (timeString.indexOf('.') != -1) {
//		var minuteString = timeString.substring(timeString.indexOf('.') + 1);
//		return (minuteString) ? parseInt(minuteString, 10) : 0;
//	} else {
//		return 0;
//	}
//};
//
//// Parse.Cloud.define("compAddDaysToCircuitUnits", function(request, response) {
//// Parse.Cloud.useMasterKey();
////
//// var query = new Parse.Query("CircuitUnit");
//// query.doesNotExist("days");
//// query.find().then(function(circuitUnits) {
//// var count = 0;
//// var defaultDays = [1, 2, 3, 4, 5, 6, 7];
//// circuitUnits.forEach(function(circuitUnit) {
//// circuitUnit.set("days", defaultDays);
//// circuitUnit.save().then(function() {
//// count++;
//// if (count == circuitUnits.length) {
//// response.success("Altered " + count + " objects");
//// }
//// }, function(error) {
//// console.log(error);
//// });
//// });
//// });
//// });
//
//// Parse.Cloud.job("addMissingEventCodes", function(request, status) {
//// Parse.Cloud.useMasterKey();
////
//// var query = new Parse.Query("EventLog");
//// query.doesNotExist('eventCode');
//// query.each(function(object) {
//// var event = object.get('event');
//// if (event == "Ankommet") {
//// object.set('eventCode', 101);
//// object.save();
//// }
//// if (event == "Afsluttet") {
//// object.set('eventCode', 102);
//// object.save();
//// }
//// if (event == "Afbrudt") {
//// object.set('eventCode', 103);
//// object.save();
//// }
//// return object.save();
//// }).then(function() {
//// status.success("completed successfully.");
//// }, function(err) {
//// status.error(error.message);
//// });
////
//// });
//
//// Parse.Cloud.job("migrateAllClassesToNewUser", function(request, status) {
//// Parse.Cloud.useMasterKey();
////
//// var vagtdkQuery = new Parse.Query(Parse.User);
//// vagtdkQuery.equalTo('username', "vagtdk");
//// vagtdkQuery.first().then(function(user) {
////
//// // var classes = ["ChecklistCircuitStarting","ChecklistCircuitEnding",
//// "Circuit", "CircuitStarted", "CircuitUnit", "Client", "ClientInfo",
//// "DistrictWatch", "DistrictWatchUnit", "EventLog", "EventType", "Guard"];
//// var classes = ["Client"];
//// var promises = [];
//// classes.forEach(function(className) {
//// var promise = migrateUser(className, user);
//// promises.push(promise);
//// });
//// // Return a new promise that is resolved when all of the deletes
//// // are finished.
//// return Parse.Promise.when(promises);
////
//// },function(error) {
//// console.error(error);
//// status.error(error.message);
//// }).then(function() {
//// status.success("completed successfully.");
//// });
//// });
//
//// var migrateUser = function(className, user) {
////
//// var promise = new Parse.Promise();
////
//// var ACL = new Parse.ACL(user);
////
//// var query = new Parse.Query(className);
//// query.each(function(object) {
//// object.set("owner", user);
//// object.set("ACL", ACL);
//// return object.save();
//// }).then(function() {
//// console.log("migrating " + className + " completed");
//// promise.resolve(className);
//// }, function(err) {
//// promise.reject(err.message);
//// });
////
//// return promise;
//// };
//
//// Parse.Cloud.job("migrateDistrictWatches", function(request, status) {
//// Parse.Cloud.useMasterKey();
////
//// var vagtdkQuery = new Parse.Query(Parse.User);
//// vagtdkQuery.equalTo('username', "vagtdk");
//// vagtdkQuery.first().then(function(user) {
////
//// // var ACL = new Parse.ACL(user);
//// //
//// // var DistrictWatch = Parse.Object.extend("DistrictWatch");
//// // // Middelfart: client name = "Områdevagt Middelfart"
//// //
//// // var middelfart = new DistrictWatch();
//// // middelfart.set("owner", user);
//// // middelfart.set("name", 'Middelfart');
//// // middelfart.set("city", 'Middelfart');
//// // middelfart.set("zipcode", 5500);
//// // middelfart.set("timeStart", "20.00");
//// // middelfart.set("timeEnd", "06.00");
//// // middelfart.set("ACL", ACL);
//// // middelfart.save().then(function(middelfart) {
//// //
//// // console.log("Created Middelfart");
////
//// // var DistrictWatchUnit = Parse.Object.extend("DistrictWatchUnit");
////
//// var query = new Parse.Query("CircuitUnit");
//// query.include('client');
//// query.each(function(object) {
//// var name = object.get("name");
//// var clientName = "";
//// if (object.get("client"))
//// clientName = object.get("client").get("name");
////
//// var needle = "Område";
//// if (~clientName.indexOf(needle)) {
////
//// // var unit = new DistrictWatchUnit();
//// // unit.set("owner", user);
//// // unit.set("districtWatch", middelfart);
//// // unit.set("type", "");
//// // unit.set('client', object.get("client"));
//// // unit.set("address", name);
//// // unit.set("days", object.get("days"));
//// // unit.set("ACL", ACL);
////
//// console.log("Delete " + name);
////
//// return object.destroy();
//// } else {
//// return object.save();
//// }
//// }).then(function() {
//// status.success("completed successfully.");
//// }, function(err) {
//// console.error(err);
//// status.error(err);
//// });
////
//// // }, function(error) {
//// // console.error(error);
//// // status.error(error);
//// // });
//// },function(error) {
//// console.error(error);
//// status.error(error);
//// });
////
//// });
