import {RegisterSubclasses} from "../shared/subclass/RegisterSubclasses";

let requireGlob = require('require-glob');


requireGlob('../shared/**/*.js').then((res) => {

    console.log('Registering subclasses');

    RegisterSubclasses.register();

}, (e) => {
    console.error('Failed to requireGlob for shared: ' + e);
});

requireGlob('./**/*.js').then((res) => {
    console.log('Cloud Code loaded');

}, (e) => {
    console.error('Failed to requireGlob for cloud: ' + e);
});



