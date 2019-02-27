import {AllSubClasses} from "../shared/subclass/AllSubClasses";

let requireGlob = require('require-glob');


requireGlob('../shared/**/*.ts').then((res) => {

    console.log('Registering subclasses');

    AllSubClasses.register();

}, (e) => {
    console.error('Failed to requireGlob for shared: ' + e);
});

requireGlob('./**/*.ts').then((res) => {
    console.log('Cloud Code loaded');

}, (e) => {
    console.error('Failed to requireGlob for cloud: ' + e);
});



