var moment = require('cloud/lib/moment/moment-timezone.js');

var Mailing = require("cloud/utils/mailing.js");

var timeZone = 'Europe/Copenhagen'; // todo load from user(owner)

/**
 * !! DEPRECATED - NOT INCLUDED !!
 */


var dateToUserLocaleDate = function(date, user) {
	if (!date) {
		return "";
	}
	// TODO use user info
	return moment.tz(date, timeZone).format('DD-MM-YYYY');
//	return moment(date).zone('+0100').format('DD-MM-YYYY');
};

var dateToUserLocaleHoursAndMinutes = function(date, user) {
	if (!date) {
		return "";
	}
	// TODO use user info
	return moment.tz(date, timeZone).format('HH:mm');
//	return moment(date).zone('+0100').format('HH:mm');
};

var TemplateEngine = function(html, options) {
	var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
	var add = function(line, js) {
		js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line
				+ ');\n') : (code += line != '' ? 'r.push("'
				+ line.replace(/"/g, '\\"') + '");\n' : '');
		return add;
	}
	while (match = re.exec(html)) {
		add(html.slice(cursor, match.index))(match[1], true);
		cursor = match.index + match[0].length;
	}
	add(html.substr(cursor, html.length - cursor));
	code += 'return r.join("");';
	return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}

// http://jsfiddle.net/edch05eq/
var createReport = function(template, content, user) {
	return TemplateEngine(template, {
		logoUrl : user.get('logoUrl'),
		title : 'VAGT RAPPORT',
		subtitle : 'Rapport for '
				+ moment(new Date()).subtract(1, 'days').format('DD-MM-YYYY'),
		content : content
	});
}

var createContent = function(template, taskSummary, gpsSummaries) {

	// the template expects an array
	if (!Array.isArray(taskSummary)) {
		taskSummary = [taskSummary];
	}

	return TemplateEngine(template, {
		eventlogs : taskSummary,
//		gpsObjectId : (gpsSummaries && gpsSummaries.length > 0) ? gpsSummaries[0].objectId : '',
		button_text : 'GPS dokumentation',
	});
}

var fetchTemplates = function() {
	var promise = new Parse.Promise();
	var mail_template = '';
	var content_template = '';
	Parse.Cloud
			.httpRequest(
					{
						url : 'http://guardswiftdev.parseapp.com/template/report_default.html'
					})
			.then(
					function(httpResponse) {
						mail_template = httpResponse.text;
						return Parse.Cloud
								.httpRequest({
									url : 'http://guardswiftdev.parseapp.com/template/report_content.html'
								});
					}).then(
					function(httpResponse) {
						content_template = httpResponse.text;
						promise.resolve({
							mail_template : mail_template,
							content_template : content_template
						});
					},
					function(httpResponse) {
						console.error('Request failed with response code '
								+ httpResponse.status);
						promise.reject('Request failed with response code '
								+ httpResponse.status);
					});

	return promise;
}

var findSummaryEvents = function(fromTime, toTime) {
	console.log('findSummaryEvents from: ' + fromTime + " to: " + toTime);

	var eventQuery = new Parse.Query("EventLog");

	// eventQuery.exists("eventSummary");

	// gpsSummary and eventSummary
	eventQuery.containedIn('eventCode', [180, 181]);

	eventQuery.greaterThan("clientTimestamp", fromTime);
	eventQuery.lessThan("clientTimestamp", toTime);

	eventQuery.include(['owner', 'contactClient', 'contactClient.owner']);

	eventQuery.ascending("clientTimestamp")

	return eventQuery.find();
};

/**
 * Wraps a summary event with it's objectId Used by the mail template to create
 * a link showing GPS documentation using the taskSummary column
 */
var wrapSummaryEvent = function(event) {

	var isEventSummary = event.has('eventSummary');
	var isGpsSummary = event.has('gpsSummary');

	var summary = event.get('eventSummary') || event.get('gpsSummary');

	if (isEventSummary) {
		summary.forEach(function(innerSummary) {
			innerSummary.time = dateToUserLocaleHoursAndMinutes(new Date(innerSummary.time),
					event.get('owner'));

			if (innerSummary.amount == 0) {
				delete innerSummary.amount;
			}
		});
	}
	
	return {
		client : event.get('contactClient'),
		objectId : event.id,
		events : summary,
		isEvent : isEventSummary,
		isGps : isGpsSummary
	};
};

var wrapEvents = function(events) {
	var wrappedEvents = [];
	// wrap all events to prepare for enable email template 
	events.forEach(function(event) {
		// wrap with objectId to create link to GPS documentation
		wrappedEvents.push(wrapSummaryEvent(event));
	});
	
	return wrappedEvents;
}
var groupByContactClient = function(wrappedEvents) {


	var uniqueClients = []; 
	var eventsMap = {}; // map from client to eventSummaries
	var gpsMap = {}; // map from client to gpsSummaries
	
	// combine all events under same client
	wrappedEvents.forEach(function(wrappedEvent) {

		var contactClient = wrappedEvent.client;
		var clientId = contactClient.id;

//		console.log('client: ' + clientId);
		if (!eventsMap[clientId] && !gpsMap[clientId]) {
			uniqueClients.push(contactClient);		
//			console.log('client unique: ' + clientId);
		}
		
		if (wrappedEvent.isEvent) {
			if (eventsMap[clientId]) {
				eventsMap[clientId].push(wrappedEvent);
			} else {
				eventsMap[clientId] = [wrappedEvent];
			}
		}
		
		if (wrappedEvent.isGps) {
			if (gpsMap[clientId]) {
				gpsMap[clientId].push(wrappedEvent);
			} else {
				gpsMap[clientId] = [wrappedEvent];
			}			
		}

	});
	

	return {
		uniqueClients : uniqueClients,
		eventsMap : eventsMap,
		gpsMap : gpsMap
	}
};

var addClientAndGPSInfo = function(groupedEvents) {
	
	var uniqueClients = groupedEvents.uniqueClients;
	var eventsMap = groupedEvents.eventsMap;
	var gpsMap = groupedEvents.gpsMap;
		
	var clientIndexesWithoutEvents = [];
	
	// iterate all unique clients add clientInfo and gpsObjectId to events
	uniqueClients.forEach(function(client) {

		var eventSummaries = eventsMap[client.id];
		var gpsSummaries = gpsMap[client.id];

		if (eventSummaries && eventSummaries.length > 0) {
			
			//#1 Locate GPS info to create link
			if (gpsSummaries && gpsSummaries.length > 0) {
				// inserting objectId of first GPS summary
				// TODO include all GPS summaries
				// TODO match taskId
				
				var gpsId = gpsSummaries[0].objectId;
				eventSummaries.forEach(function(eventSummary) {
					eventSummary.objectId = gpsId;
				});
			} else {
				// no GPS summary
				eventSummaries.forEach(function(eventSummary) {
					eventSummary.objectId = '';
				});
			}

			//#2 add client info
			wrappedEvents = {
				// add client information to the set of wrapped events belonging to
				// the client
				clientName : client.get('name'),
				clientAddress : client.get('addressName'),
				clientAddressNumber : client.get('addressNumber'),
				clientCity : client.get('cityName'),
				eventlog : eventSummaries
			}
	
			eventsMap[client.id] = wrappedEvents;
		} else {
			console.log("Remove client: " + client.get('name') + " " + client.id + " - no events");
			clientIndexesWithoutEvents.push(uniqueClients.indexOf(client));
			
		}
	});
	
	clientIndexesWithoutEvents.forEach(function(index) {
		console.log("Removing unique client at: " + index);
		uniqueClients.splice(index, 1);
	});
	
	return {
		uniqueClients : uniqueClients,
		eventsMap : eventsMap,
	}
}

Parse.Cloud
		.job(
				"dailyEventReports",
				function(request, status) {
					Parse.Cloud.useMasterKey();

					var mail_template, content_template;

					var now = new Date();
					var yesterday = moment(new Date()).subtract(1, 'days')
							.toDate();

					// maps owners (Users) to wrapped events
					var wrappedEventsMap = {};
					var uniqueOwners = [];

					fetchTemplates()
							.then(function(templates) {
								// prepare templates

								mail_template = templates.mail_template;
								content_template = templates.content_template;

								console.log('templates found!');

								return findSummaryEvents(yesterday, now);

							})
							.then(
									function(events) {
										// send reports to clients

										console.log('summaries found: '
												+ events.length);

										var wrappedEvents = wrapEvents(events);
										var groupedEvents = groupByContactClient(wrappedEvents);
										var completeEvents = addClientAndGPSInfo(groupedEvents);

										var uniqueClients = completeEvents.uniqueClients;
										var eventsMap = completeEvents.eventsMap;

										console.log('unique clients found: '
												+ uniqueClients.length)

										var promises = [];

										uniqueClients
												.forEach(function(client) {

													var owner = client
															.get('owner');
													var wrappedEvents = eventsMap[client.id];

													// group wrapped events by owner
													if (wrappedEventsMap[owner.id]) {
														wrappedEventsMap[owner.id]
																.push(wrappedEvents);
													} else {
														wrappedEventsMap[owner.id] = [wrappedEvents];
														uniqueOwners
																.push(owner);
													}

													var clientEmail = client.get('email');
													var ownerEmail = owner
															.get('email');

													var hasEvents = wrappedEvents && (wrappedEvents.length > 0)
													var wantToReceiveEmail = client.get('receiveEventEmail');
													
													
													
													// only spend time creating
													// the clientReport if we
													// need it
													if (hasEvents && wantToReceiveEmail
															&& clientEmail) {

														var mailContents = createContent(
																content_template,
																wrappedEvents,
																owner);

//														console
//																.log(mailContents);
//														console
//																.log(wrappedEvents);
														 console.log('created content for ' + client.id + " length: " + mailContents.length);

														var clientReport = createReport(
																mail_template,
																mailContents,
																owner);

														var clientMailPromise = Mailing
																.sendHTMLEmail(
																		clientEmail,
																		ownerEmail,
																		"Vagt rapport "
																				+ moment(
																						new Date())
																						.subtract(
																								1,
																								'days')
																						.format(
																								'DD-MM-YYYY'),
																		clientReport);

														promises
																.push(clientMailPromise);
													}

												});

										return Parse.Promise.when(promises);

									})
							.then(
									function() {
										// send reports to owners

										console.log('found unique owners: '
												+ uniqueOwners.length);

										var promises = [];

										uniqueOwners
												.forEach(function(owner) {
													var wrappedEvents = wrappedEventsMap[owner.id];

													var ownerEmail = owner
															.get('email');
													var notification_receivers = owner.get('notificationEmails');

													if (wrappedEvents && wrappedEvents.length > 0) {
														var mailContents = createContent(
																content_template,
																wrappedEvents,
																owner);
														var ownerReport = createReport(
																mail_template,
																mailContents, owner);
	
														console.log(notification_receivers);
														
														var ownerMailPromise = Mailing
																.sendHTMLEmail(
																		notification_receivers,
																		ownerEmail,
																		"Vagt rapporter "
																				+ moment(
																						new Date())
																						.subtract(
																								1,
																								'days')
																						.format(
																								'DD-MM-YYYY'),
																		ownerReport);
	
														promises
																.push(ownerMailPromise);
													} else {
														console.log('Skipping empty wrapped event')
													}
												});

										return Parse.Promise.when(promises);

									}).then(function() {
								status.success("completed successfully");
							}, function(error) {
								if (error.message) {
									console.error(error.message);
									status.error(error.message);
								} else {
									console.error(error);
									status.error(error);
								}
							})

				});

Parse.Cloud.job("testEmailTemplate", function(request, status) {
	fetchTemplates.then(function(templates) {
		templateTest(templates.mail, templates.content, status);
	});

});

var templateTest = function(mail_template, content_template, status) {

	var content = createContent(
			content_template,
			[
					{
						clientName : 'Kunde 1',
						clientAddress : 'Addresse',
						clientAddressNumber : '1',
						clientCity : 'By',
						eventlog : [{
							objectId : 'test1',
							events : [{
								event : "Lys slukket",
								location : "hal",
								amount : "1",
								remarks : "lalala en længere bemærkning omkring hvad der er sket",
								time : "10.10",
							}]
						}],
					}, {
						clientName : 'Kunde 2',
						clientAddress : 'Addresse',
						clientAddressNumber : '1',
						clientCity : 'By',
						eventlog : [{
							objectId : 'test1',
							events : [{
								event : "Lys slukket",
								location : "hal",
								amount : "1",
								remarks : "lalala",
								time : "10.10",
							}]
						}, {
							objectId : 'test2',
							events : [{
								event : "Test1",
								location : "Bla",
								amount : "3",
								remarks : "intet at bemærke",
								time : "10.10",
							}, {
								event : "Test2",
								location : "alfk",
								amount : "43",
								remarks : "blbalbal",
								time : "10.10",
							}]
						}]
					}]);

	console.log(content);

	var report = createReport(mail_template, content, 'user');

	console.log(report);

	Mailing.sendHTMLEmail("cyrixmorten@gmail.com", "cyrixmorten@gmail.com",
			"Test", report).then(function() {
		status.success("completed successfully");
	});
}

Parse.Cloud
		.job(
				"sendEventEmailsToClients",
				function(request, status) {
					Parse.Cloud.useMasterKey();

					var querySentMails1 = new Parse.Query("CircuitStarted");
					querySentMails1.equalTo("sentMails", false);

					var querySentMails2 = new Parse.Query("CircuitStarted");
					querySentMails2.doesNotExist("sentMails");

					var query = Parse.Query
							.or(querySentMails1, querySentMails2);
					query.exists("timeEnded");
					query.exists("eventCount");
					query.include('owner');

					query
							.each(
									function(circuitStarted) {

										// console.log("found circuitStarted: "
										// + circuitStarted.get('name'));

										var sendCircuitUnitMailsPromise = new Parse.Promise();
										extractUniqueClients(circuitStarted)
												.then(
														function(result) {
															var uniqueClients = result.uniqueClients;
															var clientCircuitUnitsMap = result.clientCircuitUnitsMap;

															// console.log("found
															// uniqueClients: "
															// +
															// uniqueClients.length);

															createClientEventMails(
																	circuitStarted,
																	uniqueClients,
																	clientCircuitUnitsMap)
																	.then(
																			function(clientEventMailObjects) {

																				var owner_email = circuitStarted
																						.get(
																								'owner')
																						.get(
																								'emails');

																				var notification_receivers = circuitStarted
																						.get(
																								'owner')
																						.get(
																								'notificationEmails');

																				var circuitName = circuitStarted
																						.get('name');

																				var summaryHTML = "";
																				var summarySubject = "Tilsynsrapporter: "
																						+ circuitName;

																				var clientMailPromises = [];

																				clientEventMailObjects
																						.forEach(function(clientEventMailObject) {
																							var client = clientEventMailObject.client;
																							var email = clientEventMailObject.email;
																							var subject = clientEventMailObject.subject;
																							var html = clientEventMailObject.html;

																							if (html) {
																								var sendToClient = client
																										.get("receiveEventEmail")
																										&& email;
																								if (sendToClient) {
																									var mail = "<b>"
																											+ client
																													.get("name")
																											+ "</b><p></p>"
																											+ html;
																									clientMailPromises
																											.push(Mailing
																													.sendHTMLEmail(
																															email,
																															owner_email,
																															subject,
																															html));
																								}

																								var reportSent = (sendToClient)
																										? 'Ja'
																										: 'Nej';

																								summaryHTML += "<b><u>"
																										+ client
																												.get('name')
																										+ "</u></b><br>"
																										+ email;
																								summaryHTML += "<p></p>";
																								summaryHTML += "Rapport udsendt til kunden: "
																										+ reportSent;
																								summaryHTML += html
																										+ "<p></p>";
																							}
																						});

																				Parse.Promise
																						.when(
																								clientMailPromises)
																						.then(
																								function() {
																									// all
																									// done
																									// -
																									// send
																									// summary

																									// cancel
																									// summary
																									if (!summaryHTML) {
																										console
																												.log("No summary for "
																														+ circuitStarted
																																.get('name'));
																										markMailsSent(
																												circuitStarted,
																												sendCircuitUnitMailsPromise);
																										return;
																									}

																									var to = notification_receivers;
																									var replyto = owner_email;

																									Mailing
																											.sendHTMLEmail(
																													to,
																													replyto,
																													summarySubject,
																													summaryHTML)
																											.then(
																													function() {
																														markMailsSent(
																																circuitStarted,
																																sendCircuitUnitMailsPromise);
																													},
																													function(error) {
																														console
																																.error("Error at sendHTMLEmail");
																														circuitStarted
																																.set(
																																		"emailFailed",
																																		error);
																														circuitStarted
																																.set(
																																		"emailFailedContent",
																																		{
																																			to : to,
																																			replyto : replyto,
																																			subject : summarySubject,
																																			body : summaryHTML
																																		});
																														markMailsSent(
																																circuitStarted,
																																sendCircuitUnitMailsPromise);
																													});
																								},
																								function(error) {
																									console
																											.error("Error sending mail to clients");
																									circuitStarted
																											.set(
																													"emailFailed",
																													error);
																									markMailsSent(
																											circuitStarted,
																											sendCircuitUnitMailsPromise);
																								});

																			},
																			function(error) {
																				console
																						.error("Error at createClientEventMails "
																								+ error.message);
																				sendCircuitUnitMailsPromise
																						.reject(error.message);
																			});

														},
														function(error) {
															console
																	.error("Error at createClientEventMails "
																			+ error.message);
															sendCircuitUnitMailsPromise
																	.reject(error.message);
														});

										return sendCircuitUnitMailsPromise;

									},
									function() {
										status
												.success("completed successfully");
									}, function(error) {
										console.error(error.message);
										status.error(err.message);
									});

				});

var markMailsSent = function(circuitStarted, sendCircuitUnitMailsPromise) {
	circuitStarted.set("sentMails", true);
	circuitStarted.save().then(function() {
		// success
		sendCircuitUnitMailsPromise.resolve();
	});
};

var extractUniqueClients = function(circuitStarted) {
	var promise = new Parse.Promise();

	var circuitPointer = circuitStarted.get('circuit');

	var circuitUnitsQuery = new Parse.Query("CircuitUnit");
	circuitUnitsQuery.equalTo("circuit", circuitPointer);
	circuitUnitsQuery.include("client");

	circuitUnitsQuery.find().then(

			function(circuitUnits) {

				var uniqueClients = [];
				var clientCircuitUnitsMap = {};

				circuitUnits.forEach(function(circuitUnit) {
					if (circuitUnit.has("client")) {
						var circuitUnitClient = circuitUnit.get("client");
						var circuitUnitClientName = circuitUnitClient
								.get("name");

						if (clientCircuitUnitsMap[circuitUnitClientName]) {
							clientCircuitUnitsMap[circuitUnitClientName]
									.push(circuitUnit);
						} else {
							uniqueClients.push(circuitUnitClient);
							clientCircuitUnitsMap[circuitUnitClientName] = [];
							clientCircuitUnitsMap[circuitUnitClientName]
									.push(circuitUnit);
						}
					} else {
						// missing
						// client
					}
				});

				promise.resolve({
					uniqueClients : uniqueClients,
					clientCircuitUnitsMap : clientCircuitUnitsMap
				});

			});

	return promise;
};

var createClientEventMails = function(circuitStarted, uniqueClients, clientCircuitUnitsMap) {

	var createClientEventMailsPromise = new Parse.Promise();

	var promise = new Parse.Promise.as();

	var clientEventMailObjects = [];
	uniqueClients.forEach(function(client) {

		// var eventCreatedPromise = new Parse.Promise();
		promise = promise.then(function() {

			var clientName = client.get("name");
			var circuitUnits = clientCircuitUnitsMap[clientName];

			// console.log(clientName + " circuitUnits " + circuitUnits.length);

			return createEventTables(circuitStarted, circuitUnits).then(
					function(eventMail) {

						if (eventMail) {

							var clientEmail = client.get("email");

							var clientEventMailObject = {
								client : client,
								email : clientEmail,
								subject : "Tilsyns rapport for " + clientName,
								html : eventMail
							};

							// console.log("created mail for " + clientName + "
							// - " + circuitStarted.get('name') + " " +
							// eventMail.length);

							clientEventMailObjects.push(clientEventMailObject);
						}

					});
		});
	});

	promise = promise.then(function() {
		// all clientEventMailObjects created

		// console.log("done creating eventTables " +
		// clientEventMailObjects.length);
		createClientEventMailsPromise.resolve(clientEventMailObjects);
	});

	return createClientEventMailsPromise;
};

/*
 * Create a HTML formatted set of event tables based on a list of circuitUnits
 */
var createEventTables = function(circuitStarted, circuitUnits) {

	var createPromise = new Parse.Promise();

	var eventTables = "";

	var promise = new Parse.Promise.as();

	circuitUnits.forEach(function(circuitUnit) {
		promise = promise.then(function() {
			return createEventTable(circuitStarted, circuitUnit).then(
					function(eventTable) {
						if (eventTable) {
							eventTables += eventTable;
						}
					});
		});
	});

	promise = promise.then(function() {
		// event tables created
		// console.log("done creating event tables for " +
		// circuitStarted.get("name") + " " + eventTables.length);
		createPromise.resolve(eventTables);
	});

	return createPromise;
};

var createEventTable = function(circuitStarted, circuitUnit) {
	var promise = new Parse.Promise();

	var circuitTimeStarted = circuitStarted.get('timeStarted');
	var circuitTimeEnded = circuitStarted.get('timeEnded');

	var circuitUnitName = circuitUnit.get('name');
	var clientName = circuitUnit.get('client').get('name');

	var eventObjects = [];

	var eventQuery = new Parse.Query("EventLog");
	eventQuery.equalTo("circuitUnit", circuitUnit);
	eventQuery.greaterThan("createdAt", circuitTimeStarted);
	eventQuery.lessThan("createdAt", circuitTimeEnded);
	eventQuery.ascending("createdAt").find().then(function(events) {
		// console.log("eventCount: " + events.length + " at client " +
		// clientName);

		for (var i = 0; i < events.length; i++) {
			var event = events[i];

			var eventObject = {};

			if (event.get('eventCode') == 101) { // arrived
				eventObject.eventDate = event.createdAt;
			}

			eventObject.event = event.get("event") || '';
			eventObject.amount = event.get("amount") || '';
			eventObject.location = event.get("clientLocation") || '';
			eventObject.remarks = event.get("remarks") || '';

			if (event.get('eventCode') !== 102 && !event.get('automatic')) { // finished
				// and
				// automatic
				// events
				// excluded
				eventObjects.push(eventObject);
			}

		};

		if (events.length > 0) {
			// console.log("creating mail for " + circuitUnitName + " events: "
			// + events.length);
			var eventTable = eventTableToHTML(circuitUnitName, eventObjects);
			promise.resolve(eventTable);
		} else {
			// console.error("No events for " + circuitUnitName + " at " +
			// clientName);
			promise.resolve();
		}
	}, function(error) {
		console.error("find events: " + error.message);
		promise.reject(error);
	});

	return promise;
};

var eventTableToHTML = function(circuitUnitName, eventObjects) {

	mail = "";
	mail += "<p></p>";
	/*
	 * while (events.length > 0 && events[0].type == "Ankommet") {
	 * console.log("2: " + events[0].type); var event = events.shift(); var
	 * arrivedWrapper = dateToUserLocaleDate(event.eventDate); mail += "<b>Ankommet:</b> " +
	 * arrivedWrapper; }
	 */
	mail += "<table>";
	mail += "<caption>" + circuitUnitName + "</caption>";
	mail += "<tr>" // + "<td>" + arrivedWrapper + "</td>"
			+ "<th>Kl</th>" + "<th>Hændelse</th>" + "<th>Antal</th>"
			+ "<th>Placering</th>" + "<th>Bemærkning</th><th>Dato</th>"
			+ "</tr>";
	eventObjects
			.forEach(function(eventObject) {
				var eventTimeWrapper = dateToUserLocaleHoursAndMinutes(eventObject.eventDate);
				var eventDateWrapper = dateToUserLocaleDate(eventObject.eventDate);
				mail += "<tr>";
				// mail += "<td></td>";
				mail += "<td>" + eventTimeWrapper + "</td>";
				mail += "<td>" + eventObject.event + "</td>";
				mail += "<td>" + eventObject.amount + "</td>";
				mail += "<td>" + eventObject.location + "</td>";
				mail += "<td>" + eventObject.remarks + "</td>";
				mail += "<td>" + eventDateWrapper + "</td>";
				mail += "</tr>";
			});
	mail += "</table>";

	return mail;
};
