var moment = require('cloud/lib/moment/moment-timezone.js');
var s = require("cloud/lib/underscore.string.min.js");
var _ = require('underscore');

var Mailing = require("cloud/mailing.js");

var timeZone = 'Europe/Copenhagen'; // todo load from user(owner)

var groupReportsByClient = function(reports) {

	var reportsMap = {}; // map from client to reports

	// combine all reports under the same client
	_.each(reports, function(report) {

		var client = report.get('client');
		var owner = report.get('owner');
		var clientId = client.id;

		if (!reportsMap[clientId]) {
			// create new mapping
			reportsMap[clientId] = {
				client : client,
				owner : owner,
				reports : [report]
			};
		} else {
			// add report to existing mapping
			reportsMap[clientId].reports.push(report)
		}

	});

	return reportsMap;
};

var findReports = function(user, fromTime, toTime) {
	// console.log('findReports from: ' + fromTime + " to: " + toTime);

	var reportQuery = new Parse.Query("Report");

	reportQuery.equalTo('owner', user);
	reportQuery.notEqualTo('taskTypeName', 'STATIC');
	reportQuery.greaterThan("deviceTimestamp", fromTime);
	reportQuery.lessThan("deviceTimestamp", toTime);
	reportQuery.include(['owner', 'client', 'client.contacts']);
	reportQuery.ascending("deviceTimestamp");

	return reportQuery.find();
};

var reportURL = function(reportId) {
	return "http://www.guardswift.com/#/report/view/" + reportId;
};

var linkHTMLref = function(url) {
	return "<a href='" + url + "' target='_blank'>" + url + "</a>";
};

var linkHTMLmailto = function(mail, name) {
	var email = (name) ? name + "(" + mail + ")" : mail;
	return "<a href='mailto:" + name + "'>" + mail + "</a>";
};

var mailReport_DK = function(user, client, reports, datemoment) {

	var formatted_date = datemoment.format('DD-MM-YYYY');

	var subject = "Vagtrapporter for " + formatted_date;

	// var header = "Hej " + client.name;

	var plural = (reports.length > 1);

	var report_plural = (plural) ? "rapporter" : "rapport";
	var report_ref_plural = (plural) ? "rapporterne" : "rapporten";
	var link_plural = (plural) ? "links" : "link";

	var status = "Der er oprettet " + reports.length + " " + report_plural;
	// + " " + formatted_date;

	var info = s.capitalize(report_ref_plural)
			+ " kan findes ved at følge disse " + link_plural + ":";

	// TODO image header company logo

	var content_header = "";// "<b>" + header + "</b>\n\n"
	content_header += status + "<br />";
	content_header += info + "<br /><br />";

	var content_body = "";
	// var reportHTMLUrls = [];
	_.each(reports, function(report) {
		var reportId = report.get('reportId');
		var url = linkHTMLref(reportURL(reportId));
		// reportHTMLUrls.push(reportURL);
		var type = (report.get('type'))
				? report.get('type')
				: "Tilsyn:";
		content_body += "<b>"+type + "</b> " + url + "<br />";
	});

	// TODO footer og info om afmelding
	var content_footer = "";

	return {
		client : client,
		reports : reports,
		mail : {
			subject : subject,
			content : content_header + content_body + content_footer,
			content_header : content_header,
			content_body : content_body,
			content_footer : content_footer
		}
	// reportHTMLUrls : reportHTMLUrls,
	};

};

/*
 * Assumes that contacts has been included in client Returns contacts that has
 * receiveReport set to true and a valid email
 */
// var reportReceivers = function(client) {
// var contacts = client.get('contacts');
// var receivers = [];
// _.each(contacts, function(contact) {
// var email = contact.get('email');
// var receiveReports = contact.get('receiveReports');
// if (receiveReports && email) {
// receivers.push(contact);
// }
// });
// return receivers;
// };
// TODO move to utility exports
var makePublicReadable = function(objects) {
	var updated = [];
	_.each(objects, function(object) {

		var updateACL = false;

		var acl = object.getACL();
		if (typeof acl === 'undefined') {
			acl = new Parse.ACL();
			acl.setPublicReadAccess(true);
			acl.setPublicWriteAccess(false);

			updateACL = true;
		} else if (!acl.getPublicReadAccess()) {
			acl.setPublicReadAccess(true);

			updateACL = true;
		}

		if (updateACL) {
			object.setACL(acl);
			updated.push(object);
		}
	});
	return Parse.Object.saveAll(updated);
};

var createMailReports = function(user, from, to) {

	/*
	 * mailReport = { client reports mail : { subject content content_header
	 * content_body content_footer } sendToContacts }
	 */
	var mailReports = [];

	var promise = new Parse.Promise();

	findReports(user, from.toDate(), to.toDate()).then(
			function(reports) {

				var reportsMap = groupReportsByClient(reports);

				for ( var clientId in reportsMap) {
					if (reportsMap.hasOwnProperty(clientId)) {
						var reportMap = reportsMap[clientId];
						var client = reportMap.client;
						var groupedReports = reportMap.reports;

						var mailReport = mailReport_DK(user, client,
								groupedReports, from);

						var receivingContacts = _.filter(
								client.get('contacts'), function(contact) {
									return contact.get('receiveReports')
											&& contact.get('email');
								});
						mailReport.sendToContacts = receivingContacts;

						mailReports.push(mailReport);
					}
				}

				return makePublicReadable(reports);
			}).then(function() {
		promise.resolve(mailReports);
	}, function(error) {
		console.error(error);
		promise.resolve(error.message);
	});

	return promise;
};

