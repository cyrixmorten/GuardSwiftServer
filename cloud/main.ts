import {RegisterSubclasses} from "../shared/subclass/RegisterSubclasses";
import {ResetTasks} from "./scheduled/ResetTasks";

let requireGlob = require('require-glob');

requireGlob('./**/*.js');
requireGlob('../shared/**/*.js').then((res) => {
    RegisterSubclasses.register();
});

