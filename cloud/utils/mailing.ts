// import * as SendGrid from "sendgrid";
// import * as _ from 'lodash';
//
// SendGrid.initialize("cyrixmorten", "spinK27N2");
//
// Parse.Cloud.define("sendHTMLmail", function (request, response) {
//
//     let options = {
//         to: request.params.to,
//         replyTo: request.params.replyTo,
//         subject: request.params.subject,
//         html: request.params.html,
//         from: request.params.from,
//         bcc: request.params.bcc
//     };
//
//
//     if (!options.to) {
//         response.error("401 missing to");
//         return;
//     }
//
//     if (!options.subject) {
//         response.error("402 missing subject");
//         return;
//     }
//
//     if (!options.html) {
//         response.error("403 missing html");
//         return;
//     }
//
//     let email = MailUtils.createEmail(options);
//
//
//     MailUtils.sendMail(email).done(function () {
//         response.success("Email successfully sent!");
//     }).fail(function (error) {
//         response.error("An error occured while sending email")
//     });
//
// });
//
// export class MailUtils {
//
//     static emailSendFailed = function (email_failed, result) {
//         if (!email_failed) {
//             return;
//         }
//
//         let message = 'Hej, der let desværre problemer med at afsende en eller flere emails <br/><br/>'
//             + 'Detaljer om mailen:<br/>'
//             + '------------------<br/>'
//             + 'Modtagere: $receivers <br/>'
//             + 'Emne: $subject <br/>'
//             + 'Indhold: <br/>'
//             + '$body <br/>'
//             + '------------------<br/><br/>'
//             + 'Fejlbesked fra serveren: $error';
//
//         message = message.replace('$receivers', JSON.stringify(email_failed.to));
//         message = message.replace('$subject', email_failed.subject);
//         message = message.replace('$body', email_failed.html);
//         message = message.replace('$error', result.status
//             + ': ' + JSON.stringify(result.data.message));
//
//         let email = SendGrid.Email({
//             to: email_failed.replyto
//         });
//         email.setSubject('GuardSwift - Fejl ved afsendelse af email');
//         email.setFrom('noreply@guardswift.com');
//         email.setHTML(message);
//         SendGrid.send(email);
//
//         console.error("Notify sender:");
//         console.error(JSON.stringify(email));
//         console.error("---");
//
//     };
//
//     static sendTextEmail = function (to, replyto, subject, mail, from) {
//
//         let promise = new Parse.Promise();
//
//         let email = SendGrid.sendEmail({
//             to: to,
//             replyto: replyto,
//             from: (from) ? from : "noreply@guardswift.com",
//             subject: subject,
//             text: mail
//         }, {
//             success: function (httpResponse) {
//                 console.log(httpResponse);
//                 promise.resolve(httpResponse);
//
//             },
//             error: function (httpResponse) {
//
//                 MailUtils.emailSendFailed(email, httpResponse);
//
//                 console.error(httpResponse);
//                 promise.reject(httpResponse);
//
//             }
//         });
//
//         return promise;
//
//     };
//
//     static createEmail = function (options) {
//
//         console.log("createEmail: " + JSON.stringify(options));
//
//         let fromMail = (options.from) ? options.from : "jvh@guardswift.com";
//         let replyMail = (options.replyTo) ? options.replyTo : "cyrixmorten@gmail.com";
//
//         let email = SendGrid.Email({
//             to: options.to
//         });
//         email.setSubject(options.subject);
//         email.setHTML(options.html);
//         if (options.text) {
//             email.setText(options.text);
//         }
//         if (options.bcc) {
//             email.addBcc(options.bcc);
//         }
//         email.setReplyTo(replyMail);
//         email.setFrom(fromMail);
//
//         return email;
//     };
//
//     static sendMail = function (email) {
//         return SendGrid
//             .send(email)
//             .fail(function (result) {
//                 MailUtils.emailSendFailed(email, result)
//             });
//     };
//
//     static sendHTMLEmail = function (to, replyTo, subject, html, from) {
//
//         let email = MailUtils.createEmail({
//             to: to,
//             replyTo: replyTo,
//             subject: subject,
//             html: html,
//             from: from
//         });
//
//         return MailUtils.sendMail(email);
//     };
//
//
// }