var createGuardingCompanyReport = function(user, mailReports) {
	var companyReport = "";
	companyReport += "Samlet antal rapporter: " + mailReports.length
			+ "<br /><br />";

	_.each(mailReports, function(mailReport) {
		companyReport += "<b>" + mailReport.client.get('name')
				+ "</b> <br />";
		companyReport += "Antal tilsyn: " + mailReport.reports.length
				+ "<br />";
		companyReport += "Rapporter afsendt: "
				+ mailReport.sendToContacts.length + "<br /><br />";
		if (mailReport.sendToContacts.length > 0) {
			companyReport += "Til følgende kontaktpersoner: <br />";
			_.each(mailReport.sendToContacts, function(contact) {
				companyReport += linkHTMLmailto(contact.get('email'), contact
						.get('name'))
						+ " <br />";
			});
		}
		companyReport += "<br /><br />";
		companyReport += mailReport.mail.content_body;
		companyReport += "<br /><br />";
	});
	return companyReport;
};

var wrapHTMLbody = function(str) {
	return "<html><body>" + str + "</body></html>";
}


var sendCombinedReportToDeveloper = function(allMailReportsForUsers, momentdate) {

	var promises = [];
	
	var mailSubject = "GuardSwift vagt rapporter "
			+ momentdate.format('DD-MM-YYYY')

	devReport = "";
	
	_.each(allMailReportsForUsers, function(allMailReportsForUser) {
		var user = allMailReportsForUser.user;
		var mailReports = allMailReportsForUser.clientMailReports;

		devReport += "<b>--- " + user.get('username') + " ("+mailReports.length+") rapporter---</b><br /> ";

		if (mailReports.length > 0) {
			// send to company
			var companyName =  user.get('username');
			var companySubject = mailSubject + " " + companyName;
			var companyReport = createGuardingCompanyReport(user, mailReports);
			var companyReceivers = user.get('notificationEmails') || [];

			if (companyReceivers.length > 0) {
				
				console.log("sending " + mailReports.length + " reports to company " + user.get('username') + " : " + JSON.stringify(companyReceivers));
				
				var companyMail = Mailing.sendHTMLEmail(companyReceivers, "cyrixmorten@gmail.com", companySubject, wrapHTMLbody(companyReport));
				promises.push(companyMail);
			}
			
			// add to developer report
			devReport += "Receivers: " + JSON.stringify(companyReceivers) + "<br /><br />";
			devReport += companyReport;
			
			// send to clients
			_.each(mailReports, function(mailReport) {
				var client = mailReport.client;
				var clientSubject = mailReport.mail.subject + " " + client.get('name');
				var clientReport = mailReport.mail.content;
				var clientReceivers = [];
				_.each(mailReport.sendToContacts, function(contact) {
					clientReceivers.push(contact.get('email'));
				});
				
				
				if (clientReceivers.length > 0) {
					
					console.log("sending " + mailReport.reports.length + " reports to client " + client.get('name') + " : " + JSON.stringify(clientReceivers));
					
					var clientMail = Mailing.sendHTMLEmail(clientReceivers, user.get('email') || '', clientSubject, wrapHTMLbody(clientReport), "report@guardswift.com");
					promises.push(clientMail);
				}
			});
			
		}
	});

	var developerMail = Mailing.sendHTMLEmail("cyrixmorten@gmail.com", "cyrixmorten@gmail.com", mailSubject, wrapHTMLbody(devReport));
	promises.push(developerMail);
	
	return Parse.Promise.when(promises)
};

Parse.Cloud.job("dailyMailReports", function(request, status) {
	Parse.Cloud.useMasterKey();

	var mail_template, content_template;

	var now = moment();
	var yesterday = moment().subtract(1, 'days');

	var allMailReportsForUsers = [];

	var query = new Parse.Query(Parse.User);
	query.find().then(
			function(users) {
				console.log("Users: " + users.length);
				var promises = [];
				_.each(users, function(user) {
					promises.push(createMailReports(user, yesterday, now).then(
							function(clientMailReports) {
								allMailReportsForUsers.push({
									user : user,
									clientMailReports : clientMailReports
								});
							}));
				});
				return Parse.Promise.when(promises);
			}).then(
			function() {
				// all reports generated

				// send combined summary of all users
				return sendCombinedReportToDeveloper(allMailReportsForUsers,
						yesterday);
			}).then(function() {
		// all done
		status.success('Done generating mail reports');
	}, function(error) {
		console.error(error);
		status.error(error);
	});

});
