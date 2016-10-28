// var Stripe = require('stripe');
// //Stripe.initialize('sk_test_y4HoOKj2iIjOdnAVjrcY6Uu8');
// Stripe.initialize('sk_live_LEAHykazQ0wNiBYWyog3q9tE');
//
//
// Parse.Cloud.define("stripePayment", function(request, response) {
//	
// 	var chargeObject = request.params.chargeObject;
//	
// 	console.log(chargeObject);
//
// 	Stripe.Charges.create(chargeObject, {
// 		success : function(httpResponse) {
// 			console.log(httpResponse);
// 			response.success(httpResponse);
// 		},
// 		error : function(httpResponse) {
// 			console.error(httpResponse);
// 			// response.error returns null to caller
// 			response.success(httpResponse);
// 		}
// 	});
// });
