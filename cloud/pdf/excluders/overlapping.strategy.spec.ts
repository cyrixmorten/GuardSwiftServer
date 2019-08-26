import { ExcludeStrategy } from './exclude.stragegy';
import { EventLog, TaskEvent } from '../../../shared/subclass/EventLog';
import { TaskType, Task } from '../../../shared/subclass/Task';
import * as moment from 'moment-timezone';
import { ReportEventFilters } from '../report.event.filters';
import _ = require('lodash');
import 'mocha';
import * as chai from 'chai';

chai.should();

describe('Overlapping strategy', () => {

    context('single task', () => {

        it('should return -1 when the value is not present', () => {
          [1, 2, 3].indexOf(4).should.eq(-1);
        });
        
      });

});