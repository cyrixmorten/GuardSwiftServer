var moment = require('cloud/lib/moment/moment-timezone.js');
var _ = require('underscore');

var Base64 = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode : function(e) {
		var t = "";
		var n, r, i, s, o, u, a;
		var f = 0;
		e = Base64._utf8_encode(e);
		while (f < e.length) {
			n = e.charCodeAt(f++);
			r = e.charCodeAt(f++);
			i = e.charCodeAt(f++);
			s = n >> 2;
			o = (n & 3) << 4 | r >> 4;
			u = (r & 15) << 2 | i >> 6;
			a = i & 63;
			if (isNaN(r)) {
				u = a = 64
			} else if (isNaN(i)) {
				a = 64
			}
			t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o)
					+ this._keyStr.charAt(u) + this._keyStr.charAt(a)
		}
		return t
	},
	decode : function(e) {
		var t = "";
		var n, r, i;
		var s, o, u, a;
		var f = 0;
		e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		while (f < e.length) {
			s = this._keyStr.indexOf(e.charAt(f++));
			o = this._keyStr.indexOf(e.charAt(f++));
			u = this._keyStr.indexOf(e.charAt(f++));
			a = this._keyStr.indexOf(e.charAt(f++));
			n = s << 2 | o >> 4;
			r = (o & 15) << 4 | u >> 2;
			i = (u & 3) << 6 | a;
			t = t + String.fromCharCode(n);
			if (u != 64) {
				t = t + String.fromCharCode(r)
			}
			if (a != 64) {
				t = t + String.fromCharCode(i)
			}
		}
		t = Base64._utf8_decode(t);
		return t
	},
	_utf8_encode : function(e) {
		e = e.replace(/\r\n/g, "\n");
		var t = "";
		for (var n = 0; n < e.length; n++) {
			var r = e.charCodeAt(n);
			if (r < 128) {
				t += String.fromCharCode(r)
			} else if (r > 127 && r < 2048) {
				t += String.fromCharCode(r >> 6 | 192);
				t += String.fromCharCode(r & 63 | 128)
			} else {
				t += String.fromCharCode(r >> 12 | 224);
				t += String.fromCharCode(r >> 6 & 63 | 128);
				t += String.fromCharCode(r & 63 | 128)
			}
		}
		return t
	},
	_utf8_decode : function(e) {
		var t = "";
		var n = 0;
		var r = c1 = c2 = 0;
		while (n < e.length) {
			r = e.charCodeAt(n);
			if (r < 128) {
				t += String.fromCharCode(r);
				n++
			} else if (r > 191 && r < 224) {
				c2 = e.charCodeAt(n + 1);
				t += String.fromCharCode((r & 31) << 6 | c2 & 63);
				n += 2
			} else {
				c2 = e.charCodeAt(n + 1);
				c3 = e.charCodeAt(n + 2);
				t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3
						& 63);
				n += 3
			}
		}
		return t
	}
}
Parse.Cloud.job("eventDistanceToClient", function(request, status) {
	
	Parse.Cloud.useMasterKey();
	
	
	
	var gnutitle = "#date \t\t dist \t\t inGeofence \t\t inSchedule \t\t actOther \t\t automatic \t\t activity\n"
	var gnutitle2 = "# \t\t #inGeofence \t\t #inSchedule \t\t #actOther \t\t #automatic \t\t #total\n";
	
	var total = 0;
	var inGeofenceCount = 0;
	var inScheduleCount = 0;
	var actOtherCount = 0;
	var automaticCount = 0;
	
	var gnustr = gnutitle;
	var extractInfo = function(eventlog) {
		var daystr = moment(eventlog.createdAt).format('YYYY-MM-DD');
		var clientDistance = eventlog.get('clientDistance');
		var inGeofence = clientDistance < 200;
		if (inGeofence) {
			console.log(" -- inGeofence -- ");
			inGeofenceCount++;
		}
		
		var inSchedule = eventlog.get('withingScheduledTime');
		if (inSchedule) {
			console.log(" -- inSchedule -- ");
			inScheduleCount++;
		}
		
		var actOther = 0 !== eventlog.get('activityType');
		if (actOther) {
			console.log(" -- actOther -- ");
			actOtherCount++;
		}
		
		var automatic = eventlog.get('automatic');
		if (inGeofence && inSchedule && actOther || automatic) {
			console.log(" -- automatic -- ");
			var automatic = true;
			automaticCount++;
		}
		var activity = eventlog.get('activityName');
		
		gnustr += daystr 			+ " \t\t " +
				  clientDistance 	+ " \t\t " + 
				  inGeofence 		+ " \t\t " + 
				  inSchedule 		+ " \t\t " +
				  actOther 			+ " \t\t " + 
				  automatic 		+ " \t\t " +
				  activity 			+ "\n"
				  
		total++;
	};
	

				  
	
	// query
	var query = new Parse.Query("EventLog");
	query.include('client');
	query.exists('withingScheduledTime');
	query.exists('deviceTimestamp');
	query.exists('circuitUnit');
	query.exists('client');
	
	var date = new Date(2015,8,0);
	console.log(date);
	query.greaterThan('deviceTimestamp', date);
	query.lessThan('clientDistance', 500);
	 
	query.equalTo('task_event', 'ARRIVE');
	
	query.each(function(object) {
		var client = object.get('client');
		
		if (client) {
			var clientPosition = client.get('position');
			var eventPosition = object.get('position');
			
			if (clientPosition && eventPosition) {
				var distance = eventPosition.kilometersTo(clientPosition);
				object.set('clientDistance', distance*1000);
			}
		} else {
			console.log('missing client!');
		}
		
		extractInfo(object);
		
		return object.save();
	}).then(function() {
		var gnustr2 = gnutitle2 + 
		  inGeofenceCount	+ "\t\t" +
		  inScheduleCount	+ "\t\t" +
		  actOtherCount		+ "\t\t" + 
		  automaticCount	+ "\t\t" + 
		  total;
		
		var base64 = Base64.encode(gnustr); 
		var base64_2 = Base64.encode(gnustr2); 
		var file = new Parse.File("arriveEventLogStats.txt", {
			base64 : base64
		});
		var file2 = new Parse.File("arriveEventLogCounts.txt", {
			base64 : base64_2
		});
		file.save().then(function() {
			return file2.save();
		}).then(function() {
			// The file has been saved to Parse.
			var statistics = new Parse.Object("Statistics");
			
			statistics.set("arriveEventLogStats", file);
			statistics.set("arriveEventLogCounts", file2);
			statistics.save().then(function() {
				status.success("completed successfully.");
			});

		}, function(error) {
			// The file either could not be read, or could not be saved to
			// Parse.
			console.error(error);
			status.error(error.message);
		});
	}, function(error) {
		console.error(error);
		status.error(error.message);
	});
});

