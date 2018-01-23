import {BaseClass} from "./BaseClass";

export interface IParsePointer<T extends BaseClass>{
    "__type": "Pointer",
    "className": string,
    "objectId": string
}