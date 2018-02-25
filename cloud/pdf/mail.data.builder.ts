
import {AttachmentData} from "@sendgrid/helpers/classes/attachment";
import {EmailData} from "@sendgrid/helpers/classes/email-address";
import {MailData} from "@sendgrid/helpers/classes/mail";

export interface IMailDataBuilder {
    getFrom(): Promise<EmailData>;
    getTo(): Promise<EmailData[]>;
    getBccs(): Promise<EmailData[]>;
    getReplyTo(): Promise<EmailData>;
    getSubject(): Promise<string>;
    getText(): Promise<string>;
    getAttachments(): Promise<AttachmentData[]>;
    getMailData(): Promise<MailData>
}

export abstract class MailDataBuilder implements IMailDataBuilder {

    async getMailData(): Promise<MailData> {
        return {
            from: await this.getFrom(),
            to: await this.getTo(),
            bcc: await this.getBccs(),
            replyTo: await this.getReplyTo(),
            subject: await this.getSubject(),
            text: await this.getText(),
            attachments: await this.getAttachments()
        }
    }

    getFrom(): Promise<EmailData> {
        throw new Error("Method not implemented.");
    }

    getTo(): Promise<EmailData[]> {
        throw new Error("Method not implemented.");
    }

    getBccs(): Promise<EmailData[]> {
        throw new Error("Method not implemented.");
    }

    getReplyTo(): Promise<EmailData> {
        throw new Error("Method not implemented.");
    }

    getSubject(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    getText(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    getAttachments(): Promise<AttachmentData[]> {
        throw new Error("Method not implemented.");
    }

}