import {G4SCentral} from "./g4s";
import {GuardswiftCentral} from "./guardswift";
import {ICentralAlarmHandler} from "./central.interface";
import {RedningsRingenCentral} from "./rednings-ringen";

export let centralAlarmHandlers: ICentralAlarmHandler[] = [
    new RedningsRingenCentral(),
    new G4SCentral(),
    new GuardswiftCentral()
];
