//Parse.Cloud.define("addAlarm", function(request, response) {
//
//	var now = new Date();
//	console.log('addAlarm started');
//
//	var body = JSON.parse(request.body);
//
//	// email meta
//	var from = body.from;
//	var to = body.to;
//	var subject = body.subject;
//	var emailBody = body.body;
//
//	// alarm info
//	var type = body.type;
//	var zone = body.zone;
////	var alarmTime = parseInt(body.alarmTime); // unix timeStamp
//	var securityLevel = body.securityLevel;
//	var installation = body.installation;
//	var hardwareId = body.hardwareId;
//	var serial = body.serial;
//	var installer = body.installer;
//	var guardId = body.guardId;
//	var guardName = body.guardName;
//	var drivingGuidance = body.drivingGuidance;
//	var accessRoute = body.accessRoute;
//	var keyboxLocation = body.keyboxLocation;
//	var bypassLocation = body.bypassLocation;
//	var controlpanelLocation = body.controlpanelLocation;
//	var smokecannonLocation = body.smokecannonLocation;
//	var guardCode = body.guardCode;
//	var bypassCode = body.bypassCode;
//	var remark = body.remark;
//
//	// client info
//	var name = body.name;
//	var addressName = body.addressName;
//	var addressName2 = body.addressName2;
//	var addressNumber = body.addressNumber;
//	var floor = body.floor;
//	var cityName = body.cityName;
//	var phoneNumber = body.phoneNumber;
//	var zipcode = body.zipcode;
//
//	// construct Alarm
//	var Alarm = Parse.Object.extend("Alarm");
//	var alarm = new Alarm();
//	alarm.set("from", from);
//	alarm.set("to", to);
//	alarm.set("subject", subject);
//	alarm.set("body", emailBody);
//	alarm.set("type", type);
//	alarm.set("zone", zone);
////	alarm.set("alarmTime", new Date(alarmTime+1000));
//	alarm.set("alarmTime", new Date());
//	alarm.set("securityLevel", securityLevel);
//	alarm.set("installation", installation);
//	alarm.set("hardwareId", hardwareId);
//	alarm.set("serial", serial);
//	alarm.set("installer", installer);
//	alarm.set("guardId", guardId);
//	alarm.set("guardName", guardName);
//	alarm.set("drivingGuidance", drivingGuidance);
//	alarm.set("accessRoute", accessRoute);
//	alarm.set("keyboxLocation", keyboxLocation);
//	alarm.set("bypassLocation", bypassLocation);
//	alarm.set("controlpanelLocation", controlpanelLocation);
//	alarm.set("smokecannonnLocation", smokecannonLocation);
//	alarm.set("guardCode", guardCode);
//	alarm.set("bypassCode", bypassCode);
//	alarm.set("remark", remark);
//
//	var guardingCompany = ''; // User to 'owner' pointer
//
//	var Central = Parse.Object.extend("Central");
//	var queryCentral = new Parse.Query(Central);
//	queryCentral.equalTo('alarmMail', from);
//	/*
//	 * 1) ensure that central is known
//	 */
//	queryCentral.first().then(function(central) {
//
//		console.log('queryCentral ' + (new Date().getTime() - now.getTime()));
//
//		if (!central) {
//			console.log('did not find central with alarmMail equal ' + from);
//			alarm.set('missingCentral', true);
//			return new Parse.Promise.error("Unknown central: " + from);
//		}
//
//		console.log("1) central found: " + central.get('name'));
//		alarm.set('central', central);
//
//		/*
//		 * 1.5) sneaking in an installer_company search here
//		 */
//		var findAndSetInstallerCompany = function() {
//			// split whitespaces to avoid including KC messages in the search
//			var installerArray = installer.split(/(\s+)/);
//			console.log("searching for installer: " + installer);
//			if (installerArray.length > 0) {
//				var installerName = installerArray[0];
//				console.log("searching for installer: " + installerName);
//				var Installer = Parse.Object.extend("Installer");
//				var queryInstaller = new Parse.Query(Installer);
//				queryInstaller.startsWith('name', installerName);
//				queryInstaller.first().then(function(installerCompany) {
//					alarm.set("installer_company", installerCompany);
//				}, function() {
//					// not found - create it
//					var installer = new Installer();
//					installer.set('name', installerName);
//					installer.save().then(function(installerCompany) {
//						alarm.set("installer_company", installerCompany);
//					});
//				});
//			} else {
//				console.log("split came up empty");
//			}
//
//			console.log('findAndSetInstallerCompany ' + (new Date().getTime() - now.getTime()));
//		}
//
//		findAndSetInstallerCompany();
//
//
//
//		var CentralToGuard = Parse.Object.extend("CentralToGuard");
//		var query = new Parse.Query(CentralToGuard);
//		query.equalTo('central', central);
//		query.equalTo('guardId', guardId);
//
//
////		var userQuery = new Parse.Query(Parse.User);
////		userQuery.equalTo('username', "JVH");
//
//		/*
//		 * 2) look up guarding company
//		 */
//
//		return query.first();
//
//
//	}).then(function(centralToGuard) {
//
//		console.log('centralToGuard ' + (new Date().getTime() - now.getTime()));
//
//		if (!centralToGuard) {
//			return new Parse.Promise.error("Did not find guardingCompany based on guardId " + guardId);
//		}
//
//		guardingCompany = centralToGuard.get('user');
//
//		console.log("2) user found: " + guardingCompany);
//
//
//		alarm.set("owner", guardingCompany);
//
//		var ExistingClient = Parse.Object.extend("Client");
//		var query = new Parse.Query(ExistingClient);
//		query.equalTo('owner', guardingCompany);
//		query.equalTo('addressName', addressName);
//		query.equalTo('addressNumber', addressNumber);
//		query.equalTo('floor', floor);
//		query.equalTo('cityName', cityName);
//		query.equalTo('zipcode', zipcode);
//
//		/*
//		 * 3) look up if client already is known
//		 */
//
//		return query.first();
//
//	}).then(function (client) {
//
//		console.log('look up client ' + (new Date().getTime() - now.getTime()));
//
//		var resolveClient = new Parse.Promise.as(client);
//
//		if (client) {
//			console.log("4a) Client already known to system");
//			/*
//			 * 4a) client already known
//			 */
//			if (!client.get("isAlarmClient")) {
//				client.set("isAlarmClient", true);
//				resolveClient = client.save();
//			}
//
//			// TODO see if need to update contact
//
//		} else {
//			console.log("4b) Create new client " + name);
//			/*
//			 * 4b) create new client from alarm
//			 */
//
//			if (phoneNumber) {
//				var ClientContact = Parse.Object.extend("ClientContact");
//				var clientContact = new ClientContact();
//				clientContact.set('name', name);
//				clientContact.set('phoneNumber', phoneNumber);
//				clientContact.set('owner', guardingCompany);
//			}
//
//			var Client = Parse.Object.extend("Client");
//			client = new Client();
//			client.set("name", name);
//			client.set("addressName", addressName);
//			client.set("addressName2", addressName2);
//			client.set("addressNumber", addressNumber);
//			client.set("floor", floor);
//			client.set("cityName", cityName);
//			client.set("zipcode", zipcode);
//			client.set("isAutoCreated", true);
//			client.set("isAlarmClient", true);
//			client.set("owner", guardingCompany);
//			if (clientContact) {
//				client.add("contacts", clientContact);
//			}
//			resolveClient = client.save();
//		}
//
//		return resolveClient;
//
//	}).then(function(client) {
//
//		console.log("5) referencing client");
//		console.log('reference client ' + (new Date().getTime() - now.getTime()));
//		/*
//		 * 5) reference client from alarm and inherit some primitives
//		 */
//
//		alarm.set("client", client);
//		alarm.set('clientName', client.get('name'));
//		alarm.set('clientCity', client.get('cityName'));
//		alarm.set('clientAddress', client.get('addressName'));
//		alarm.set('clientAddressNumber', client.get('addressNumber'));
//		alarm.set('clientFullAddress', client.get('addressName') + " " + client.get('addressNumber'));
//		alarm.set('position', client.get('position'));
//
//		return alarm.save();
//	}).then(function(alarm) {
//
//		console.log('alarm saved ' + (new Date().getTime() - now.getTime()));
//		/*
//		 * 6) All done
//		 */
//
//		response.success("success!");
//
//	}, function(error) {
//		response.error(error);
//	});
//
//});
//
////var lookUpGuardAndSaveAlarm = function(alarm, response, client) {
////
////	var client = alarm.get('client');
////	alarm.set('clientName', client.get('name'));
////	alarm.set('clientCity', client.get('cityName'));
////	alarm.set('clientAddress', client.get('addressName'));
////	alarm.set('clientAddressNumber', client.get('addressNumber'));
////	alarm.set('clientFullAddress', client.get('addressName') + " " + client.get('addressNumber'));
////
////	var userQuery = new Parse.Query(Parse.User);
////	userQuery.equalTo('username', "vagtdk");
//////	userQuery.equalTo('username', "vagtdk");
////	userQuery.first().then(function(user) {
////		alarm.set('owner', user);
////		if (client) {
////			client.set('owner', user);
////			client.save().then(function(client) {
////				saveAlarm(alarm, response);
////			});
////		} else {
////			saveAlarm(alarm, response);
////		}
////
////	}, function(error) {
////		console.error(error.message);
////		response.error(error);
////	});
////};
////
////var saveAlarm = function(alarm, response) {
////	alarm.save().then(function(alarm) {
////		console.log("Saved Alarm");
////		response.success("success!");
////	}, function(error) {
////		console.error(error.message);
////		response.error(error);
////	});
////};
