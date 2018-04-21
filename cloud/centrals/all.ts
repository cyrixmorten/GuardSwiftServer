import {G4SCentral} from "./g4s";
import {GuardswiftCentral} from "./guardswift";
import {ICentralParser} from "./central.interface";

export let CentralParsers: ICentralParser[] = [
    new G4SCentral(),
    new GuardswiftCentral()
];
