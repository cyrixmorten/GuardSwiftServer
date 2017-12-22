import {G4SCentral} from "./g4s";
import {GuardswiftCentral} from "./guardswift";
import {ICentral} from "./central.interface";

export let centrals: ICentral[] = [
    new G4SCentral(),
    new GuardswiftCentral()
];
