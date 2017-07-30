var _ = require('lodash');
var excludeMigrated = function (query) {
    query.notEqualTo('isMigrated', true);
};
var markMigratedAndSave = function (object) {
    object.set('isMigrated', true);
    return object.save(null, { useMasterKey: true });
};
var migratePointer = function (pointer, toClass, toColName, object) {
    console.log('migratePointer', pointer, toClass, toColName);
    if (!pointer) {
        return Parse.Promise.as('');
    }
    var query = new Parse.Query(toClass);
    query.equalTo('prevId', pointer.id);
    return query.first({ useMasterKey: true }).then(function (newPointerObject) {
        if (!newPointerObject) {
            throw new Error(toClass + ' not found');
        }
        var pointer = Parse.Object.extend(toClass).createWithoutData(newPointerObject.id);
        object.set(toColName, pointer);
        console.log('Writing pointer', toColName, pointer);
        return newPointerObject;
    }, function (e) {
        console.error(e);
        return Parse.Promise.as('');
    });
};
var migrateRegularTasks = function (forClass) {
    var query = new Parse.Query(forClass);
    query.exists('circuitStarted');
    excludeMigrated(query);
    return query.each(function (object) {
        return migratePointer('circuitStarted', 'TaskGroupStarted', 'taskGroupStarted', object)
            .then(migratePointer('circuitUnit', 'Task', 'task', object))
            .then(function (task) {
            if (task) {
                object.set('taskType', task.get('taskType'));
            }
            return markMigratedAndSave(object);
        });
    }, { useMasterKey: true });
};
var migrateStaticTasks = function (forClass) {
    var query = new Parse.Query(forClass);
    excludeMigrated(query);
    return query.each(function (object) {
        return migratePointer('staticTask', 'Task', 'task', object)
            .then(function (task) {
            if (task) {
                object.set('taskType', task.get('taskType'));
            }
            return markMigratedAndSave(object);
        });
    }, { useMasterKey: true });
};
var migrate = function (options, beforeAttr, beforeSave) {
    console.log('perform migrate', options);
    var prevQuery = new Parse.Query(options.fromClass);
    excludeMigrated(prevQuery);
    // prevQuery.addDescending('createdAt');
    // prevQuery.limit(10);
    // return prevQuery.find({useMasterKey: true}).then((prevObjects) => {
    //     _.forEach(prevObjects, (prevObject) => {
    return prevQuery.each(function (prevObject) {
        console.log('Look for existing', options.toClass, options.toClass);
        var existingQuery = new Parse.Query(options.toClass);
        existingQuery.equalTo('prevId', prevObject.id);
        return existingQuery.first({ useMasterKey: true }).then(function (exsitingObject) {
            var NewClass = Parse.Object.extend(options.toClass);
            var newObject = new NewClass();
            if (exsitingObject) {
                console.log('Found existing:', exsitingObject.id);
                newObject = exsitingObject;
            }
            else {
                console.log('Creating new');
            }
            console.log('prevObject.attributes: ', prevObject.attributes);
            var fieldNames = [];
            // copy attributes
            Object.keys(prevObject.attributes).forEach(function (fieldName) {
                var attribute = fieldName;
                if (_.isFunction(beforeAttr)) {
                    attribute = beforeAttr(fieldName);
                }
                if (!_.isEmpty(attribute)) {
                    newObject.set(attribute, prevObject.get(fieldName));
                }
                fieldNames.push(attribute);
            });
            console.log('fieldNames: ', _.compact(fieldNames));
            if (options.taskType) {
                newObject.set('taskType', options.taskType);
            }
            newObject.set('prevId', prevObject.id);
            var beforeSavePromise = function () {
                if (_.isFunction(beforeSave)) {
                    console.log('Calling beforeSaveCallback');
                    return beforeSave(prevObject, newObject);
                }
                console.log('No beforeSaveCallback passed');
                return Parse.Promise.as('');
            };
            return beforeSavePromise().then(function () {
                console.log('Saving object', options.toClass);
                return newObject.save(null, { useMasterKey: true });
            }).fail(function () {
                console.log('beforeSavePromise failed - skipping');
                return Parse.Promise.as('');
            }).then(function () {
                return markMigratedAndSave(prevObject);
            });
        });
    }, { useMasterKey: true });
    // })
    // });
};
Parse.Cloud.define("MigrateCircuit", function (request, status) {
    migrate({
        fromClass: "Circuit",
        toClass: "TaskGroup",
        taskType: "Regular"
    }, function (attr) {
        var ignore = ['timeReset', 'timeStart', 'timeEnd', 'districtWatches', 'isMigrated'];
        if (_.includes(ignore, attr)) {
            return '';
        }
        return attr;
    }).then(function () {
        status.success("completed successfully.");
    }, function (err) {
        console.error(err);
        status.error(err.message);
    });
});
Parse.Cloud.define("MigrateCircuitUnit", function (request, status) {
    migrate({
        fromClass: "CircuitUnit",
        toClass: "Task",
        taskType: "Regular"
    }, function (attr) {
        var ignore = [
            'circuit',
            'circuitStarted',
            'guardId', 'guardName',
            'isMigrated', 'highPriority', 'isHidden', 'isAborted', 'timeStartSortable', 'timeEndSortable', 'timeStart', 'timeEnd', 'isExtra', 'isArrivedReported', 'isWithinGeofence', 'isOnfootReported', 'isStillReported', 'isDepartureReported', 'clientIdAndName'
        ];
        if (attr === 'clientPosition') {
            return 'position';
        }
        if (_.includes(ignore, attr)) {
            return '';
        }
        return attr;
    }, function (circuitUnit, newTask) {
        return migratePointer('circuitUnit', 'Task', 'task', newTask);
    }).then(function () {
        status.success("completed successfully.");
    }, function (err) {
        console.error(err);
        status.error(err.message);
    });
});
Parse.Cloud.define("MigrateStaticTask", function (request, status) {
    migrate({
        fromClass: "StaticTask",
        toClass: "Task",
        taskType: "Static"
    }, function (attr) {
        if (attr === 'clientPosition') {
            return 'position';
        }
        return attr;
    }).then(function () {
        status.success("completed successfully.");
    }, function (err) {
        console.error(err);
        status.error(err.message);
    });
});
Parse.Cloud.define("MigrateCircuitStarted", function (request, status) {
    migrate({
        fromClass: "CircuitStarted",
        toClass: "TaskGroupStarted"
    }, function (attr) {
        var ignore = [
            'circuit',
            'emailFailedContent',
            'sentMails', 'eventCount',
            'emailFailed', 'useMasterKey', 'isMigrated'
        ];
        if (_.includes(ignore, attr)) {
            return '';
        }
        return attr;
    }, function (circuitStarted, taskGroupStarted) {
        console.log('circuitStarted: ', circuitStarted);
        console.log('taskGroupStarted: ', taskGroupStarted);
        console.log('circuitStarted.get(circuit): ', circuitStarted.get('circuit'));
        return migratePointer(circuitStarted.get('circuit'), 'TaskGroup', 'taskGroup', taskGroupStarted);
    }).then(function () {
        status.success("completed successfully.");
    }, function (err) {
        console.error(err);
        status.error(err.message);
    });
});
Parse.Cloud.define("MigrateReports", function (request, status) {
    return migrateRegularTasks("Report")
        .then(function () {
        return migrateStaticTasks("Report");
    })
        .then(function () {
        status.success("MigrateReport completed successfully.");
    }, function (err) {
        console.error(err);
        status.error(err.message);
    });
});
Parse.Cloud.define("MigrateEventLogs", function (request, status) {
    return migrateStaticTasks("EventLog")
        .then(function () {
        return migrateRegularTasks("EventLog");
    }).then(function () {
        status.success("MigrateEventLogs completed successfully.");
    }, function (err) {
        console.error(err);
        status.error(err.message);
    });
});
Parse.Cloud.job("MigrateAll", function (request, status) {
    console.log('MigrateAll');
    var runTask = function (name) {
        var promise = new Parse.Promise();
        Parse.Cloud.run(name, {}).then(function () {
            return promise.resolve("Task success: " + name);
        }, function (error) {
            // error
            return promise.reject(error);
        });
        return promise;
    };
    return runTask("MigrateCircuit")
        .then(function () { return runTask("MigrateCircuitStarted"); })
        .then(function () { return runTask("MigrateCircuitUnit"); })
        .then(function () { return runTask("MigrateStaticTask"); })
        .then(function () { return runTask("MigrateEventLogs"); })
        .then(function () { return runTask("MigrateReports"); })
        .then(function () {
        status.success("MigrateAll completed successfully.");
    }, function (err) {
        status.error(err.message);
    });
});
//# sourceMappingURL=task.js.map