Parse.Cloud.job("withinScheduleEventLogs", function(request, status) {
	
	Parse.Cloud.useMasterKey();
	
	var minutesOfDay = function(m){
		return m.minutes() + m.hours() * 60;
	}
	
	
	
	
	var query = new Parse.Query("EventLog");
	query.include('circuitUnit');
	query.exists('deviceTimestamp');
	query.exists('circuitUnit');
	// --
	query.doesNotExist('withingScheduledTime');
	
	query.each(function(object) {
		if (object.has('deviceTimestamp')) {
			
			var date = moment(object.get('deviceTimestamp'));
			var modDate = minutesOfDay(date);
			
			if (object.has('timeStart') && object.has('timeEnd')) {
				var scheduledStart = moment(object.get('timeStart'));
				var scheduledEnd = moment(object.get('timeEnd'));
				
				var modStart = minutesOfDay(scheduledStart);
				var modEnd = minutesOfDay(scheduledEnd);
				
//				var withinScheduledTime = false;
				var minutesOffSchedule = 0;
				// before start
				if (modDate < modStart) {
					minutesOffSchedule = modDate-modStart;
				}
				// after end
				if (modDate > modEnd) {
					minutesOffSchedule = modDate-modEnd;
				}
				// within
//				if (modDate > modStart && modDate < modEnd) {
//					withinScheduledTime = true;
//				}
				
				object.set('minutesOffSchedule', minutesOffSchedule);
				object.set('withingScheduledTime', (minutesOffSchedule == 0));
			}
		}
		return object.save();
	}).then(function() {
		status.success("completed successfully.");
	}, function(error) {
		console.error(error);
		status.error(error.message);
	});
});

