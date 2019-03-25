import {G4SCentral} from "./g4s";
import {GuardswiftCentral} from "./guardswift";
import {ICentralAlarmHandler} from "./central.interface";

export let centralAlarmHandlers: ICentralAlarmHandler[] = [
    new G4SCentral(),
    new GuardswiftCentral()
];
