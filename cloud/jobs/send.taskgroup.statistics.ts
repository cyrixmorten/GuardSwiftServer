import * as _ from 'lodash';
import { TaskType } from '../../shared/subclass/Task';
import { ReportSettings, ReportSettingsQuery } from '../../shared/subclass/ReportSettings';
import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';
import { ClientContact } from '../../shared/subclass/ClientContact';
import { ReportToPDF } from '../pdf/report.to.pdf';
import { EmailData } from "@sendgrid/helpers/classes/email-address";
import { AttachmentData } from '@sendgrid/helpers/classes/attachment';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { User, UserQuery } from '../../shared/subclass/User';
import { ReportHelper } from '../utils/ReportHelper';
import sgMail = require("@sendgrid/mail");
import moment = require('moment');
import { Dictionary } from 'lodash';
import { TaskGroupStarted, TaskGroupStartedQuery } from '../../shared/subclass/TaskGroupStarted';
import { TaskgroupStartedStats as TaskGroupStartedData } from '../statistics/taskgroup.started.statistics';

export class SendTaskgroupStartedStatistics {

    constructor(private fromDate: Date, private toDate: Date) {}

    async sendToAllUsers(owner: User): Promise<void> {

        new UserQuery().isActive().build().each(async () => {

            const taskGroupsStarted: TaskGroupStarted[] = 
            await new TaskGroupStartedQuery()
                .matchingOwner(owner)
                .createdAfter(this.fromDate)
                .createdBefore(this.toDate)
                .build()
                .find({useMasterKey: true});

            const taskGroupsStartedData: TaskGroupStartedData[] =
                await Promise.all(_.map(taskGroupsStarted, (taskGroupStarted) => {
                    return new TaskGroupStartedData(taskGroupStarted).fetch()
                }))

        }, {useMasterKey: true});


    }

 
}