Parse.Cloud.job("usageEventLogs", function(request, status) {

	Parse.Cloud.useMasterKey();

	// query.limit(100);

	// holds a summeary of eventCount for each owner for each day
	var dayArray = [];
	// holds a summary of eventCount for each owner for a single day before
	// committed to dayBuckets
	var ownerBucket = [];
	var uniqueOwners = [];

	var prevDate = undefined;
	var prevDay = -1;

	var counter = 0;


	var processEventLogs = function(objects) {

		ownerBucket = [];

		_.each(objects, function(object) {
			var date = object.createdAt;
			var day = date.getDay();

			if (day !== prevDay && prevDay !== -1) {
				var daystr = moment(prevDate).format('YYYY-MM-DD');
				// commit
				dayArray.push({
					date : prevDate,
					day : daystr,
					ownerBucket : ownerBucket
				});
				
				var from = moment(prevDate);
				var to = moment(date);
				var days = to.diff(from, 'days');
				
//				console.log("padding days: " + days);
//				console.log("from: " + prevDate);
//				console.log("to: " + date);
				
				while (days > 1) {
					from = from.add(1, 'days');
					var daystr = moment(from).format('YYYY-MM-DD');
					dayArray.push({
						date : from,
						day : daystr,
						ownerBucket : []
					})
					days--;
				}
				
				ownerBucket = [];
			}

			prevDay = day;
			prevDate = date;

			var owner = object.get("owner");
			if (owner) {
				var ownerid = owner.id;
	
				if (uniqueOwners.indexOf(ownerid) == -1) {
					uniqueOwners.push(ownerid);
				}
	
				if (ownerBucket[ownerid]) {
					var eventCount = ownerBucket[ownerid];
					eventCount++;
					ownerBucket[ownerid] = eventCount;
				} else {
					ownerBucket[ownerid] = 1;
				}
			} else {
				// skip
			}

		});
	};

	
	var generateAndSaveGnuplot = function() {

//		var padMissingDaysZero = function(from, to) {
//			var from = moment(from);
//			var to = moment(to);
//			var days = from.diff(to, 'days')
//
//			var padding = "";
//			if (days > 0) {
//				console.log('padding missing days: ' + days);
//				for (i = 1; i<days; i++) {
//					from = from.add(1, 'd'); // add 1 day to 'from'
//					var gnuentry = moment(from).format('YYYY-MM-DD');
//					uniqueOwners.forEach(function(owner) {
//						gnuentry += "\t\t" + 0;
//					});
//					padding += gnuentry;
//				}
//			}
//			return padding;
//		}
		
		console.log("--- uniqueOwners: " + uniqueOwners.length);

		var gnustr = "";
		var gnutitle = "#day"
		uniqueOwners.forEach(function(owner) {
			gnutitle += "\t\t" + owner;
		})
		gnustr += gnutitle + "\n";
		for (var i = 0; i < dayArray.length; i++) {
			var date = dayArray[i].date;
			var day = dayArray[i].day;
			var ownerBucketDay = dayArray[i].ownerBucket;
			
//			if (i !== 0) {
//				/**
//				 * Add missing days as 0-padded entries to the plot
//				 */
//				var prevDate = dayArray[i-1].date;
//				gnustr = padMissingDaysZero(prevDate, date);
//			}
//			console.log("day: " + day);

			var gnuentry = day;
			uniqueOwners.forEach(function(owner) {
				var dayCount = ownerBucketDay[owner] || 0;
				gnuentry += "\t\t" + dayCount;
			});
//			console.log(gnuentry)
			// for ( var key in ownerBucketDay) {
			// if (ownerBucketDay.hasOwnProperty(key)) {
			// gnuentry += "\t"
			// console.log(key + " -> " + ownerBucketDay[key]);
			// }
			// }
			gnustr += gnuentry + "\n"
		}


//		console.log("--- gnuplot:");
//		console.log(gnustr);

		var base64 = Base64.encode(gnustr); // "V29ya2luZyBhdCBQYXJzZSBpcyBncmVhdCE=";
		var file = new Parse.File("dailyEventsCount.txt", {
			base64 : base64
		});
		file.save().then(function() {
			// The file has been saved to Parse.
			var statistics = new Parse.Object("Statistics");

			statistics.set("dailyEventLogs", file);
			statistics.save().then(function() {
				status.success("completed successfully.");
			});

		}, function(error) {
			// The file either could not be read, or could not be saved to
			// Parse.
			console.error(error);
			status.error(error.message);
		});

	};

	var queryDate = undefined;
	
	var fetchEventLogs = function(limit, loopCount) {
		var query = new Parse.Query("EventLog");
		query.ascending("createdAt");
		if (loopCount !== 0 && (loopCount % 10) == 0) {
			if (!prevDate) {
				return new Parse.Promise.error("Missing prevDate loopCount: " + loopCount);
			}
			if (queryDate && queryDate.getTime() == prevDate.getTime()) {
				return new Parse.Promise.error("Same date: " + prevDate + " loopCount: " + loopCount);
			}
			
			queryDate = prevDate; // workaround for skip limit of 10.000
		}
		if (queryDate) {
			query.greaterThan("createdAt", queryDate);
		}
		var skip = limit * (loopCount % 10);
		
		console.log("fetchEventLogs skip: " + skip + " loopCount: " + loopCount + " gt: " + queryDate);
		query.limit(limit);
		query.skip(skip);
		return query.find();
	};
	
	/** DO WORK **/
	
	var recusiveEventLogProcess = function(limit, loopCount) {

		console.log("Recursive: " + loopCount);
		
		fetchEventLogs(limit, loopCount).then(function(objects) {
			processEventLogs(objects);
			
			loopCount++;
			var update = (loopCount * limit) + " logs processed.";
			status.message(update);
			console.log(update);
			
			if (objects.length == limit) {
				// still more work to do
				recusiveEventLogProcess(limit, loopCount);
			} else {
				generateAndSaveGnuplot();
			}
		}, function(error) {
			console.error(error);
			status.error(error.message);
		});

	};
	
	
	recusiveEventLogProcess(1000, 0); // Kickoff!

});
